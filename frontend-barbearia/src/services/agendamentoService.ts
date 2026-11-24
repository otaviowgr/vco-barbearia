import type {
  Agendamento,
  FormaPagamento,
  MetodoPagamento,
  Perfil,
  SlotDisponivel,
  StatusAgendamento,
} from "@/types";
import { agoraMin, diaDaSemana, hoje, horaParaMin, minParaHora, sobrepoe } from "@/lib/datas";
import { agoraISO, alterar, chamadaApi, ErroApi, gerarId, ler } from "./db";
import { calcularDesconto } from "./fidelidadeService";

export const STATUS_ATIVOS: StatusAgendamento[] = ["pendente", "confirmado", "concluido"];
const ocupaHorario = (a: Agendamento) => a.status !== "cancelado" && a.status !== "nao_compareceu";

export interface FiltroAgendamentos {
  data?: string;
  inicio?: string;
  fim?: string;
  barbeiroId?: string;
  clienteId?: string;
  status?: StatusAgendamento[];
}

export interface ConsultaHorarios {
  data: string;
  duracaoMin: number;
  /** null/undefined = qualquer barbeiro disponível */
  barbeiroId?: string | null;
  /** ao remarcar, ignora o próprio agendamento na checagem */
  ignorarAgendamentoId?: string;
}

export interface NovoAgendamento {
  clienteId: string;
  barbeiroId: string | null;
  servicoIds: string[];
  data: string;
  inicio: string;
  formaPagamento: FormaPagamento;
  metodoPagamento?: MetodoPagamento;
  /** true quando o pagamento online simulado foi aprovado */
  pagamentoAprovado?: boolean;
  criadoPor: Perfil;
  observacao?: string;
}

// ---------------- regras internas (síncronas) ----------------

function filtrar(f: FiltroAgendamentos = {}): Agendamento[] {
  return ler("agendamentos")
    .filter(
      (a) =>
        (!f.data || a.data === f.data) &&
        (!f.inicio || a.data >= f.inicio) &&
        (!f.fim || a.data <= f.fim) &&
        (!f.barbeiroId || a.barbeiroId === f.barbeiroId) &&
        (!f.clienteId || a.clienteId === f.clienteId) &&
        (!f.status || f.status.includes(a.status)),
    )
    .sort((a, b) => (a.data + a.inicio).localeCompare(b.data + b.inicio));
}

function barbeiroLivre(barbeiroId: string, data: string, ini: number, fim: number, ignorarId?: string) {
  const conflitoAg = ler("agendamentos").some(
    (a) =>
      a.id !== ignorarId &&
      a.barbeiroId === barbeiroId &&
      a.data === data &&
      ocupaHorario(a) &&
      sobrepoe(ini, fim, horaParaMin(a.inicio), horaParaMin(a.fim)),
  );
  if (conflitoAg) return false;
  return !ler("bloqueios").some(
    (b) =>
      b.barbeiroId === barbeiroId &&
      b.data === data &&
      sobrepoe(ini, fim, horaParaMin(b.inicio), horaParaMin(b.fim)),
  );
}

export function calcularHorarios(c: ConsultaHorarios): SlotDisponivel[] {
  const config = ler("config");
  const horario = config.horarios[diaDaSemana(c.data)];
  if (!horario || c.data < hoje()) return [];
  const barbeiros = ler("barbeiros").filter((b) => b.ativo && (!c.barbeiroId || b.id === c.barbeiroId));
  const abre = horaParaMin(horario.abre);
  const fecha = horaParaMin(horario.fecha);
  const minimo = c.data === hoje() ? agoraMin() + 15 : 0; // antecedência mínima de 15 min
  const slots: SlotDisponivel[] = [];
  for (let t = abre; t + c.duracaoMin <= fecha; t += config.intervaloSlotsMin) {
    if (t < minimo) continue;
    const livres = barbeiros
      .filter((b) => barbeiroLivre(b.id, c.data, t, t + c.duracaoMin, c.ignorarAgendamentoId))
      .map((b) => b.id);
    if (livres.length) slots.push({ hora: minParaHora(t), barbeiroIds: livres });
  }
  return slots;
}

/** Para "qualquer barbeiro": escolhe quem tem menos atendimentos no dia. */
function escolherBarbeiro(ids: string[], data: string): string {
  const carga = (id: string) =>
    ler("agendamentos").filter((a) => a.barbeiroId === id && a.data === data && ocupaHorario(a)).length;
  return [...ids].sort((a, b) => carga(a) - carga(b))[0];
}

function obterOuFalhar(id: string): Agendamento {
  const a = ler("agendamentos").find((x) => x.id === id);
  if (!a) throw new ErroApi("Agendamento não encontrado", 404);
  return a;
}

function atualizar(id: string, mudancas: Partial<Agendamento>): Agendamento {
  let atualizado!: Agendamento;
  alterar("agendamentos", (lista) =>
    lista.map((a) => {
      if (a.id !== id) return a;
      atualizado = { ...a, ...mudancas, atualizadoEm: agoraISO() };
      return atualizado;
    }),
  );
  return atualizado;
}

function exigirStatus(a: Agendamento, permitidos: StatusAgendamento[], acao: string) {
  if (!permitidos.includes(a.status)) {
    throw new ErroApi(`Não é possível ${acao} um agendamento com status "${a.status}".`);
  }
}

// ---------------- API simulada ----------------

export const agendamentoService = {
  listar: (filtro?: FiltroAgendamentos) => chamadaApi(() => filtrar(filtro)),

  obter: (id: string) => chamadaApi(() => obterOuFalhar(id)),

  horariosDisponiveis: (consulta: ConsultaHorarios) =>
    chamadaApi(() => calcularHorarios(consulta), { min: 150, max: 400 }),

  contarNaoVistos: (barbeiroId?: string) =>
    chamadaApi(
      () =>
        ler("agendamentos").filter(
          (a) => !a.vistoPeloBarbeiro && ocupaHorario(a) && (!barbeiroId || a.barbeiroId === barbeiroId),
        ).length,
      { min: 0, max: 50 },
    ),

  criar: (dados: NovoAgendamento) =>
    chamadaApi(() => {
      if (!dados.servicoIds.length) throw new ErroApi("Escolha pelo menos um serviço.");
      const mapa = new Map(ler("servicos").map((s) => [s.id, s]));
      const itens = dados.servicoIds.map((id) => {
        const s = mapa.get(id);
        if (!s || !s.ativo) throw new ErroApi("Serviço indisponível.");
        return s;
      });
      const duracaoMin = itens.reduce((t, s) => t + s.duracaoMin, 0);
      const valorOriginal = itens.reduce((t, s) => t + s.preco, 0);

      const slot = calcularHorarios({ data: dados.data, duracaoMin, barbeiroId: dados.barbeiroId }).find(
        (s) => s.hora === dados.inicio,
      );
      if (!slot) throw new ErroApi("Esse horário acabou de ser ocupado. Escolha outro, por favor.", 409);
      const barbeiroId = dados.barbeiroId ?? escolherBarbeiro(slot.barbeiroIds, dados.data);

      if (dados.formaPagamento === "online" && !dados.pagamentoAprovado) {
        throw new ErroApi("Pagamento online não aprovado.", 402);
      }

      const { desconto, aplicado } = calcularDesconto(dados.clienteId, valorOriginal);
      const ini = horaParaMin(dados.inicio);
      const agora = agoraISO();
      const novo: Agendamento = {
        id: gerarId("agd"),
        clienteId: dados.clienteId,
        barbeiroId,
        servicos: itens.map((s) => ({ id: s.id, nome: s.nome, preco: s.preco, duracaoMin: s.duracaoMin })),
        data: dados.data,
        inicio: dados.inicio,
        fim: minParaHora(ini + duracaoMin),
        duracaoMin,
        valorOriginal,
        desconto,
        valorFinal: Math.round((valorOriginal - desconto) * 100) / 100,
        descontoFidelidade: aplicado,
        formaPagamento: dados.formaPagamento,
        metodoPagamento: dados.formaPagamento === "online" ? dados.metodoPagamento : undefined,
        statusPagamento: dados.formaPagamento === "online" ? "pago" : "pendente",
        status: dados.criadoPor === "barbeiro" ? "confirmado" : "pendente",
        criadoPor: dados.criadoPor,
        criadoEm: agora,
        atualizadoEm: agora,
        vistoPeloBarbeiro: dados.criadoPor === "barbeiro",
        observacao: dados.observacao,
      };
      alterar("agendamentos", (lista) => [...lista, novo]);
      return novo;
    }, { min: 500, max: 900 }),

  confirmar: (id: string) =>
    chamadaApi(() => {
      exigirStatus(obterOuFalhar(id), ["pendente"], "confirmar");
      return atualizar(id, { status: "confirmado", vistoPeloBarbeiro: true });
    }),

  /** Conclui o atendimento. Se o pagamento era na barbearia, registra o método usado. */
  concluir: (id: string, metodoNaBarbearia?: MetodoPagamento) =>
    chamadaApi(() => {
      const a = obterOuFalhar(id);
      exigirStatus(a, ["pendente", "confirmado"], "concluir");
      if (a.statusPagamento !== "pago" && !metodoNaBarbearia) {
        throw new ErroApi("Informe como o cliente pagou (dinheiro, Pix ou cartão).");
      }
      return atualizar(id, {
        status: "concluido",
        statusPagamento: "pago",
        metodoPagamento: a.statusPagamento === "pago" ? a.metodoPagamento : metodoNaBarbearia,
        vistoPeloBarbeiro: true,
      });
    }),

  remarcar: (id: string, novo: { data: string; inicio: string; barbeiroId?: string }, por: Perfil) =>
    chamadaApi(() => {
      const a = obterOuFalhar(id);
      exigirStatus(a, ["pendente", "confirmado"], "remarcar");
      const barbeiroId = novo.barbeiroId ?? a.barbeiroId;
      const ok = calcularHorarios({
        data: novo.data,
        duracaoMin: a.duracaoMin,
        barbeiroId,
        ignorarAgendamentoId: id,
      }).some((s) => s.hora === novo.inicio);
      if (!ok) throw new ErroApi("Horário indisponível para remarcação.", 409);
      return atualizar(id, {
        data: novo.data,
        inicio: novo.inicio,
        fim: minParaHora(horaParaMin(novo.inicio) + a.duracaoMin),
        barbeiroId,
        status: por === "barbeiro" ? "confirmado" : "pendente",
        vistoPeloBarbeiro: por === "barbeiro",
      });
    }),

  cancelar: (id: string, por: Perfil, motivo?: string) =>
    chamadaApi(() => {
      const a = obterOuFalhar(id);
      exigirStatus(a, ["pendente", "confirmado"], "cancelar");
      return atualizar(id, {
        status: "cancelado",
        // pagamento online simulado é estornado automaticamente
        statusPagamento: a.statusPagamento === "pago" ? "estornado" : a.statusPagamento,
        vistoPeloBarbeiro: por === "barbeiro" ? true : false,
        observacao: motivo ? `Cancelado por ${por}: ${motivo}` : a.observacao,
      });
    }),

  marcarNaoCompareceu: (id: string) =>
    chamadaApi(() => {
      exigirStatus(obterOuFalhar(id), ["pendente", "confirmado"], "marcar falta em");
      return atualizar(id, { status: "nao_compareceu", vistoPeloBarbeiro: true });
    }),

  marcarComoVistos: (ids: string[]) =>
    chamadaApi(
      () => {
        const set = new Set(ids);
        alterar("agendamentos", (lista) =>
          lista.map((a) => (set.has(a.id) && !a.vistoPeloBarbeiro ? { ...a, vistoPeloBarbeiro: true } : a)),
        );
      },
      { min: 0, max: 50 },
    ),
};

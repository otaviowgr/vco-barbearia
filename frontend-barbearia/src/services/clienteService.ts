import type { Agendamento, Cliente, ProgressoFidelidade } from "@/types";
import { hoje } from "@/lib/datas";
import { formatarTelefone } from "@/lib/formatadores";
import { agoraISO, alterar, chamadaApi, ErroApi, gerarId, ler } from "./db";
import { calcularProgresso } from "./fidelidadeService";

export interface ClienteResumo extends Cliente {
  totalGasto: number;
  atendimentos: number;
  ultimaVisita?: string;
  proximoAgendamento?: Agendamento;
  fidelidade: ProgressoFidelidade;
}

export interface FichaCliente extends ClienteResumo {
  historico: Agendamento[];
  faltas: number;
  cancelamentos: number;
}

function resumir(c: Cliente, todos: Agendamento[]): FichaCliente {
  const meus = todos
    .filter((a) => a.clienteId === c.id)
    .sort((a, b) => (b.data + b.inicio).localeCompare(a.data + a.inicio));
  const concluidos = meus.filter((a) => a.status === "concluido");
  const hj = hoje();
  const futuros = meus
    .filter((a) => (a.status === "pendente" || a.status === "confirmado") && a.data >= hj)
    .reverse();
  return {
    ...c,
    totalGasto: concluidos.reduce((t, a) => t + a.valorFinal, 0),
    atendimentos: concluidos.length,
    ultimaVisita: concluidos[0]?.data,
    proximoAgendamento: futuros[0],
    fidelidade: calcularProgresso(c.id, todos),
    historico: meus,
    faltas: meus.filter((a) => a.status === "nao_compareceu").length,
    cancelamentos: meus.filter((a) => a.status === "cancelado").length,
  };
}

const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export const clienteService = {
  /** Lista simples (id, nome, contato), sem estatísticas. */
  listarBasico: () =>
    chamadaApi(() => [...ler("clientes")].sort((a, b) => a.nome.localeCompare(b.nome)), { min: 50, max: 150 }),

  listar: (busca = "") =>
    chamadaApi((): ClienteResumo[] => {
      const todos = ler("agendamentos");
      const termo = normalizar(busca.trim());
      const digitos = busca.replace(/\D/g, "");
      return ler("clientes")
        .filter(
          (c) =>
            !termo ||
            normalizar(c.nome).includes(termo) ||
            c.email.toLowerCase().includes(termo) ||
            (digitos.length > 2 && c.telefone.replace(/\D/g, "").includes(digitos)),
        )
        .map((c) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { historico, faltas, cancelamentos, ...resumo } = resumir(c, todos);
          return resumo;
        })
        .sort((a, b) => a.nome.localeCompare(b.nome));
    }),

  obterFicha: (id: string) =>
    chamadaApi(() => {
      const c = ler("clientes").find((x) => x.id === id);
      if (!c) throw new ErroApi("Cliente não encontrado", 404);
      return resumir(c, ler("agendamentos"));
    }),

  criar: (dados: { nome: string; telefone: string; email?: string }) =>
    chamadaApi(() => {
      if (!dados.nome.trim()) throw new ErroApi("Informe o nome do cliente.");
      const novo: Cliente = {
        id: gerarId("cli"),
        nome: dados.nome.trim(),
        telefone: formatarTelefone(dados.telefone),
        email: dados.email?.trim() ?? "",
        criadoEm: agoraISO(),
      };
      alterar("clientes", (l) => [...l, novo]);
      return novo;
    }),

  atualizar: (id: string, dados: Partial<Omit<Cliente, "id">>) =>
    chamadaApi(() => {
      let r!: Cliente;
      alterar("clientes", (l) => l.map((c) => (c.id === id ? (r = { ...c, ...dados }) : c)));
      if (!r) throw new ErroApi("Cliente não encontrado", 404);
      return r;
    }),
};

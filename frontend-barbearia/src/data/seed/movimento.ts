// Gera o "movimento" fictício da barbearia (agendamentos, despesas e bloqueios)
// relativo à data de hoje: ~12 meses de histórico + ~10 dias de agenda futura.
// Usa um gerador pseudoaleatório com semente fixa: os dados são sempre parecidos.

import type {
  Agendamento,
  Barbeiro,
  Bloqueio,
  ConfigBarbearia,
  Despesa,
  MetodoPagamento,
  Servico,
  StatusAgendamento,
} from "@/types";
import {
  agoraMin,
  deISODate,
  diaDaSemana,
  diferencaDias,
  horaParaMin,
  inicioDoMes,
  minParaHora,
  paraISODate,
  somarDias,
  somarMeses,
  sobrepoe,
} from "@/lib/datas";
import { CLIENTE_DEMO_ID, BARBEIRO_DEMO_ID } from "./catalogo";

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COMBOS: { ids: string[]; peso: number }[] = [
  { ids: ["srv-corte"], peso: 30 },
  { ids: ["srv-combo"], peso: 24 },
  { ids: ["srv-degrade"], peso: 16 },
  { ids: ["srv-barba"], peso: 10 },
  { ids: ["srv-corte", "srv-sobrancelha"], peso: 5 },
  { ids: ["srv-degrade", "srv-barba"], peso: 4 },
  { ids: ["srv-pigmentacao"], peso: 4 },
  { ids: ["srv-hidratacao"], peso: 3 },
  { ids: ["srv-combo", "srv-hidratacao"], peso: 2 },
  { ids: ["srv-sobrancelha"], peso: 2 },
];

// clientes fictícios com "frequência" diferente (peso)
const CLIENTES_PESO: [string, number][] = [
  ["cli-pedro", 14],
  ["cli-marcos", 12],
  ["cli-felipe", 10],
  ["cli-gabriel", 10],
  ["cli-thiago", 9],
  ["cli-bruno", 8],
  ["cli-andre", 7],
  ["cli-rodrigo", 7],
  ["cli-matheus", 6],
  ["cli-diego", 5],
  ["cli-vitor", 4],
];

const r2 = (v: number) => Math.round(v * 100) / 100;

interface Rascunho extends Omit<Agendamento, "id" | "desconto" | "valorFinal" | "descontoFidelidade"> {
  fixo?: boolean;
}

export function gerarMovimento(
  config: ConfigBarbearia,
  servicos: Servico[],
  barbeiros: Barbeiro[],
  hojeStr: string,
): { agendamentos: Agendamento[]; despesas: Despesa[]; bloqueios: Bloqueio[] } {
  const rnd = mulberry32(20261123);
  const randInt = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
  const escolherPeso = <T>(itens: [T, number][]): T => {
    const total = itens.reduce((s, [, p]) => s + p, 0);
    let r = rnd() * total;
    for (const [item, p] of itens) {
      if ((r -= p) < 0) return item;
    }
    return itens[itens.length - 1][0];
  };
  const mapaServ = new Map(servicos.map((s) => [s.id, s]));
  const agora = agoraMin();
  const passo = config.intervaloSlotsMin;

  // ocupação por barbeiro+data, para não gerar sobreposição
  const ocupacao = new Map<string, [number, number][]>();
  const ocupar = (b: string, d: string, ini: number, fim: number) => {
    const k = `${b}|${d}`;
    if (!ocupacao.has(k)) ocupacao.set(k, []);
    ocupacao.get(k)!.push([ini, fim]);
  };
  const livre = (b: string, d: string, ini: number, fim: number) =>
    !(ocupacao.get(`${b}|${d}`) ?? []).some(([a, z]) => sobrepoe(ini, fim, a, z));

  const isoCriacao = (data: string, diasAntes: number) => {
    const d = deISODate(data);
    d.setDate(d.getDate() - diasAntes);
    d.setHours(randInt(8, 21), randInt(0, 59));
    return d.toISOString();
  };

  const montar = (
    clienteId: string,
    barbeiroId: string,
    servicoIds: string[],
    data: string,
    inicioMin: number,
    status: StatusAgendamento,
    pagamento: { forma: "online" | "na_barbearia"; metodo?: MetodoPagamento; pago: boolean },
    fixo = false,
  ): Rascunho => {
    const itens = servicoIds.map((id) => mapaServ.get(id)!);
    const duracaoMin = itens.reduce((s, x) => s + x.duracaoMin, 0);
    const valorOriginal = itens.reduce((s, x) => s + x.preco, 0);
    const criadoEm = isoCriacao(data, randInt(0, 6));
    return {
      clienteId,
      barbeiroId,
      servicos: itens.map((s) => ({ id: s.id, nome: s.nome, preco: s.preco, duracaoMin: s.duracaoMin })),
      data,
      inicio: minParaHora(inicioMin),
      fim: minParaHora(inicioMin + duracaoMin),
      duracaoMin,
      valorOriginal,
      formaPagamento: pagamento.forma,
      metodoPagamento: pagamento.metodo,
      statusPagamento: pagamento.pago ? "pago" : "pendente",
      status,
      criadoPor: rnd() < 0.7 ? "cliente" : "barbeiro",
      criadoEm,
      atualizadoEm: criadoEm,
      vistoPeloBarbeiro: true,
      fixo,
    };
  };

  const rascunhos: Rascunho[] = [];
  const bloqueios: Bloqueio[] = [];

  // ---------- Bloqueios de exemplo ----------
  const proxAberto = (d: string) => {
    let x = d;
    while (!config.horarios[diaDaSemana(x)]) x = somarDias(x, 1);
    return x;
  };
  const diaBloq = proxAberto(somarDias(hojeStr, 2));
  bloqueios.push({
    id: "blq-1",
    barbeiroId: "brb-rafael",
    data: diaBloq,
    inicio: "14:00",
    fim: "16:00",
    motivo: "Consulta médica",
  });
  ocupar("brb-rafael", diaBloq, horaParaMin("14:00"), horaParaMin("16:00"));

  // ---------- Histórico fixo do cliente demo (João) ----------
  // 9 atendimentos concluídos → falta 1 para ganhar o próximo desconto.
  for (let k = 0; k < 9; k++) {
    const data = proxAberto(somarDias(hojeStr, -(305 - k * 33)));
    const comRafael = k % 3 === 2;
    const r = montar(
      CLIENTE_DEMO_ID,
      comRafael ? "brb-rafael" : BARBEIRO_DEMO_ID,
      comRafael ? ["srv-degrade"] : k % 2 === 0 ? ["srv-combo"] : ["srv-corte"],
      data,
      horaParaMin("10:00"),
      "concluido",
      k % 4 === 1
        ? { forma: "online", metodo: "pix", pago: true }
        : { forma: "na_barbearia", metodo: k % 2 ? "cartao" : "pix", pago: true },
      true,
    );
    rascunhos.push(r);
    ocupar(r.barbeiroId, data, horaParaMin(r.inicio), horaParaMin(r.fim));
  }
  {
    // um cancelado recente
    const data = proxAberto(somarDias(hojeStr, -18));
    const r = montar(CLIENTE_DEMO_ID, BARBEIRO_DEMO_ID, ["srv-corte"], data, horaParaMin("18:00"), "cancelado", { forma: "na_barbearia", pago: false }, true);
    rascunhos.push(r);
  }
  {
    // um futuro já confirmado
    const data = proxAberto(somarDias(hojeStr, 3));
    const r = montar(CLIENTE_DEMO_ID, BARBEIRO_DEMO_ID, ["srv-combo"], data, horaParaMin("10:00"), "confirmado", { forma: "na_barbearia", pago: false }, true);
    r.criadoPor = "cliente";
    rascunhos.push(r);
    ocupar(r.barbeiroId, data, horaParaMin(r.inicio), horaParaMin(r.fim));
  }

  // ---------- Movimento geral ----------
  const inicioHist = somarMeses(inicioDoMes(hojeStr), -12);
  const fimAgenda = somarDias(hojeStr, 10);
  const totalDias = diferencaDias(inicioHist, fimAgenda);
  const ativos = barbeiros.filter((b) => b.ativo);

  for (let i = 0; i <= totalDias; i++) {
    const data = somarDias(inicioHist, i);
    const dow = diaDaSemana(data);
    const horario = config.horarios[dow];
    if (!horario) continue;
    const diff = diferencaDias(hojeStr, data); // <0 passado, 0 hoje, >0 futuro
    const abre = horaParaMin(horario.abre);
    const fecha = horaParaMin(horario.fecha);
    const mes = deISODate(data).getMonth();

    // sazonalidade: crescimento ao longo do ano, pico em dezembro, sábado cheio
    const crescimento = 0.85 + (i / totalDias) * 0.3;
    const sazonal = mes === 11 ? 1.3 : mes === 0 || mes === 6 ? 0.85 : 1;
    const fatorDia = (dow === 6 ? 1.35 : dow === 5 ? 1.15 : 1) * crescimento * sazonal;

    for (const b of ativos) {
      const fatorBarb = b.id === BARBEIRO_DEMO_ID ? 1.15 : b.id === "brb-rafael" ? 1 : 0.85;
      let n: number;
      if (diff <= 0) n = Math.round((1.6 + rnd() * 2) * fatorDia * fatorBarb);
      else n = diff <= 3 ? randInt(1, 4) : randInt(0, 3);

      let cursor = abre + (rnd() < 0.5 ? 0 : passo);
      let colocados = 0;
      while (colocados < n) {
        cursor += passo * (rnd() < 0.5 ? 0 : randInt(1, 3));
        const combo = escolherPeso(COMBOS.map((c) => [c.ids, c.peso] as [string[], number]));
        const dur = combo.reduce((s, id) => s + mapaServ.get(id)!.duracaoMin, 0);
        if (cursor + dur > fecha) break;
        if (!livre(b.id, data, cursor, cursor + dur)) {
          cursor += passo;
          continue;
        }
        const jaPassou = diff < 0 || (diff === 0 && cursor + dur <= agora);
        let status: StatusAgendamento;
        let pagamento: { forma: "online" | "na_barbearia"; metodo?: MetodoPagamento; pago: boolean };
        if (jaPassou) {
          const r = rnd();
          status = r < 0.05 ? "nao_compareceu" : r < 0.09 ? "cancelado" : "concluido";
          if (status === "concluido") {
            pagamento =
              rnd() < 0.25
                ? { forma: "online", metodo: rnd() < 0.6 ? "pix" : "cartao", pago: true }
                : { forma: "na_barbearia", metodo: escolherPeso<MetodoPagamento>([["dinheiro", 30], ["pix", 45], ["cartao", 25]]), pago: true };
          } else {
            pagamento = { forma: "na_barbearia", pago: false };
          }
        } else {
          status = rnd() < 0.65 ? "confirmado" : "pendente";
          pagamento =
            rnd() < 0.3
              ? { forma: "online", metodo: rnd() < 0.6 ? "pix" : "cartao", pago: true }
              : { forma: "na_barbearia", pago: false };
        }
        const clienteId = escolherPeso(CLIENTES_PESO);
        const r = montar(clienteId, b.id, combo, data, cursor, status, pagamento);
        rascunhos.push(r);
        ocupar(b.id, data, cursor, cursor + dur);
        cursor += Math.ceil(dur / passo) * passo;
        colocados++;
      }
    }
  }

  // ---------- Ordena e aplica a regra de fidelidade cronologicamente ----------
  rascunhos.sort((a, b) => (a.data + a.inicio).localeCompare(b.data + b.inicio));
  const { meta, percentual } = config.fidelidade;
  const conta = new Map<string, { concluidos: number; usados: number }>();

  const agendamentos: Agendamento[] = rascunhos.map((r, idx) => {
    const { fixo: _fixo, ...base } = r;
    void _fixo;
    const c = conta.get(r.clienteId) ?? { concluidos: 0, usados: 0 };
    conta.set(r.clienteId, c);
    let desconto = 0;
    let descontoFidelidade = false;
    const conta_uso = r.status !== "cancelado" && r.status !== "nao_compareceu";
    if (conta_uso && Math.floor(c.concluidos / meta) - c.usados > 0) {
      desconto = r2((r.valorOriginal * percentual) / 100);
      descontoFidelidade = true;
      c.usados++;
    }
    if (r.status === "concluido") c.concluidos++;
    return {
      ...base,
      id: `agd-${String(idx + 1).padStart(5, "0")}`,
      desconto,
      valorFinal: r2(r.valorOriginal - desconto),
      descontoFidelidade,
    };
  });

  // Um agendamento de amanhã chega como "Novo" para o barbeiro ver o destaque
  const amanha = proxAberto(somarDias(hojeStr, 1));
  const novo = agendamentos.find(
    (a) => a.data === amanha && a.barbeiroId === BARBEIRO_DEMO_ID && a.clienteId !== CLIENTE_DEMO_ID,
  );
  if (novo) {
    novo.status = "pendente";
    novo.vistoPeloBarbeiro = false;
    novo.criadoPor = "cliente";
    novo.criadoEm = novo.atualizadoEm = new Date(Date.now() - 40 * 60000).toISOString();
  }

  // ---------- Despesas mensais ----------
  const despesas: Despesa[] = [];
  let did = 0;
  const addDesp = (data: string, descricao: string, categoria: Despesa["categoria"], valor: number) => {
    if (data > hojeStr) return;
    despesas.push({ id: `dsp-${++did}`, data, descricao, categoria, valor: r2(valor) });
  };
  for (let m = 0; m <= 12; m++) {
    const ini = somarMeses(inicioHist, m);
    const dia = (d: number) => paraISODate(new Date(deISODate(ini).getFullYear(), deISODate(ini).getMonth(), d));
    addDesp(dia(5), "Aluguel do salão", "aluguel", 2800);
    addDesp(dia(10), "Produtos (pomadas, óleos, lâminas)", "produtos", 650 + rnd() * 450);
    addDesp(dia(15), "Conta de energia", "contas", 280 + rnd() * 120);
    addDesp(dia(15), "Conta de água", "contas", 90 + rnd() * 50);
    addDesp(dia(20), "Internet e telefone", "contas", 129.9);
    addDesp(dia(12), "Sistema e maquininha (taxas)", "contas", 180 + rnd() * 90);
    if (rnd() < 0.5) addDesp(dia(8), "Anúncios no Instagram", "marketing", 200 + rnd() * 250);
    if (rnd() < 0.25) addDesp(dia(18), "Manutenção de máquinas", "manutencao", 150 + rnd() * 300);
  }
  despesas.sort((a, b) => a.data.localeCompare(b.data));

  return { agendamentos, despesas, bloqueios };
}

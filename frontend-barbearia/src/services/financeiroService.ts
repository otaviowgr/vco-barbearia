// Faturamento considera apenas atendimentos CONCLUÍDOS e PAGOS,
// pela data do atendimento.
import type {
  Agendamento,
  FiltroFinanceiro,
  MetodoPagamento,
  PontoSerie,
  RankingBarbeiro,
  ResumoFinanceiro,
} from "@/types";
import { diasNoMes, diferencaDias, fimDoMes, hoje, nomeMesCurto, somarDias, somarMeses } from "@/lib/datas";
import { chamadaApi, ler } from "./db";

const r2 = (v: number) => Math.round(v * 100) / 100;

const faturado = (a: Agendamento) => a.status === "concluido" && a.statusPagamento === "pago";

function noFiltro(a: Agendamento, f: Partial<FiltroFinanceiro>) {
  return (
    (!f.inicio || a.data >= f.inicio) &&
    (!f.fim || a.data <= f.fim) &&
    (!f.barbeiroId || a.barbeiroId === f.barbeiroId) &&
    (!f.metodo || a.metodoPagamento === f.metodo)
  );
}

function calcularResumo(f: FiltroFinanceiro): ResumoFinanceiro {
  const doPeriodo = ler("agendamentos").filter(
    (a) => a.data >= f.inicio && a.data <= f.fim && (!f.barbeiroId || a.barbeiroId === f.barbeiroId),
  );
  const pagos = doPeriodo.filter((a) => faturado(a) && noFiltro(a, f));
  const faturamento = pagos.reduce((t, a) => t + a.valorFinal, 0);

  const contagem = new Map<string, number>();
  for (const a of pagos) for (const s of a.servicos) contagem.set(s.nome, (contagem.get(s.nome) ?? 0) + 1);
  const top = [...contagem.entries()].sort((a, b) => b[1] - a[1])[0];

  const concluidos = doPeriodo.filter((a) => a.status === "concluido").length;
  const faltas = doPeriodo.filter((a) => a.status === "nao_compareceu").length;

  const despesas = ler("despesas")
    .filter((d) => d.data >= f.inicio && d.data <= f.fim)
    .reduce((t, d) => t + d.valor, 0);

  const porMetodo: Record<MetodoPagamento, number> = { dinheiro: 0, pix: 0, cartao: 0 };
  for (const a of pagos) if (a.metodoPagamento) porMetodo[a.metodoPagamento] += a.valorFinal;

  return {
    faturamento: r2(faturamento),
    atendimentos: pagos.length,
    ticketMedio: pagos.length ? r2(faturamento / pagos.length) : 0,
    descontos: r2(pagos.reduce((t, a) => t + a.desconto, 0)),
    despesas: r2(despesas),
    lucro: r2(faturamento - despesas),
    taxaFaltas: concluidos + faltas ? faltas / (concluidos + faltas) : 0,
    servicoMaisVendido: top ? { nome: top[0], quantidade: top[1] } : null,
    porMetodo: {
      dinheiro: r2(porMetodo.dinheiro),
      pix: r2(porMetodo.pix),
      cartao: r2(porMetodo.cartao),
    },
  };
}

/** Período anterior de mesmo tamanho (ex.: mês passado, ontem, ano passado). */
export function periodoAnterior(f: FiltroFinanceiro): FiltroFinanceiro {
  const ehMesCheio = f.inicio.endsWith("-01") && f.fim === fimDoMes(f.inicio);
  const ehAnoCheio = f.inicio.endsWith("-01-01") && f.fim.endsWith("-12-31") && f.inicio.slice(0, 4) === f.fim.slice(0, 4);
  if (ehAnoCheio) {
    const ano = Number(f.inicio.slice(0, 4)) - 1;
    return { ...f, inicio: `${ano}-01-01`, fim: `${ano}-12-31` };
  }
  if (ehMesCheio) {
    const ini = somarMeses(f.inicio, -1);
    return { ...f, inicio: ini, fim: fimDoMes(ini) };
  }
  const dias = diferencaDias(f.inicio, f.fim) + 1;
  return { ...f, inicio: somarDias(f.inicio, -dias), fim: somarDias(f.fim, -dias) };
}

function somaPorChave(f: Partial<FiltroFinanceiro>, chave: (a: Agendamento) => string) {
  const m = new Map<string, number>();
  for (const a of ler("agendamentos")) {
    if (!faturado(a) || !noFiltro(a, f)) continue;
    const k = chave(a);
    m.set(k, (m.get(k) ?? 0) + a.valorFinal);
  }
  return m;
}

/**
 * Se o período atual ainda está em andamento (ex.: mês corrente até hoje),
 * compara com o mesmo número de dias do período anterior.
 */
export function periodoComparavel(f: FiltroFinanceiro): FiltroFinanceiro {
  const ant = periodoAnterior(f);
  const hj = hoje();
  if (f.inicio <= hj && f.fim > hj) {
    const limite = somarDias(ant.inicio, diferencaDias(f.inicio, hj));
    if (limite < ant.fim) return { ...ant, fim: limite };
  }
  return ant;
}

export const financeiroService = {
  resumo: (f: FiltroFinanceiro) =>
    chamadaApi(() => {
      const anterior = periodoComparavel(f);
      return { atual: calcularResumo(f), anterior: calcularResumo(anterior), periodoAnterior: anterior };
    }),

  /** Faturamento por dia de um mês ("YYYY-MM"), com o mesmo dia do mês anterior. */
  porDiaDoMes: (mes: string, f: Omit<Partial<FiltroFinanceiro>, "inicio" | "fim"> = {}) =>
    chamadaApi((): PontoSerie[] => {
      const ini = `${mes}-01`;
      const iniAnt = somarMeses(ini, -1);
      const atual = somaPorChave({ ...f, inicio: ini, fim: fimDoMes(ini) }, (a) => a.data.slice(8, 10));
      const ant = somaPorChave({ ...f, inicio: iniAnt, fim: fimDoMes(iniAnt) }, (a) => a.data.slice(8, 10));
      return Array.from({ length: diasNoMes(ini) }, (_, i) => {
        const d = String(i + 1).padStart(2, "0");
        return { rotulo: String(i + 1), valor: r2(atual.get(d) ?? 0), anterior: r2(ant.get(d) ?? 0) };
      });
    }),

  /** Faturamento por mês de um ano, com o mesmo mês do ano anterior. */
  porMesDoAno: (ano: number, f: Omit<Partial<FiltroFinanceiro>, "inicio" | "fim"> = {}) =>
    chamadaApi((): PontoSerie[] => {
      const atual = somaPorChave({ ...f, inicio: `${ano}-01-01`, fim: `${ano}-12-31` }, (a) => a.data.slice(5, 7));
      const ant = somaPorChave({ ...f, inicio: `${ano - 1}-01-01`, fim: `${ano - 1}-12-31` }, (a) => a.data.slice(5, 7));
      return Array.from({ length: 12 }, (_, i) => {
        const m = String(i + 1).padStart(2, "0");
        // mês sem histórico no ano anterior fica em branco (sem linha), em vez de zero
        return { rotulo: nomeMesCurto(i), valor: r2(atual.get(m) ?? 0), anterior: ant.has(m) ? r2(ant.get(m)!) : null };
      });
    }),

  rankingBarbeiros: (f: FiltroFinanceiro) =>
    chamadaApi((): RankingBarbeiro[] => {
      const barbeiros = ler("barbeiros");
      const pagos = ler("agendamentos").filter((a) => faturado(a) && noFiltro(a, { ...f, barbeiroId: undefined }));
      return barbeiros
        .map((b) => {
          const meus = pagos.filter((a) => a.barbeiroId === b.id);
          return {
            barbeiroId: b.id,
            nome: b.nome,
            cor: b.cor,
            faturamento: r2(meus.reduce((t, a) => t + a.valorFinal, 0)),
            atendimentos: meus.length,
          };
        })
        .filter((r) => r.atendimentos > 0 || barbeiros.find((b) => b.id === r.barbeiroId)?.ativo)
        .sort((a, b) => b.faturamento - a.faturamento);
    }),
};

import type { Agendamento, ProgressoFidelidade } from "@/types";
import { chamadaApi, ler } from "./db";

/**
 * Regra: a cada `meta` atendimentos concluídos o cliente ganha 1 desconto
 * de `percentual`% no próximo agendamento. O desconto é "consumido" quando
 * um agendamento é criado com ele (e devolvido se esse agendamento for
 * cancelado ou o cliente faltar).
 */
export function calcularProgresso(clienteId: string, agendamentos?: Agendamento[]): ProgressoFidelidade {
  const { meta, percentual } = ler("config").fidelidade;
  const lista = (agendamentos ?? ler("agendamentos")).filter((a) => a.clienteId === clienteId);
  const concluidos = lista.filter((a) => a.status === "concluido").length;
  const usados = lista.filter(
    (a) => a.descontoFidelidade && a.status !== "cancelado" && a.status !== "nao_compareceu",
  ).length;
  const conquistados = Math.floor(concluidos / meta);
  const progressoCiclo = concluidos % meta;
  return {
    meta,
    percentual,
    concluidos,
    progressoCiclo,
    faltam: meta - progressoCiclo,
    descontoDisponivel: conquistados - usados > 0,
  };
}

export function calcularDesconto(clienteId: string, valor: number) {
  const p = calcularProgresso(clienteId);
  const desconto = p.descontoDisponivel ? Math.round(valor * p.percentual) / 100 : 0;
  return { desconto, aplicado: p.descontoDisponivel, percentual: p.percentual };
}

export const fidelidadeService = {
  obterProgresso: (clienteId: string) => chamadaApi(() => calcularProgresso(clienteId)),
  simularDesconto: (clienteId: string, valor: number) =>
    chamadaApi(() => calcularDesconto(clienteId, valor), { min: 80, max: 200 }),
};

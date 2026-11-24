import type { FormaPagamento, MetodoPagamento, StatusAgendamento, StatusPagamento } from "@/types";

type Cor = "ouro" | "verde" | "vermelho" | "azul" | "cinza" | "amarelo" | "roxo";

export const STATUS_AGENDAMENTO: Record<StatusAgendamento, { rotulo: string; cor: Cor }> = {
  pendente: { rotulo: "Aguardando confirmação", cor: "amarelo" },
  confirmado: { rotulo: "Confirmado", cor: "azul" },
  concluido: { rotulo: "Concluído", cor: "verde" },
  cancelado: { rotulo: "Cancelado", cor: "vermelho" },
  nao_compareceu: { rotulo: "Não compareceu", cor: "cinza" },
};

export const STATUS_PAGAMENTO: Record<StatusPagamento, { rotulo: string; cor: Cor }> = {
  pendente: { rotulo: "A pagar", cor: "amarelo" },
  pago: { rotulo: "Pago", cor: "verde" },
  estornado: { rotulo: "Estornado", cor: "cinza" },
};

export const METODO_PAGAMENTO: Record<MetodoPagamento, string> = {
  pix: "Pix",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
};

export const FORMA_PAGAMENTO: Record<FormaPagamento, string> = {
  online: "Pago online",
  na_barbearia: "Pagar na barbearia",
};

export function descreverPagamento(a: {
  formaPagamento: FormaPagamento;
  metodoPagamento?: MetodoPagamento;
  statusPagamento: StatusPagamento;
}) {
  if (a.statusPagamento === "pago" && a.metodoPagamento) {
    return `${METODO_PAGAMENTO[a.metodoPagamento]} · ${a.formaPagamento === "online" ? "online" : "na barbearia"}`;
  }
  if (a.statusPagamento === "estornado") return "Valor estornado";
  return FORMA_PAGAMENTO[a.formaPagamento];
}

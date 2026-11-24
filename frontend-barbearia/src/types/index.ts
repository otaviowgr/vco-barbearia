// =============================================================
// Tipos do domínio da VCO Barbearia.
// Espelham as futuras entidades do back-end (Spring Boot + MySQL).
// Datas: "YYYY-MM-DD" | Horários: "HH:mm" | Timestamps: ISO string
// =============================================================

export type Perfil = "cliente" | "barbeiro";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha: string; // apenas protótipo! Nunca guardar senha em texto puro num sistema real.
  telefone: string;
  perfil: Perfil;
  clienteId?: string; // quando perfil = cliente
  barbeiroId?: string; // quando perfil = barbeiro
  isAdmin?: boolean;
}

export interface Sessao {
  usuarioId: string;
  perfil: Perfil;
  nome: string;
  clienteId?: string;
  barbeiroId?: string;
  isAdmin?: boolean;
}

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  criadoEm: string;
  observacoes?: string;
}

export interface Barbeiro {
  id: string;
  nome: string;
  especialidade: string;
  bio: string;
  foto: string;
  telefone: string;
  cor: string; // cor de identificação na agenda
  ativo: boolean;
  temLogin: boolean;
}

export interface Servico {
  id: string;
  nome: string;
  descricao: string;
  duracaoMin: number;
  preco: number;
  foto: string;
  ativo: boolean;
  destaque: boolean;
}

export type StatusAgendamento =
  | "pendente"
  | "confirmado"
  | "concluido"
  | "cancelado"
  | "nao_compareceu";

/** Quando o cliente paga: antecipado (online) ou no balcão. */
export type FormaPagamento = "online" | "na_barbearia";
export type MetodoPagamento = "pix" | "cartao" | "dinheiro";
export type StatusPagamento = "pendente" | "pago" | "estornado";

/** Cópia dos dados do serviço no momento do agendamento (preço pode mudar depois). */
export interface ServicoAgendado {
  id: string;
  nome: string;
  preco: number;
  duracaoMin: number;
}

export interface Agendamento {
  id: string;
  clienteId: string;
  barbeiroId: string;
  servicos: ServicoAgendado[];
  data: string;
  inicio: string;
  fim: string;
  duracaoMin: number;
  valorOriginal: number;
  desconto: number;
  valorFinal: number;
  descontoFidelidade: boolean;
  formaPagamento: FormaPagamento;
  metodoPagamento?: MetodoPagamento;
  statusPagamento: StatusPagamento;
  status: StatusAgendamento;
  criadoPor: Perfil;
  criadoEm: string;
  atualizadoEm: string;
  /** false enquanto o barbeiro ainda não viu (destaque "Novo"). */
  vistoPeloBarbeiro: boolean;
  observacao?: string;
}

export interface Bloqueio {
  id: string;
  barbeiroId: string;
  data: string;
  inicio: string;
  fim: string;
  motivo: string;
}

export type CategoriaDespesa =
  | "aluguel"
  | "produtos"
  | "contas"
  | "marketing"
  | "manutencao"
  | "outros";

export interface Despesa {
  id: string;
  descricao: string;
  categoria: CategoriaDespesa;
  valor: number;
  data: string;
}

export interface HorarioDia {
  abre: string;
  fecha: string;
}

export interface ConfigBarbearia {
  nome: string;
  slogan: string;
  sobre: string;
  endereco: string;
  cidade: string;
  telefone: string;
  whatsapp: string; // só dígitos, com DDI (ex.: 5548999991234)
  instagram: string;
  /** índice = dia da semana (0 = domingo). null = fechado */
  horarios: (HorarioDia | null)[];
  intervaloSlotsMin: number;
  fidelidade: { meta: number; percentual: number };
}

// ---------- Tipos auxiliares de consulta ----------

export interface SlotDisponivel {
  hora: string;
  barbeiroIds: string[];
}

export interface ProgressoFidelidade {
  meta: number;
  percentual: number;
  concluidos: number;
  progressoCiclo: number; // 0..meta-1
  faltam: number;
  descontoDisponivel: boolean;
}

export interface FiltroFinanceiro {
  inicio: string;
  fim: string;
  barbeiroId?: string;
  metodo?: MetodoPagamento;
}

export interface ResumoFinanceiro {
  faturamento: number;
  atendimentos: number;
  ticketMedio: number;
  descontos: number;
  despesas: number;
  lucro: number;
  taxaFaltas: number; // 0..1
  servicoMaisVendido: { nome: string; quantidade: number } | null;
  porMetodo: Record<MetodoPagamento, number>;
}

export interface PontoSerie {
  rotulo: string;
  valor: number;
  anterior?: number | null;
}

export interface RankingBarbeiro {
  barbeiroId: string;
  nome: string;
  cor: string;
  faturamento: number;
  atendimentos: number;
}

// =============================================================
// Implementação "de verdade" dos serviços: chama a API REST do
// back-end Spring Boot (backend-barbearia). Usada quando a variável
// NEXT_PUBLIC_API_URL está definida (ex.: http://localhost:8080/api).
//
// Cada serviço tem exatamente o mesmo formato da versão local
// (localStorage): o TypeScript confere isso com `typeof`.
// =============================================================

import type {
  Agendamento,
  Barbeiro,
  Bloqueio,
  Cliente,
  ConfigBarbearia,
  Despesa,
  FiltroFinanceiro,
  MetodoPagamento,
  Perfil,
  PontoSerie,
  ProgressoFidelidade,
  RankingBarbeiro,
  ResumoFinanceiro,
  Servico,
  Sessao,
  SlotDisponivel,
} from "@/types";
import type { agendamentoService as AgendamentoLocal, FiltroAgendamentos } from "./agendamentoService";
import type { authService as AuthLocal } from "./authService";
import type {
  barbeiroService as BarbeiroLocal,
  configService as ConfigLocal,
  servicoService as ServicoLocal,
} from "./catalogoService";
import type { clienteService as ClienteLocal, ClienteResumo, FichaCliente } from "./clienteService";
import type { fidelidadeService as FidelidadeLocal } from "./fidelidadeService";
import type { financeiroService as FinanceiroLocal } from "./financeiroService";
import type {
  bloqueioService as BloqueioLocal,
  despesaService as DespesaLocal,
  pagamentoService as PagamentoLocal,
} from "./agendaExtrasService";
import { API_URL, ErroApi, notificarMudanca } from "./nucleo";

// ---------------- cliente HTTP ----------------

type Params = Record<string, string | number | boolean | string[] | null | undefined>;

function montarUrl(caminho: string, params?: Params) {
  const url = new URL(API_URL + caminho);
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v)) v.forEach((x) => url.searchParams.append(k, x));
    else url.searchParams.set(k, String(v));
  }
  return url.toString();
}

async function http<T>(metodo: string, caminho: string, opcoes: { params?: Params; corpo?: unknown } = {}): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(montarUrl(caminho, opcoes.params), {
      method: metodo,
      headers: opcoes.corpo !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: opcoes.corpo !== undefined ? JSON.stringify(opcoes.corpo) : undefined,
    });
  } catch {
    throw new ErroApi("Não foi possível falar com o servidor. A API (Spring Boot) está rodando?", 0);
  }
  const texto = await resposta.text();
  const dados = texto ? JSON.parse(texto) : undefined;
  if (!resposta.ok) {
    throw new ErroApi(dados?.mensagem ?? `Erro ${resposta.status} na API.`, resposta.status);
  }
  // qualquer alteração faz as telas abertas recarregarem
  if (metodo !== "GET") notificarMudanca();
  return dados as T;
}

const get = <T>(caminho: string, params?: Params) => http<T>("GET", caminho, { params });
const post = <T>(caminho: string, corpo?: unknown) => http<T>("POST", caminho, { corpo: corpo ?? {} });
const put = <T>(caminho: string, corpo: unknown) => http<T>("PUT", caminho, { corpo });
const patch = <T>(caminho: string) => http<T>("PATCH", caminho);
const del = (caminho: string) => http<void>("DELETE", caminho);

// ---------------- sessão (fica no navegador) ----------------

const CHAVE_SESSAO = "vco-api:sessao";

function guardarSessao(s: Sessao | null) {
  if (s) localStorage.setItem(CHAVE_SESSAO, JSON.stringify(s));
  else localStorage.removeItem(CHAVE_SESSAO);
  notificarMudanca("sessao");
  return s;
}

function lerSessao(): Sessao | null {
  if (typeof window === "undefined") return null;
  const bruto = localStorage.getItem(CHAVE_SESSAO);
  return bruto ? (JSON.parse(bruto) as Sessao) : null;
}

export const authService: typeof AuthLocal = {
  sessaoAtual: lerSessao,
  login: async (email, senha) => guardarSessao(await post<Sessao>("/auth/login", { email, senha }))!,
  loginDemo: async (perfil: Perfil) => guardarSessao(await post<Sessao>(`/auth/demo/${perfil}`))!,
  trocarPerfil: async () => {
    const destino: Perfil = lerSessao()?.perfil === "cliente" ? "barbeiro" : "cliente";
    return guardarSessao(await post<Sessao>(`/auth/demo/${destino}`))!;
  },
  sair: async () => {
    guardarSessao(null);
  },
  cadastrarCliente: async (dados) => guardarSessao(await post<Sessao>("/auth/cadastro", dados))!,
};

// ---------------- configurações ----------------

let configCache: ConfigBarbearia | null = null;

/** Carrega a configuração antes de abrir as telas (várias telas leem de forma síncrona). */
export async function carregarConfig() {
  configCache = await get<ConfigBarbearia>("/config");
  return configCache;
}

export const configService: typeof ConfigLocal = {
  obter: carregarConfig,
  obterSync: () => {
    if (!configCache) throw new ErroApi("Configuração ainda não carregada.");
    return configCache;
  },
  salvar: async (config) => (configCache = await put<ConfigBarbearia>("/config", config)),
  restaurarDemonstracao: async () => {
    await post<void>("/demo/restaurar");
    await carregarConfig();
    notificarMudanca();
  },
};

// ---------------- catálogo ----------------

export const servicoService: typeof ServicoLocal = {
  listar: (opcoes = {}) => get<Servico[]>("/servicos", { incluirInativos: !!opcoes.incluirInativos }),
  salvar: ({ id, ...corpo }) => (id ? put<Servico>(`/servicos/${id}`, corpo) : post<Servico>("/servicos", corpo)),
  alternarAtivo: (id) => patch<Servico>(`/servicos/${id}/alternar-ativo`),
};

export const barbeiroService: typeof BarbeiroLocal = {
  listar: (opcoes = {}) => get<Barbeiro[]>("/barbeiros", { incluirInativos: !!opcoes.incluirInativos }),
  salvar: ({ id, ...corpo }) => (id ? put<Barbeiro>(`/barbeiros/${id}`, corpo) : post<Barbeiro>("/barbeiros", corpo)),
  alternarAtivo: (id) => patch<Barbeiro>(`/barbeiros/${id}/alternar-ativo`),
};

// ---------------- clientes e fidelidade ----------------

export const clienteService: typeof ClienteLocal = {
  listarBasico: () => get<Cliente[]>("/clientes/basico"),
  listar: (busca = "") => get<ClienteResumo[]>("/clientes", { busca }),
  obterFicha: (id) => get<FichaCliente>(`/clientes/${id}/ficha`),
  criar: (dados) => post<Cliente>("/clientes", dados),
  atualizar: (id, dados) => put<Cliente>(`/clientes/${id}`, dados),
};

export const fidelidadeService: typeof FidelidadeLocal = {
  obterProgresso: (clienteId) => get<ProgressoFidelidade>(`/fidelidade/${clienteId}`),
  simularDesconto: (clienteId, valor) =>
    get<{ desconto: number; aplicado: boolean; percentual: number }>(`/fidelidade/${clienteId}/simular`, { valor }),
};

// ---------------- agendamentos ----------------

export const agendamentoService: typeof AgendamentoLocal = {
  listar: (f: FiltroAgendamentos = {}) =>
    get<Agendamento[]>("/agendamentos", {
      data: f.data,
      inicio: f.inicio,
      fim: f.fim,
      barbeiroId: f.barbeiroId,
      clienteId: f.clienteId,
      status: f.status,
    }),
  obter: (id) => get<Agendamento>(`/agendamentos/${id}`),
  horariosDisponiveis: (c) =>
    get<SlotDisponivel[]>("/agendamentos/horarios-disponiveis", {
      data: c.data,
      duracaoMin: c.duracaoMin,
      barbeiroId: c.barbeiroId,
      ignorarAgendamentoId: c.ignorarAgendamentoId,
    }),
  contarNaoVistos: (barbeiroId) => get<number>("/agendamentos/nao-vistos/contagem", { barbeiroId }),
  criar: (dados) => post<Agendamento>("/agendamentos", dados),
  confirmar: (id) => post<Agendamento>(`/agendamentos/${id}/confirmar`),
  concluir: (id, metodo) => post<Agendamento>(`/agendamentos/${id}/concluir`, { metodo }),
  remarcar: (id, novo, por) => post<Agendamento>(`/agendamentos/${id}/remarcar`, { ...novo, por }),
  cancelar: (id, por, motivo) => post<Agendamento>(`/agendamentos/${id}/cancelar`, { por, motivo }),
  marcarNaoCompareceu: (id) => post<Agendamento>(`/agendamentos/${id}/nao-compareceu`),
  marcarComoVistos: async (ids) => {
    if (ids.length) await post<void>("/agendamentos/vistos", { ids });
  },
};

// ---------------- bloqueios, despesas e pagamento ----------------

export const bloqueioService: typeof BloqueioLocal = {
  listar: (f = {}) => get<Bloqueio[]>("/bloqueios", f),
  criar: (dados) => post<Bloqueio>("/bloqueios", dados),
  remover: (id) => del(`/bloqueios/${id}`),
};

export const despesaService: typeof DespesaLocal = {
  listar: (f = {}) => get<Despesa[]>("/despesas", f),
  criar: (dados) => post<Despesa>("/despesas", dados),
  remover: (id) => del(`/despesas/${id}`),
};

export const pagamentoService: typeof PagamentoLocal = {
  gerarPix: (valor) => post<{ codigo: string; txid: string; expiraEmSegundos: number }>("/pagamentos/pix", { valor }),
  aprovar: async (metodo, valor) => {
    // um pequeno atraso só para a animação de "processando" aparecer
    await new Promise((r) => setTimeout(r, metodo === "cartao" ? 1200 : 600));
    const r = await post<{ aprovado: true; metodo: typeof metodo; valor: number; codigoTransacao: string }>(
      "/pagamentos/aprovar",
      { metodo, valor },
    );
    return r;
  },
};

// ---------------- financeiro ----------------

const filtroFin = (f: Partial<FiltroFinanceiro>) => ({ barbeiroId: f.barbeiroId, metodo: f.metodo as MetodoPagamento | undefined });

export const financeiroService: typeof FinanceiroLocal = {
  resumo: (f) =>
    get<{ atual: ResumoFinanceiro; anterior: ResumoFinanceiro; periodoAnterior: FiltroFinanceiro }>("/financeiro/resumo", {
      inicio: f.inicio,
      fim: f.fim,
      ...filtroFin(f),
    }),
  porDiaDoMes: (mes, f = {}) => get<PontoSerie[]>("/financeiro/por-dia", { mes, ...filtroFin(f) }),
  porMesDoAno: (ano, f = {}) => get<PontoSerie[]>("/financeiro/por-mes", { ano, ...filtroFin(f) }),
  rankingBarbeiros: (f) =>
    get<RankingBarbeiro[]>("/financeiro/ranking", { inicio: f.inicio, fim: f.fim, metodo: f.metodo }),
};

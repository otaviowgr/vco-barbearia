// =============================================================
// "Banco de dados" da demonstração, guardado no localStorage.
// Só os arquivos em /services conhecem este módulo: as telas
// conversam apenas com os serviços (que imitam uma API REST).
// No modo API (NEXT_PUBLIC_API_URL definida) este arquivo não
// é usado: os serviços chamam o back-end Spring Boot (remoto.ts).
// =============================================================

import type {
  Agendamento,
  Barbeiro,
  Bloqueio,
  Cliente,
  ConfigBarbearia,
  Despesa,
  Servico,
  Sessao,
  Usuario,
} from "@/types";
import { gerarSeed } from "@/data/seed";
import { ErroApi, esperar, EVENTO_DB } from "./nucleo";

export { ErroApi, esperar, EVENTO_DB };

export interface BancoDemo {
  config: ConfigBarbearia;
  servicos: Servico[];
  barbeiros: Barbeiro[];
  clientes: Cliente[];
  usuarios: Usuario[];
  agendamentos: Agendamento[];
  despesas: Despesa[];
  bloqueios: Bloqueio[];
  sessao: Sessao | null;
}

type Tabela = keyof BancoDemo;

const PREFIXO = "vco:";
const CHAVE_VERSAO = `${PREFIXO}versao`;
/** Aumente quando mudar o formato do seed para forçar recarga. */
const VERSAO_SEED = "1";

const TABELAS: Tabela[] = [
  "config",
  "servicos",
  "barbeiros",
  "clientes",
  "usuarios",
  "agendamentos",
  "despesas",
  "bloqueios",
  "sessao",
];

const cache = new Map<Tabela, unknown>();
let ouvindoOutrasAbas = false;

function temStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function notificar(tabela: Tabela | "*") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENTO_DB, { detail: { tabela } }));
  }
}

function ouvirOutrasAbas() {
  if (ouvindoOutrasAbas || typeof window === "undefined") return;
  ouvindoOutrasAbas = true;
  // Se a demo estiver aberta em duas abas (cliente e barbeiro), uma vê a mudança da outra.
  window.addEventListener("storage", (e) => {
    if (!e.key?.startsWith(PREFIXO)) return;
    const tabela = e.key.slice(PREFIXO.length) as Tabela;
    if (TABELAS.includes(tabela)) {
      cache.delete(tabela);
      notificar(tabela);
    } else if (e.key === CHAVE_VERSAO) {
      cache.clear();
      notificar("*");
    }
  });
}

function gravarTudo(banco: BancoDemo) {
  cache.clear();
  for (const t of TABELAS) {
    localStorage.setItem(PREFIXO + t, JSON.stringify(banco[t]));
  }
  localStorage.setItem(CHAVE_VERSAO, VERSAO_SEED);
}

/** Carrega o seed na primeira visita (ou se a versão do seed mudou). */
export function garantirSeed() {
  if (!temStorage()) return;
  ouvirOutrasAbas();
  const faltaTabela = TABELAS.some((t) => localStorage.getItem(PREFIXO + t) === null);
  if (localStorage.getItem(CHAVE_VERSAO) !== VERSAO_SEED || faltaTabela) {
    gravarTudo(gerarSeed());
  }
}

export function ler<T extends Tabela>(tabela: T): BancoDemo[T] {
  if (!temStorage()) throw new Error("localStorage indisponível (executando no servidor?)");
  garantirSeed();
  if (cache.has(tabela)) return cache.get(tabela) as BancoDemo[T];
  const bruto = localStorage.getItem(PREFIXO + tabela);
  const valor = bruto ? (JSON.parse(bruto) as BancoDemo[T]) : (null as BancoDemo[T]);
  cache.set(tabela, valor);
  return valor;
}

export function gravar<T extends Tabela>(tabela: T, valor: BancoDemo[T]) {
  try {
    localStorage.setItem(PREFIXO + tabela, JSON.stringify(valor));
  } catch {
    throw new ErroApi("Armazenamento do navegador cheio. Use 'Restaurar dados da demonstração'.", 507);
  }
  cache.set(tabela, valor);
  notificar(tabela);
}

/** Aplica uma alteração numa lista e grava. */
export function alterar<T extends Tabela>(tabela: T, fn: (atual: BancoDemo[T]) => BancoDemo[T]) {
  gravar(tabela, fn(ler(tabela)));
}

/** Apaga tudo e recarrega os dados iniciais (mantém a sessão atual, se houver). */
export function restaurarDemo(manterSessao = true) {
  const sessao = manterSessao ? ler("sessao") : null;
  for (const t of TABELAS) localStorage.removeItem(PREFIXO + t);
  localStorage.removeItem(CHAVE_VERSAO);
  const banco = gerarSeed();
  banco.sessao = sessao;
  gravarTudo(banco);
  notificar("*");
}

// ---------- utilitários de "API simulada" ----------

const LATENCIA = { min: 250, max: 600 };

/**
 * Executa uma operação como se fosse uma chamada HTTP:
 * espera um pouco, roda a lógica e devolve uma cópia dos dados
 * (assim a tela não altera o "banco" por referência).
 */
export async function chamadaApi<T>(fn: () => T, latencia = LATENCIA): Promise<T> {
  await esperar(latencia.min + Math.random() * (latencia.max - latencia.min));
  const resultado = fn();
  return resultado === undefined ? resultado : structuredClone(resultado);
}

let contadorId = 0;
export function gerarId(prefixo: string): string {
  contadorId = (contadorId + 1) % 1000;
  return `${prefixo}-${Date.now().toString(36)}${contadorId.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export const agoraISO = () => new Date().toISOString();

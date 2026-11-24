// Peças comuns aos dois modos de dados (localStorage e API Spring Boot).

/** URL da API real. Se não estiver definida, o protótipo usa o localStorage. */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
export const USAR_API = API_URL.length > 0;

/** Evento disparado quando algo muda nos dados (as telas recarregam sozinhas). */
export const EVENTO_DB = "vco:db-alterado";

export class ErroApi extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
    this.name = "ErroApi";
  }
}

export function esperar(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export function notificarMudanca(tabela = "*") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENTO_DB, { detail: { tabela } }));
  }
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export const formatarMoeda = (v: number) => brl.format(v);

export const formatarPercentual = (v: number, casas = 0) =>
  `${(v * 100).toFixed(casas).replace(".", ",")}%`;

export const somenteDigitos = (s: string) => s.replace(/\D/g, "");

/** Formata para (48) 99999-0000 */
export function formatarTelefone(s: string): string {
  const d = somenteDigitos(s).replace(/^55(?=\d{10,11}$)/, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Converte telefone brasileiro para o formato do wa.me (55 + DDD + número). */
export function telefoneParaWhatsApp(tel: string): string {
  const d = somenteDigitos(tel);
  return d.startsWith("55") && d.length >= 12 ? d : `55${d}`;
}

export function linkWhatsApp(tel: string, mensagem?: string): string {
  const base = `https://wa.me/${telefoneParaWhatsApp(tel)}`;
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base;
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}

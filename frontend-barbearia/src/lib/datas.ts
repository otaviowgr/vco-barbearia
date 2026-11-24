// Utilitários de data/hora trabalhando sempre no fuso local,
// com datas no formato "YYYY-MM-DD" e horas "HH:mm".

const pad = (n: number) => String(n).padStart(2, "0");

export function paraISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function deISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function hoje(): string {
  return paraISODate(new Date());
}

export function somarDias(data: string, dias: number): string {
  const d = deISODate(data);
  d.setDate(d.getDate() + dias);
  return paraISODate(d);
}

export function somarMeses(data: string, meses: number): string {
  const d = deISODate(data);
  d.setDate(1);
  d.setMonth(d.getMonth() + meses);
  return paraISODate(d);
}

export function diaDaSemana(data: string): number {
  return deISODate(data).getDay();
}

export function inicioDoMes(data: string): string {
  return data.slice(0, 8) + "01";
}

export function fimDoMes(data: string): string {
  const d = deISODate(data);
  return paraISODate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function diasNoMes(data: string): number {
  return Number(fimDoMes(data).slice(8, 10));
}

export function inicioDaSemana(data: string): string {
  // semana começando na segunda-feira
  const dow = diaDaSemana(data);
  return somarDias(data, dow === 0 ? -6 : 1 - dow);
}

export function diferencaDias(a: string, b: string): number {
  return Math.round((deISODate(b).getTime() - deISODate(a).getTime()) / 86400000);
}

export function horaParaMin(h: string): number {
  const [hh, mm] = h.split(":").map(Number);
  return hh * 60 + mm;
}

export function minParaHora(min: number): string {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

export function agoraMin(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export function sobrepoe(aIni: number, aFim: number, bIni: number, bFim: number) {
  return aIni < bFim && bIni < aFim;
}

const DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DIAS_LONGOS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const MESES_CURTOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export const nomeDiaCurto = (dow: number) => DIAS_CURTOS[dow];
export const nomeDiaLongo = (dow: number) => DIAS_LONGOS[dow];
export const nomeMes = (m: number) => MESES[m];
export const nomeMesCurto = (m: number) => MESES_CURTOS[m];

/** "23/11/2026" */
export function formatarData(data: string): string {
  const [y, m, d] = data.split("-");
  return `${d}/${m}/${y}`;
}

/** "Seg, 23 de Nov" */
export function formatarDataCurta(data: string): string {
  const d = deISODate(data);
  return `${DIAS_CURTOS[d.getDay()]}, ${d.getDate()} de ${MESES_CURTOS[d.getMonth()]}`;
}

/** "Segunda-feira, 23 de Novembro" + rótulos "Hoje"/"Amanhã" */
export function formatarDataAmigavel(data: string): string {
  const diff = diferencaDias(hoje(), data);
  const d = deISODate(data);
  const base = `${d.getDate()} de ${MESES[d.getMonth()]}`;
  if (diff === 0) return `Hoje, ${base}`;
  if (diff === 1) return `Amanhã, ${base}`;
  if (diff === -1) return `Ontem, ${base}`;
  return `${DIAS_LONGOS[d.getDay()]}, ${base}`;
}

export function formatarDuracao(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${pad(m)}` : `${h}h`;
}

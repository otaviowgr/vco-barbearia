"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { iniciais } from "@/lib/formatadores";

export function Card({
  children,
  className = "",
  interativo,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  interativo?: boolean;
  onClick?: () => void;
}) {
  const base = `rounded-2xl border border-borda bg-painel ${interativo ? "transition duration-200 hover:-translate-y-0.5 hover:border-marca/40 hover:shadow-xl hover:shadow-black/40 cursor-pointer" : ""}`;
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${base} block w-full text-left ${className}`}>
        {children}
      </button>
    );
  }
  return <div className={`${base} ${className}`}>{children}</div>;
}

type CorBadge = "marca" | "verde" | "vermelho" | "azul" | "cinza" | "amarelo" | "roxo";
const CORES_BADGE: Record<CorBadge, string> = {
  marca: "bg-marca/15 text-marca border-marca/30",
  verde: "bg-sucesso/12 text-sucesso border-sucesso/25",
  vermelho: "bg-perigo/12 text-perigo border-perigo/25",
  azul: "bg-info/12 text-info border-info/25",
  amarelo: "bg-aviso/12 text-aviso border-aviso/25",
  roxo: "bg-white/5 text-texto border-borda-forte",
  cinza: "bg-painel-3 text-texto-2 border-borda",
};

export function Badge({ children, cor = "cinza", icone, className = "" }: { children: ReactNode; cor?: CorBadge; icone?: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${CORES_BADGE[cor]} ${className}`}>
      {icone}
      {children}
    </span>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />;
}

export function Spinner({ className = "" }: { className?: string }) {
  return <Loader2 className={`size-5 animate-spin text-marca ${className}`} />;
}

export function EstadoVazio({
  icone,
  titulo,
  descricao,
  acao,
}: {
  icone: ReactNode;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  return (
    <div className="flex animate-entrar flex-col items-center rounded-2xl border border-dashed border-borda px-6 py-10 text-center">
      <div className="mb-3 grid size-14 place-items-center rounded-full bg-marca/10 text-marca">{icone}</div>
      <p className="font-display text-lg font-medium tracking-wide">{titulo}</p>
      {descricao && <p className="mt-1 max-w-sm text-sm text-texto-2">{descricao}</p>}
      {acao && <div className="mt-5">{acao}</div>}
    </div>
  );
}

/** Avatar minimalista: iniciais do nome, com a cor de identificação (barbeiros). */
export function Avatar({ nome, cor, tamanho = 40 }: { nome: string; cor?: string; tamanho?: number }) {
  return (
    <span
      style={{
        width: tamanho,
        height: tamanho,
        fontSize: tamanho * 0.36,
        background: cor ? `${cor}1f` : undefined,
        color: cor ?? undefined,
        boxShadow: cor ? `inset 0 0 0 1px ${cor}59` : undefined,
      }}
      className="grid shrink-0 place-items-center rounded-full bg-painel-3 font-semibold tracking-wide text-texto shadow-[inset_0_0_0_1px_var(--color-borda-forte)]"
      role="img"
      aria-label={nome}
    >
      {iniciais(nome)}
    </span>
  );
}

export function BarraProgresso({ valor, max, className = "" }: { valor: number; max: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, (valor / max) * 100));
  return (
    <div className={`h-2.5 overflow-hidden rounded-full bg-painel-3 ${className}`} role="progressbar" aria-valuenow={valor} aria-valuemax={max}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-marca-escuro via-marca to-marca-claro transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

const estiloCampo =
  "w-full rounded-xl border border-borda bg-painel-2 px-3.5 text-sm text-texto placeholder:text-texto-3 transition focus:border-marca/60 focus:outline-none focus:ring-2 focus:ring-marca/20 disabled:opacity-60";

export function Campo({ rotulo, dica, children }: { rotulo: string; dica?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-texto-2 uppercase">{rotulo}</span>
      {children}
      {dica && <span className="mt-1 block text-xs text-texto-3">{dica}</span>}
    </label>
  );
}

export function Input({ className = "", ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={`h-11 ${estiloCampo} ${className}`} />;
}

export function Textarea({ className = "", ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={`py-2.5 ${estiloCampo} ${className}`} />;
}

export function Select({ className = "", children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...p} className={`h-11 ${estiloCampo} ${className}`}>
      {children}
    </select>
  );
}

export function Segmentado<T extends string>({
  opcoes,
  valor,
  aoMudar,
  className = "",
}: {
  opcoes: { valor: T; rotulo: ReactNode }[];
  valor: T;
  aoMudar: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={`sem-scroll inline-flex max-w-full overflow-x-auto rounded-xl border border-borda bg-painel-2 p-1 ${className}`} role="tablist">
      {opcoes.map((o) => (
        <button
          key={o.valor}
          role="tab"
          aria-selected={valor === o.valor}
          onClick={() => aoMudar(o.valor)}
          className={`flex-1 rounded-lg px-2.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition sm:px-3 sm:text-sm ${
            valor === o.valor ? "bg-marca-escuro text-white shadow" : "text-texto-2 hover:text-texto"
          }`}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}

export function Interruptor({ ligado, aoMudar, rotulo }: { ligado: boolean; aoMudar: (v: boolean) => void; rotulo: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      onClick={() => aoMudar(!ligado)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${ligado ? "bg-marca" : "bg-painel-3 border border-borda"}`}
    >
      <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${ligado ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

export function TituloPagina({ titulo, subtitulo, acoes }: { titulo: string; subtitulo?: ReactNode; acoes?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-wide uppercase">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-sm text-texto-2">{subtitulo}</p>}
      </div>
      {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
    </div>
  );
}

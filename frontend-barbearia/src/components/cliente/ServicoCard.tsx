"use client";

import { Check, Clock } from "lucide-react";
import type { Servico } from "@/types";
import { formatarDuracao } from "@/lib/datas";
import { formatarMoeda } from "@/lib/formatadores";
import { IconeServico } from "./IconeServico";

export function ServicoCard({
  servico,
  selecionado,
  aoClicar,
  compacto,
}: {
  servico: Servico;
  selecionado?: boolean;
  aoClicar?: () => void;
  compacto?: boolean;
}) {
  const selecionavel = selecionado !== undefined;
  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-pressed={selecionavel ? selecionado : undefined}
      className={`group relative flex w-full gap-4 rounded-2xl border bg-painel p-4 text-left transition duration-300 hover:-translate-y-0.5 hover:bg-painel-2/60 ${
        compacto ? "flex-row items-start" : "flex-col"
      } ${selecionado ? "border-marca ring-2 ring-marca/30" : "border-borda hover:border-marca/40"}`}
    >
      <div className={`flex items-start justify-between ${compacto ? "" : "w-full"}`}>
        <IconeServico nome={servico.nome} tamanho={compacto ? "sm" : "md"} ativo={selecionado} />
        {servico.destaque && !compacto && (
          <span className="rounded-full border border-marca/30 px-2.5 py-1 text-[11px] font-medium tracking-wide text-marca uppercase">
            Mais pedido
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col self-stretch">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg leading-tight font-medium tracking-wide">{servico.nome}</h3>
          <span className="shrink-0 font-display text-xl font-semibold text-texto">{formatarMoeda(servico.preco)}</span>
        </div>
        <p className={`mt-1.5 text-sm text-texto-2 ${compacto ? "line-clamp-2" : "line-clamp-3"}`}>{servico.descricao}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-texto-3">
            <Clock className="size-3.5" /> {formatarDuracao(servico.duracaoMin)}
          </span>
          {selecionavel && (
            <span
              className={`grid size-6 place-items-center rounded-full border transition ${
                selecionado ? "scale-110 border-marca-escuro bg-marca-escuro text-white" : "border-borda-forte text-transparent"
              }`}
            >
              <Check className="size-4" strokeWidth={3} />
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

"use client";

import { Check, Clock } from "lucide-react";
import type { Servico } from "@/types";
import { formatarDuracao } from "@/lib/datas";
import { formatarMoeda } from "@/lib/formatadores";
import { Imagem } from "../ui/basicos";

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
      className={`group relative flex w-full overflow-hidden rounded-2xl border bg-painel text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40 ${
        compacto ? "flex-row" : "flex-col"
      } ${selecionado ? "border-ouro ring-2 ring-ouro/30" : "border-borda hover:border-ouro/40"}`}
    >
      <div className={`relative shrink-0 overflow-hidden ${compacto ? "w-28 sm:w-32" : "aspect-[16/10] w-full"}`}>
        <Imagem src={servico.foto} alt={servico.nome} className="size-full transition duration-500 group-hover:scale-105" />
        {!compacto && <div className="absolute inset-0 bg-gradient-to-t from-painel via-transparent to-transparent" />}
        {servico.destaque && !compacto && (
          <span className="absolute top-3 left-3 rounded-full bg-fundo/80 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-ouro uppercase backdrop-blur">
            Mais pedido
          </span>
        )}
      </div>
      <div className={`flex flex-1 flex-col ${compacto ? "p-3.5" : "p-4 pt-1"}`}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg leading-tight font-medium tracking-wide">{servico.nome}</h3>
          <span className="shrink-0 font-display text-xl font-semibold text-ouro">{formatarMoeda(servico.preco)}</span>
        </div>
        <p className={`mt-1.5 text-sm text-texto-2 ${compacto ? "line-clamp-2" : "line-clamp-3"}`}>{servico.descricao}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-texto-3">
            <Clock className="size-3.5" /> {formatarDuracao(servico.duracaoMin)}
          </span>
          {selecionavel && (
            <span
              className={`grid size-6 place-items-center rounded-full border transition ${
                selecionado ? "scale-110 border-ouro bg-ouro text-fundo" : "border-borda-forte text-transparent"
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

"use client";

import { CalendarClock, Clock, CreditCard, RotateCcw, Tag, XCircle } from "lucide-react";
import type { Agendamento, Barbeiro } from "@/types";
import { deISODate, formatarDataAmigavel, hoje, nomeDiaCurto, nomeMesCurto } from "@/lib/datas";
import { formatarMoeda } from "@/lib/formatadores";
import { descreverPagamento, STATUS_AGENDAMENTO, STATUS_PAGAMENTO } from "@/lib/status";
import { Avatar, Badge } from "../ui/basicos";
import { Botao } from "../ui/Botao";

export function AgendamentoCard({
  agendamento: a,
  barbeiro,
  aoRemarcar,
  aoCancelar,
  aoRepetir,
}: {
  agendamento: Agendamento;
  barbeiro?: Barbeiro;
  aoRemarcar?: () => void;
  aoCancelar?: () => void;
  aoRepetir?: () => void;
}) {
  const d = deISODate(a.data);
  const st = STATUS_AGENDAMENTO[a.status];
  const pg = STATUS_PAGAMENTO[a.statusPagamento];
  const futuro = a.data >= hoje() && (a.status === "pendente" || a.status === "confirmado");
  const inativo = a.status === "cancelado" || a.status === "nao_compareceu";

  return (
    <div className={`animate-entrar overflow-hidden rounded-2xl border bg-painel transition ${futuro ? "border-borda hover:border-marca/30" : "border-borda"} ${inativo ? "opacity-70" : ""}`}>
      <div className="flex gap-4 p-4">
        <div className={`flex w-16 shrink-0 flex-col items-center justify-center rounded-xl py-2 ${futuro ? "bg-marca/12 text-marca" : "bg-painel-3 text-texto-2"}`}>
          <span className="text-[11px] font-semibold uppercase">{nomeDiaCurto(d.getDay())}</span>
          <span className="font-display text-3xl leading-none font-semibold">{d.getDate()}</span>
          <span className="text-[11px] uppercase">{nomeMesCurto(d.getMonth())}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge cor={st.cor}>{st.rotulo}</Badge>
            {!inativo && <Badge cor={pg.cor} icone={<CreditCard className="size-3" />}>{pg.rotulo}</Badge>}
            {a.descontoFidelidade && <Badge cor="marca" icone={<Tag className="size-3" />}>Fidelidade</Badge>}
          </div>
          <p className="mt-1.5 truncate font-display text-lg font-medium tracking-wide">{a.servicos.map((s) => s.nome).join(" + ")}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-texto-2">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" /> {a.inicio} – {a.fim}
            </span>
            {barbeiro && (
              <span className="inline-flex items-center gap-1.5">
                <Avatar nome={barbeiro.nome} tamanho={18} /> {barbeiro.nome}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-texto-3">{formatarDataAmigavel(a.data)} · {descreverPagamento(a)}</p>
        </div>
        <div className="shrink-0 text-right">
          {a.desconto > 0 && <p className="text-xs text-texto-3 line-through">{formatarMoeda(a.valorOriginal)}</p>}
          <p className="font-display text-xl font-semibold text-marca">{formatarMoeda(a.valorFinal)}</p>
        </div>
      </div>
      {(futuro && (aoRemarcar || aoCancelar)) || (!futuro && aoRepetir) ? (
        <div className="flex gap-2 border-t border-borda bg-painel-2/50 px-4 py-2.5">
          {futuro ? (
            <>
              {aoRemarcar && (
                <Botao tamanho="sm" variante="secundario" icone={<CalendarClock className="size-4" />} onClick={aoRemarcar}>
                  Remarcar
                </Botao>
              )}
              {aoCancelar && (
                <Botao tamanho="sm" variante="fantasma" className="ml-auto text-perigo hover:text-perigo" icone={<XCircle className="size-4" />} onClick={aoCancelar}>
                  Cancelar
                </Botao>
              )}
            </>
          ) : (
            aoRepetir && (
              <Botao tamanho="sm" variante="contorno" icone={<RotateCcw className="size-4" />} onClick={aoRepetir}>
                Agendar novamente
              </Botao>
            )
          )}
        </div>
      ) : null}
    </div>
  );
}

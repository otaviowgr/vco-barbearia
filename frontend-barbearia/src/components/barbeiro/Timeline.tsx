"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { CheckCheck, Lock, UserX, Wifi } from "lucide-react";
import type { Agendamento, Barbeiro, Bloqueio, Cliente } from "@/types";
import { agoraMin, hoje, horaParaMin, minParaHora } from "@/lib/datas";
import { formatarMoeda, primeiroNome } from "@/lib/formatadores";

export const PX_POR_MIN = 1.5;

export interface ColunaTimeline {
  chave: string;
  cabecalho: ReactNode;
  data: string;
  barbeiroId: string;
  fechado?: boolean;
}

export function Timeline({
  colunas,
  agendamentos,
  bloqueios,
  inicioMin,
  fimMin,
  clientes,
  barbeiros,
  aoClicarAgendamento,
  aoClicarVazio,
  aoClicarBloqueio,
}: {
  colunas: ColunaTimeline[];
  agendamentos: Agendamento[];
  bloqueios: Bloqueio[];
  inicioMin: number;
  fimMin: number;
  clientes: Map<string, Cliente>;
  barbeiros: Map<string, Barbeiro>;
  aoClicarAgendamento: (a: Agendamento) => void;
  aoClicarVazio: (barbeiroId: string, data: string, hora: string) => void;
  aoClicarBloqueio: (b: Bloqueio) => void;
}) {
  const altura = (fimMin - inicioMin) * PX_POR_MIN;
  const scrollRef = useRef<HTMLDivElement>(null);
  const temHoje = colunas.some((c) => c.data === hoje());
  const agora = agoraMin();

  // rola até o horário atual ao abrir o dia de hoje
  useEffect(() => {
    if (!temHoje || !scrollRef.current) return;
    const y = (agoraMin() - inicioMin) * PX_POR_MIN - 120;
    scrollRef.current.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  }, [temHoje, inicioMin]);

  const horas: number[] = [];
  for (let m = Math.ceil(inicioMin / 60) * 60; m <= fimMin; m += 60) horas.push(m);

  return (
    <div ref={scrollRef} className="max-h-[calc(100dvh-300px)] min-h-[460px] overflow-auto rounded-2xl border border-borda bg-painel lg:max-h-[calc(100dvh-260px)]">
      <div className="grid min-w-max" style={{ gridTemplateColumns: `56px repeat(${colunas.length}, minmax(150px, 1fr))` }}>
        {/* cabeçalho */}
        <div className="sticky top-0 left-0 z-20 border-b border-borda bg-painel" />
        {colunas.map((c) => (
          <div key={c.chave} className="sticky top-0 z-10 border-b border-l border-borda bg-painel/95 px-3 py-2.5 backdrop-blur">
            {c.cabecalho}
          </div>
        ))}

        {/* régua de horas */}
        <div className="sticky left-0 z-10 bg-painel" style={{ height: altura }}>
          {horas.map((m) => (
            <span key={m} className="absolute right-2 -translate-y-1/2 text-[11px] text-texto-3 tabular-nums" style={{ top: (m - inicioMin) * PX_POR_MIN }}>
              {minParaHora(m)}
            </span>
          ))}
        </div>

        {colunas.map((c) => {
          const ags = agendamentos.filter((a) => a.data === c.data && a.barbeiroId === c.barbeiroId);
          const blqs = bloqueios.filter((b) => b.data === c.data && b.barbeiroId === c.barbeiroId);
          const ehHoje = c.data === hoje();
          return (
            <div
              key={c.chave}
              className={`relative border-l border-borda ${c.fechado ? "listras" : "cursor-copy"} ${ehHoje ? "bg-ouro/[0.02]" : ""}`}
              style={{ height: altura }}
              onClick={(e) => {
                if (c.fechado || e.target !== e.currentTarget) return;
                const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
                const m = Math.floor((inicioMin + y / PX_POR_MIN) / 30) * 30;
                aoClicarVazio(c.barbeiroId, c.data, minParaHora(m));
              }}
            >
              {/* linhas de hora / meia hora */}
              {horas.map((m) => (
                <div key={m} className="pointer-events-none absolute inset-x-0 border-t border-borda/70" style={{ top: (m - inicioMin) * PX_POR_MIN }} />
              ))}
              {horas.map((m) => (
                <div key={`h${m}`} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-borda/30" style={{ top: (m + 30 - inicioMin) * PX_POR_MIN }} />
              ))}

              {c.fechado && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm font-medium text-texto-3">Fechado</div>
              )}

              {blqs.map((b) => {
                const ini = horaParaMin(b.inicio);
                const fim = horaParaMin(b.fim);
                return (
                  <button
                    key={b.id}
                    onClick={() => aoClicarBloqueio(b)}
                    className="listras absolute inset-x-1 flex flex-col items-start overflow-hidden rounded-lg border border-borda-forte bg-painel-3/70 px-2 py-1 text-left text-xs text-texto-2 transition hover:border-perigo/50"
                    style={{ top: (ini - inicioMin) * PX_POR_MIN + 1, height: (fim - ini) * PX_POR_MIN - 2 }}
                    title="Clique para remover o bloqueio"
                  >
                    <span className="flex items-center gap-1 font-medium">
                      <Lock className="size-3" /> {b.motivo}
                    </span>
                    <span className="text-texto-3">
                      {b.inicio} – {b.fim}
                    </span>
                  </button>
                );
              })}

              {ags.map((a) => (
                <BlocoAgendamento
                  key={a.id}
                  a={a}
                  inicioMin={inicioMin}
                  cliente={clientes.get(a.clienteId)}
                  cor={barbeiros.get(a.barbeiroId)?.cor ?? "#e8b04b"}
                  aoClicar={() => aoClicarAgendamento(a)}
                />
              ))}

              {ehHoje && agora > inicioMin && agora < fimMin && (
                <div className="pointer-events-none absolute inset-x-0 z-[5] flex items-center" style={{ top: (agora - inicioMin) * PX_POR_MIN }}>
                  <span className="-ml-1 size-2 rounded-full bg-perigo" />
                  <span className="h-px flex-1 bg-perigo/80" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BlocoAgendamento({
  a,
  inicioMin,
  cliente,
  cor,
  aoClicar,
}: {
  a: Agendamento;
  inicioMin: number;
  cliente?: Cliente;
  cor: string;
  aoClicar: () => void;
}) {
  const ini = horaParaMin(a.inicio);
  const altura = a.duracaoMin * PX_POR_MIN - 2;
  const novo = !a.vistoPeloBarbeiro && (a.status === "pendente" || a.status === "confirmado");
  const inativo = a.status === "cancelado" || a.status === "nao_compareceu";
  const concluido = a.status === "concluido";
  const pendente = a.status === "pendente";
  return (
    <button
      onClick={aoClicar}
      className={`group absolute inset-x-1 z-[2] overflow-hidden rounded-lg border-l-[3px] px-2 py-1 text-left text-xs transition hover:z-[3] hover:brightness-125 hover:shadow-lg hover:shadow-black/50 ${
        novo ? "animate-pulso-ouro ring-1 ring-ouro" : ""
      } ${inativo ? "opacity-40" : concluido ? "opacity-75" : ""} ${pendente ? "border-y border-r border-dashed" : ""}`}
      style={{
        top: (ini - inicioMin) * PX_POR_MIN + 1,
        height: altura,
        background: `${cor}${concluido ? "14" : "26"}`,
        borderLeftColor: cor,
        borderTopColor: pendente ? `${cor}80` : undefined,
        borderRightColor: pendente ? `${cor}80` : undefined,
        borderBottomColor: pendente ? `${cor}80` : undefined,
      }}
    >
      <div className="flex items-center gap-1">
        <span className="font-semibold tabular-nums text-texto">{a.inicio}</span>
        <span className={`truncate font-medium text-texto ${inativo ? "line-through" : ""}`}>
          {cliente ? primeiroNome(cliente.nome) + (cliente.nome.includes(" ") ? " " + cliente.nome.split(" ").slice(-1)[0][0] + "." : "") : "Cliente"}
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-1">
          {novo && <span className="rounded bg-ouro px-1 text-[10px] font-bold text-fundo uppercase">Novo</span>}
          {pendente && !novo && <span className="rounded bg-aviso/20 px-1 text-[10px] font-medium text-aviso">a confirmar</span>}
          {concluido && <CheckCheck className="size-3.5 text-sucesso" />}
          {a.status === "nao_compareceu" && <UserX className="size-3.5" />}
        </span>
      </div>
      {altura > 34 && <p className="truncate text-texto-2">{a.servicos.map((s) => s.nome).join(" + ")}</p>}
      {altura > 52 && (
        <p className="mt-0.5 flex items-center gap-1 text-texto-2">
          <span className="font-semibold text-ouro">{formatarMoeda(a.valorFinal)}</span>
          <span className="text-texto-3">·</span>
          {a.statusPagamento === "pago" ? (
            <span className="flex items-center gap-0.5 text-sucesso">
              {a.formaPagamento === "online" && <Wifi className="size-3" />} pago
            </span>
          ) : (
            <span className="text-aviso">a receber</span>
          )}
        </p>
      )}
    </button>
  );
}

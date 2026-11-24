"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  deISODate,
  diaDaSemana,
  diasNoMes,
  hoje,
  inicioDoMes,
  nomeDiaCurto,
  nomeMes,
  somarDias,
  somarMeses,
} from "@/lib/datas";

/** Calendário mensal simples. `desabilitado(data)` bloqueia dias (fechado, passado...). */
export function Calendario({
  valor,
  aoEscolher,
  desabilitado,
  maxDias = 60,
  permitirPassado = false,
}: {
  valor?: string;
  aoEscolher: (data: string) => void;
  desabilitado?: (data: string) => boolean;
  maxDias?: number;
  permitirPassado?: boolean;
}) {
  const hj = hoje();
  const [mes, setMes] = useState(inicioDoMes(valor ?? hj));
  const d = deISODate(mes);
  const offset = (diaDaSemana(mes) + 6) % 7; // semana começa na segunda
  const limite = somarDias(hj, maxDias);
  const podeVoltar = permitirPassado || mes > inicioDoMes(hj);
  const podeAvancar = somarMeses(mes, 1) <= limite;

  return (
    <div className="rounded-2xl border border-borda bg-painel p-4 select-none">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setMes(somarMeses(mes, -1))}
          disabled={!podeVoltar}
          className="rounded-lg p-2 text-texto-2 transition hover:bg-painel-3 disabled:opacity-25"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="size-5" />
        </button>
        <p className="font-display text-lg font-medium tracking-wide">
          {nomeMes(d.getMonth())} <span className="text-texto-3">{d.getFullYear()}</span>
        </p>
        <button
          onClick={() => setMes(somarMeses(mes, 1))}
          disabled={!podeAvancar}
          className="rounded-lg p-2 text-texto-2 transition hover:bg-painel-3 disabled:opacity-25"
          aria-label="Próximo mês"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-texto-3 uppercase">
        {[1, 2, 3, 4, 5, 6, 0].map((i) => (
          <div key={i} className="py-1">
            {nomeDiaCurto(i)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: offset }, (_, i) => (
          <div key={`v${i}`} />
        ))}
        {Array.from({ length: diasNoMes(mes) }, (_, i) => {
          const data = somarDias(mes, i);
          const bloqueado =
            (!permitirPassado && data < hj) || data > limite || (desabilitado ? desabilitado(data) : false);
          const sel = data === valor;
          const ehHoje = data === hj;
          return (
            <button
              key={data}
              disabled={bloqueado}
              onClick={() => aoEscolher(data)}
              className={`relative aspect-square rounded-xl text-sm font-medium transition ${
                sel
                  ? "scale-105 bg-marca-escuro text-white shadow-lg shadow-marca/25"
                  : bloqueado
                    ? "text-texto-3/40 line-through decoration-texto-3/30"
                    : "text-texto hover:bg-painel-3"
              }`}
            >
              {i + 1}
              {ehHoje && !sel && <span className="absolute bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-marca" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

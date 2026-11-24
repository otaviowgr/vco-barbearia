"use client";

import { CalendarX2, Moon, Sun, Sunrise } from "lucide-react";
import type { SlotDisponivel } from "@/types";
import { horaParaMin } from "@/lib/datas";
import { EstadoVazio, Skeleton } from "../ui/basicos";

const PERIODOS = [
  { nome: "Manhã", icone: Sunrise, de: 0, ate: 12 * 60 },
  { nome: "Tarde", icone: Sun, de: 12 * 60, ate: 18 * 60 },
  { nome: "Noite", icone: Moon, de: 18 * 60, ate: 24 * 60 },
];

export function GradeHorarios({
  slots,
  carregando,
  valor,
  aoEscolher,
  textoVazio = "Nenhum horário livre nesse dia. Tente outra data ou outro barbeiro.",
}: {
  slots?: SlotDisponivel[];
  carregando?: boolean;
  valor?: string;
  aoEscolher: (s: SlotDisponivel) => void;
  textoVazio?: string;
}) {
  if (carregando || !slots) {
    return (
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {Array.from({ length: 12 }, (_, i) => (
          <Skeleton key={i} className="h-11" />
        ))}
      </div>
    );
  }
  if (!slots.length) {
    return <EstadoVazio icone={<CalendarX2 className="size-6" />} titulo="Dia lotado" descricao={textoVazio} />;
  }
  return (
    <div className="space-y-5">
      {PERIODOS.map((p) => {
        const doPeriodo = slots.filter((s) => {
          const m = horaParaMin(s.hora);
          return m >= p.de && m < p.ate;
        });
        if (!doPeriodo.length) return null;
        const Icone = p.icone;
        return (
          <div key={p.nome} className="animate-entrar">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-texto-3 uppercase">
              <Icone className="size-3.5" /> {p.nome}
            </p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {doPeriodo.map((s) => (
                <button
                  key={s.hora}
                  onClick={() => aoEscolher(s)}
                  className={`h-11 rounded-xl border text-sm font-semibold tabular-nums transition ${
                    valor === s.hora
                      ? "scale-105 border-marca-escuro bg-marca-escuro text-white shadow-lg shadow-marca/25"
                      : "border-borda bg-painel-2 text-texto hover:border-marca/50 hover:text-marca"
                  }`}
                >
                  {s.hora}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

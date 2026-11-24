"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PontoSerie, RankingBarbeiro } from "@/types";
import { formatarMoeda } from "@/lib/formatadores";

const OURO = "#e8b04b";
const ANTERIOR = "#8b8b96";
const GRADE = "#2b2b30";
const TEXTO_EIXO = "#7c7c86";

const moedaCurta = (v: number) => (v >= 1000 ? `R$${Math.round(v / 1000)}k` : `R$${Math.round(v)}`);

function DicaTooltip({
  active,
  payload,
  label,
  prefixo,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string; dataKey: string }[];
  label?: string;
  prefixo?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-borda bg-painel-2/95 px-3 py-2 text-xs shadow-xl shadow-black/50 backdrop-blur">
      <p className="mb-1 font-semibold text-texto">
        {prefixo}
        {label}
      </p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-texto-2">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="ml-auto font-semibold text-texto">{formatarMoeda(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

/** Barras do período atual + linha do período anterior (mesmo eixo). */
export function GraficoFaturamento({
  dados,
  nomeAtual,
  nomeAnterior,
  prefixoRotulo = "",
}: {
  dados: PontoSerie[];
  nomeAtual: string;
  nomeAnterior: string;
  prefixoRotulo?: string;
}) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRADE} />
          <XAxis dataKey="rotulo" tick={{ fill: TEXTO_EIXO, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRADE }} interval="preserveStartEnd" minTickGap={6} />
          <YAxis tick={{ fill: TEXTO_EIXO, fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={moedaCurta} width={52} />
          <Tooltip cursor={{ fill: "rgb(255 255 255 / 0.04)" }} content={<DicaTooltip prefixo={prefixoRotulo} />} />
          <Legend
            verticalAlign="top"
            align="right"
            height={28}
            iconSize={10}
            formatter={(v) => <span className="text-xs text-texto-2">{v}</span>}
          />
          <Bar dataKey="valor" name={nomeAtual} fill={OURO} radius={[4, 4, 0, 0]} maxBarSize={28} animationDuration={700} />
          <Line
            dataKey="anterior"
            name={nomeAnterior}
            type="monotone"
            stroke={ANTERIOR}
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            activeDot={{ r: 4, fill: ANTERIOR, stroke: "#131315", strokeWidth: 2 }}
            animationDuration={700}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GraficoRanking({ dados }: { dados: RankingBarbeiro[] }) {
  return (
    <div style={{ height: Math.max(140, dados.length * 56) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} layout="vertical" margin={{ top: 0, right: 90, left: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="nome" tick={{ fill: "#b4b4bc", fontSize: 13 }} tickLine={false} axisLine={false} width={100} />
          <Tooltip
            cursor={{ fill: "rgb(255 255 255 / 0.04)" }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="rounded-xl border border-borda bg-painel-2 px-3 py-2 text-xs shadow-xl">
                  <p className="font-semibold">{(payload[0].payload as RankingBarbeiro).nome}</p>
                  <p className="text-texto-2">
                    {formatarMoeda((payload[0].payload as RankingBarbeiro).faturamento)} · {(payload[0].payload as RankingBarbeiro).atendimentos} atendimentos
                  </p>
                </div>
              ) : null
            }
          />
          <Bar dataKey="faturamento" radius={[0, 4, 4, 0]} maxBarSize={26} animationDuration={700}>
            {dados.map((d) => (
              <Cell key={d.barbeiroId} fill={d.cor} />
            ))}
            <LabelList dataKey="faturamento" position="right" formatter={(v) => formatarMoeda(Number(v))} style={{ fill: "#f4f4f5", fontSize: 12, fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

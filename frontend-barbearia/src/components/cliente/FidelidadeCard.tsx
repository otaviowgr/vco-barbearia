import Link from "next/link";
import { Crown, Gift, Scissors } from "lucide-react";
import type { ProgressoFidelidade } from "@/types";
import { BarraProgresso } from "../ui/basicos";

export function textoFidelidade(p: ProgressoFidelidade) {
  if (p.descontoDisponivel) return `Você ganhou ${p.percentual}% de desconto no próximo atendimento!`;
  return p.faltam === 1
    ? `Falta só 1 corte para ganhar ${p.percentual}% de desconto`
    : `Faltam ${p.faltam} cortes para ganhar ${p.percentual}% de desconto`;
}

export function FidelidadeCard({ progresso, link }: { progresso: ProgressoFidelidade; link?: boolean }) {
  const p = progresso;
  const conteudo = (
    <div className="relative overflow-hidden rounded-2xl border border-marca/30 bg-gradient-to-br from-marca-fundo via-painel to-painel p-5">
      <Crown className="absolute -top-4 -right-4 size-28 rotate-12 text-marca/[0.07]" />
      <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-marca uppercase">
        <Crown className="size-4" /> Plano fidelidade
      </div>
      <p className="mt-2 font-display text-xl leading-snug font-medium tracking-wide">{textoFidelidade(p)}</p>

      {p.descontoDisponivel ? (
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-marca/15 p-3 text-sm text-marca-claro">
          <Gift className="size-5 shrink-0 animate-bounce text-marca" />O desconto será aplicado automaticamente no seu próximo agendamento.
        </div>
      ) : (
        <>
          <div className="mt-4 flex gap-2">
            {Array.from({ length: p.meta }, (_, i) => (
              <span
                key={i}
                className={`grid size-9 flex-1 place-items-center rounded-lg border transition ${
                  i < p.progressoCiclo ? "border-marca/60 bg-marca/20 text-marca" : "border-dashed border-borda-forte text-texto-3"
                }`}
              >
                <Scissors className="size-4" />
              </span>
            ))}
          </div>
          <BarraProgresso valor={p.progressoCiclo} max={p.meta} className="mt-3" />
          <p className="mt-2 text-xs text-texto-3">
            {p.progressoCiclo} de {p.meta} atendimentos neste ciclo · {p.concluidos} no total
          </p>
        </>
      )}
    </div>
  );
  return link ? (
    <Link href="/cliente/fidelidade" className="block transition hover:-translate-y-0.5">
      {conteudo}
    </Link>
  ) : (
    conteudo
  );
}

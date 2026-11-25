"use client";

import Link from "next/link";
import { CalendarPlus, CheckCircle2, Gift, Repeat, Scissors, Sparkles } from "lucide-react";
import { useSessao } from "@/components/SessaoProvider";
import { useApi } from "@/hooks/useApi";
import { agendamentoService, fidelidadeService } from "@/services";
import { FidelidadeCard } from "@/components/cliente/FidelidadeCard";
import { Botao } from "@/components/ui/Botao";
import { Skeleton, TituloPagina } from "@/components/ui/basicos";
import { formatarData } from "@/lib/datas";
import { formatarMoeda } from "@/lib/formatadores";

export default function PaginaFidelidade() {
  const { sessao } = useSessao();
  const clienteId = sessao!.clienteId!;
  const { dados: p } = useApi(() => fidelidadeService.obterProgresso(clienteId), [clienteId]);
  const { dados: ags } = useApi(() => agendamentoService.listar({ clienteId }), [clienteId]);
  const usados = (ags ?? []).filter((a) => a.descontoFidelidade && a.status !== "cancelado" && a.status !== "nao_compareceu").reverse();
  const economia = usados.reduce((t, a) => t + a.desconto, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <TituloPagina titulo="Plano fidelidade" subtitulo="Cortou, acumulou. Simples assim." />
      {p ? <FidelidadeCard progresso={p} /> : <Skeleton className="h-48" />}

      {p?.descontoDisponivel && (
        <Link href="/cliente/agendar" className="block">
          <Botao tamanho="lg" largura="total" icone={<CalendarPlus className="size-5" />}>
            Usar meu desconto agora
          </Botao>
        </Link>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { icone: Scissors, titulo: "Atenda-se", texto: "Cada atendimento concluído conta 1 ponto." },
          { icone: Gift, titulo: `A cada ${p?.meta ?? 5}`, texto: `Você ganha ${p?.percentual ?? 20}% de desconto no próximo agendamento.` },
          { icone: Repeat, titulo: "Automático", texto: "O desconto aparece sozinho no resumo do agendamento." },
        ].map(({ icone: Icone, titulo, texto }) => (
          <div key={titulo} className="rounded-2xl border border-borda bg-painel p-4">
            <Icone className="size-5 text-marca" />
            <p className="mt-2 font-display text-lg tracking-wide">{titulo}</p>
            <p className="text-sm text-texto-2">{texto}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-borda bg-painel p-5">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 font-display text-lg tracking-wide uppercase">
            <Sparkles className="size-4 text-marca" /> Descontos já usados
          </p>
          <span className="text-sm text-texto-2">
            Economia total: <b className="text-sucesso">{formatarMoeda(economia)}</b>
          </span>
        </div>
        <div className="mt-3 divide-y divide-borda">
          {!ags ? (
            <Skeleton className="h-12" />
          ) : usados.length === 0 ? (
            <p className="py-3 text-sm text-texto-3">Você ainda não usou nenhum desconto.</p>
          ) : (
            usados.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-3 text-sm">
                <CheckCircle2 className="size-4 text-sucesso" />
                <span className="flex-1">
                  {formatarData(a.data)} · {a.servicos.map((s) => s.nome).join(" + ")}
                </span>
                <span className="text-sucesso">− {formatarMoeda(a.desconto)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

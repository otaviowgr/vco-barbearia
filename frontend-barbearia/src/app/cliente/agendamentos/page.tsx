"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus, History, CalendarCheck } from "lucide-react";
import type { Agendamento } from "@/types";
import { useSessao } from "@/components/SessaoProvider";
import { useApi } from "@/hooks/useApi";
import { agendamentoService, barbeiroService } from "@/services";
import { AgendamentoCard } from "@/components/cliente/AgendamentoCard";
import { RemarcarModal } from "@/components/agenda/RemarcarModal";
import { Confirmar } from "@/components/ui/Modal";
import { EstadoVazio, Segmentado, Skeleton, TituloPagina } from "@/components/ui/basicos";
import { Botao } from "@/components/ui/Botao";
import { useToast } from "@/components/ui/Toast";
import { agoraMin, formatarDataAmigavel, hoje, horaParaMin } from "@/lib/datas";
import { formatarMoeda } from "@/lib/formatadores";

export default function MeusAgendamentos() {
  const { sessao } = useSessao();
  const clienteId = sessao!.clienteId!;
  const router = useRouter();
  const toast = useToast();
  const [aba, setAba] = useState<"proximos" | "historico">("proximos");
  const [remarcando, setRemarcando] = useState<Agendamento | null>(null);
  const [cancelando, setCancelando] = useState<Agendamento | null>(null);

  const { dados: todos, carregando } = useApi(() => agendamentoService.listar({ clienteId }), [clienteId]);
  const { dados: barbeiros } = useApi(() => barbeiroService.listar({ incluirInativos: true }), []);

  const hj = hoje();
  const ehProximo = (a: Agendamento) =>
    (a.status === "pendente" || a.status === "confirmado") &&
    (a.data > hj || (a.data === hj && horaParaMin(a.fim) >= agoraMin()));
  const proximos = (todos ?? []).filter(ehProximo);
  const historico = (todos ?? []).filter((a) => !ehProximo(a)).reverse();
  const lista = aba === "proximos" ? proximos : historico;
  const totalGasto = historico.filter((a) => a.status === "concluido").reduce((t, a) => t + a.valorFinal, 0);

  return (
    <div className="mx-auto max-w-3xl">
      <TituloPagina
        titulo="Meus horários"
        subtitulo={todos ? `${historico.filter((a) => a.status === "concluido").length} atendimentos · ${formatarMoeda(totalGasto)} investidos no visual` : " "}
        acoes={
          <Link href="/cliente/agendar">
            <Botao icone={<CalendarPlus className="size-4" />}>Novo agendamento</Botao>
          </Link>
        }
      />
      <Segmentado
        className="mb-5 w-full sm:w-auto"
        valor={aba}
        aoMudar={setAba}
        opcoes={[
          { valor: "proximos", rotulo: `Próximos${todos ? ` (${proximos.length})` : ""}` },
          { valor: "historico", rotulo: `Histórico${todos ? ` (${historico.length})` : ""}` },
        ]}
      />
      <div className="space-y-3">
        {carregando ? (
          Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-36" />)
        ) : lista.length === 0 ? (
          aba === "proximos" ? (
            <EstadoVazio
              icone={<CalendarCheck className="size-6" />}
              titulo="Nenhum horário marcado"
              descricao="Seu próximo corte está a poucos cliques de distância."
              acao={
                <Link href="/cliente/agendar">
                  <Botao>Agendar agora</Botao>
                </Link>
              }
            />
          ) : (
            <EstadoVazio icone={<History className="size-6" />} titulo="Sem histórico ainda" descricao="Seus atendimentos aparecerão aqui." />
          )
        ) : (
          lista.map((a) => (
            <AgendamentoCard
              key={a.id}
              agendamento={a}
              barbeiro={barbeiros?.find((b) => b.id === a.barbeiroId)}
              aoRemarcar={() => setRemarcando(a)}
              aoCancelar={() => setCancelando(a)}
              aoRepetir={() => router.push(`/cliente/agendar?servicos=${a.servicos.map((s) => s.id).join(",")}`)}
            />
          ))
        )}
      </div>

      <RemarcarModal agendamento={remarcando} aoFechar={() => setRemarcando(null)} por="cliente" />
      <Confirmar
        aberto={!!cancelando}
        aoFechar={() => setCancelando(null)}
        titulo="Cancelar agendamento?"
        perigo
        textoConfirmar="Sim, cancelar"
        mensagem={
          cancelando && (
            <>
              <p>
                {cancelando.servicos.map((s) => s.nome).join(" + ")} em <b className="text-texto">{formatarDataAmigavel(cancelando.data)}</b> às{" "}
                <b className="text-texto">{cancelando.inicio}</b>.
              </p>
              {cancelando.statusPagamento === "pago" && (
                <p className="mt-2 text-marca">O valor pago online ({formatarMoeda(cancelando.valorFinal)}) será estornado.</p>
              )}
              {cancelando.descontoFidelidade && <p className="mt-2">Seu desconto fidelidade volta a ficar disponível.</p>}
            </>
          )
        }
        aoConfirmar={async () => {
          try {
            await agendamentoService.cancelar(cancelando!.id, "cliente");
            toast.sucesso("Agendamento cancelado");
            setCancelando(null);
          } catch (e) {
            toast.erro("Erro ao cancelar", (e as Error).message);
          }
        }}
      />
    </div>
  );
}

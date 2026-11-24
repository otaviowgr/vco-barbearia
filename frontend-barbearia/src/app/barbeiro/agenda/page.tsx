"use client";

import { useMemo, useState } from "react";
import { Bell, CalendarPlus, ChevronLeft, ChevronRight, Eye, EyeOff, Lock } from "lucide-react";
import type { Agendamento, Bloqueio } from "@/types";
import { useSessao } from "@/components/SessaoProvider";
import { useApi } from "@/hooks/useApi";
import {
  agendamentoService,
  barbeiroService,
  bloqueioService,
  clienteService,
  configService,
  servicoService,
} from "@/services";
import { Timeline, type ColunaTimeline } from "@/components/barbeiro/Timeline";
import { DetalheAgendamentoModal } from "@/components/barbeiro/DetalheAgendamentoModal";
import { NovoAgendamentoModal, type PrefillAgendamento } from "@/components/barbeiro/NovoAgendamentoModal";
import { BloqueioModal } from "@/components/barbeiro/BloqueioModal";
import { RemarcarModal } from "@/components/agenda/RemarcarModal";
import { Confirmar } from "@/components/ui/Modal";
import { Avatar, Segmentado, Select, Skeleton } from "@/components/ui/basicos";
import { Botao } from "@/components/ui/Botao";
import { useToast } from "@/components/ui/Toast";
import {
  deISODate,
  diaDaSemana,
  formatarDataAmigavel,
  formatarDataCurta,
  hoje,
  horaParaMin,
  inicioDaSemana,
  nomeDiaCurto,
  nomeMesCurto,
  somarDias,
} from "@/lib/datas";
import { formatarMoeda, primeiroNome } from "@/lib/formatadores";

type Modo = "dia" | "semana";

export default function PaginaAgenda() {
  const { sessao } = useSessao();
  const toast = useToast();
  const config = configService.obterSync();
  const [modo, setModo] = useState<Modo>("dia");
  const [data, setData] = useState(hoje());
  const [barbeiroSemana, setBarbeiroSemana] = useState(sessao?.barbeiroId ?? "");
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [remarcando, setRemarcando] = useState<Agendamento | null>(null);
  const [prefillNovo, setPrefillNovo] = useState<PrefillAgendamento | null>(null);
  const [prefillBloqueio, setPrefillBloqueio] = useState<PrefillAgendamento | null>(null);
  const [removendoBloqueio, setRemovendoBloqueio] = useState<Bloqueio | null>(null);

  const inicio = modo === "dia" ? data : inicioDaSemana(data);
  const fim = modo === "dia" ? data : somarDias(inicio, 6);

  const { dados: agendamentos, carregando } = useApi(() => agendamentoService.listar({ inicio, fim }), [inicio, fim]);
  const { dados: bloqueios } = useApi(() => bloqueioService.listar({ inicio, fim }), [inicio, fim]);
  const { dados: barbeiros } = useApi(() => barbeiroService.listar({ incluirInativos: true }), []);
  const { dados: clientes } = useApi(() => clienteService.listarBasico(), []);
  const { dados: servicos } = useApi(() => servicoService.listar({ incluirInativos: true }), []);
  const { dados: novos } = useApi(
    () =>
      agendamentoService
        .listar({ inicio: hoje(), status: ["pendente", "confirmado"] })
        .then((l) => l.filter((a) => !a.vistoPeloBarbeiro)),
    [],
  );

  const mapaClientes = useMemo(() => new Map((clientes ?? []).map((c) => [c.id, c])), [clientes]);
  const mapaBarbeiros = useMemo(() => new Map((barbeiros ?? []).map((b) => [b.id, b])), [barbeiros]);
  const ativos = (barbeiros ?? []).filter((b) => b.ativo);
  const barbeiroSemanaEfetivo = barbeiroSemana || ativos[0]?.id || "";

  const visiveis = (agendamentos ?? []).filter(
    (a) => mostrarInativos || (a.status !== "cancelado" && a.status !== "nao_compareceu"),
  );

  // colunas
  const colunas: ColunaTimeline[] =
    modo === "dia"
      ? ativos.map((b) => {
          const qtd = visiveis.filter((a) => a.barbeiroId === b.id && a.status !== "cancelado" && a.status !== "nao_compareceu").length;
          return {
            chave: b.id,
            data,
            barbeiroId: b.id,
            fechado: !config.horarios[diaDaSemana(data)],
            cabecalho: (
              <div className="flex items-center gap-2">
                <Avatar nome={b.nome} cor={b.cor} tamanho={30} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{primeiroNome(b.nome)}</p>
                  <p className="text-[11px] text-texto-3">{qtd} agendamento{qtd === 1 ? "" : "s"}</p>
                </div>
              </div>
            ),
          };
        })
      : Array.from({ length: 7 }, (_, i) => {
          const d = somarDias(inicio, i);
          const dt = deISODate(d);
          const ehHoje = d === hoje();
          return {
            chave: d,
            data: d,
            barbeiroId: barbeiroSemanaEfetivo,
            fechado: !config.horarios[dt.getDay()],
            cabecalho: (
              <button onClick={() => { setData(d); setModo("dia"); }} className="flex w-full items-center gap-2 text-left">
                <span className={`grid size-9 place-items-center rounded-lg font-display text-lg font-semibold ${ehHoje ? "bg-marca-escuro text-white" : "bg-painel-3"}`}>
                  {dt.getDate()}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{nomeDiaCurto(dt.getDay())}</span>
                  <span className="block text-[11px] text-texto-3">
                    {visiveis.filter((a) => a.data === d && a.barbeiroId === barbeiroSemanaEfetivo).length} agend.
                  </span>
                </span>
              </button>
            ),
          };
        });

  // faixa de horário exibida
  const diasVisiveis = modo === "dia" ? [data] : Array.from({ length: 7 }, (_, i) => somarDias(inicio, i));
  const horariosAbertos = diasVisiveis.map((d) => config.horarios[diaDaSemana(d)]).filter(Boolean) as { abre: string; fecha: string }[];
  const inicioMin = horariosAbertos.length ? Math.min(...horariosAbertos.map((h) => horaParaMin(h.abre))) : 8 * 60;
  const fimMin = horariosAbertos.length ? Math.max(...horariosAbertos.map((h) => horaParaMin(h.fecha))) : 20 * 60;

  // resumo do período
  const validos = (agendamentos ?? []).filter(
    (a) => a.status !== "cancelado" && a.status !== "nao_compareceu" && (modo === "dia" || a.barbeiroId === barbeiroSemanaEfetivo),
  );
  const previsto = validos.reduce((t, a) => t + a.valorFinal, 0);
  const recebido = validos.filter((a) => a.status === "concluido").reduce((t, a) => t + a.valorFinal, 0);
  const pendentes = validos.filter((a) => a.status === "pendente").length;

  const selecionado = (agendamentos ?? []).find((a) => a.id === selecionadoId) ?? null;

  const abrir = (a: Agendamento) => {
    setSelecionadoId(a.id);
    if (!a.vistoPeloBarbeiro) agendamentoService.marcarComoVistos([a.id]);
  };

  const navegar = (dir: number) => setData((d) => somarDias(d, dir * (modo === "dia" ? 1 : 7)));
  const tituloPeriodo =
    modo === "dia"
      ? formatarDataAmigavel(data)
      : `${deISODate(inicio).getDate()} ${nomeMesCurto(deISODate(inicio).getMonth())} – ${deISODate(fim).getDate()} ${nomeMesCurto(deISODate(fim).getMonth())}`;

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto font-display text-3xl font-semibold tracking-wide uppercase">Agenda</h1>
        <Botao variante="secundario" icone={<Lock className="size-4" />} onClick={() => setPrefillBloqueio({ data: data < hoje() ? hoje() : data })}>
          <span className="hidden sm:inline">Bloquear horário</span>
          <span className="sm:hidden">Bloquear</span>
        </Botao>
        <Botao icone={<CalendarPlus className="size-4" />} onClick={() => setPrefillNovo({ data: data < hoje() ? hoje() : data })}>
          Novo<span className="hidden sm:inline"> agendamento</span>
        </Botao>
      </div>

      {/* Novos agendamentos */}
      {!!novos?.length && (
        <div className="mb-4 animate-entrar rounded-2xl border border-marca/40 bg-marca/[0.07] p-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid size-8 animate-pulso-marca place-items-center rounded-full bg-marca-escuro text-white">
              <Bell className="size-4" />
            </span>
            <p className="font-semibold">
              {novos.length} novo{novos.length > 1 ? "s" : ""} agendamento{novos.length > 1 ? "s" : ""} pelo app
            </p>
            <button
              onClick={() => agendamentoService.marcarComoVistos(novos.map((n) => n.id))}
              className="ml-auto text-xs text-texto-2 underline-offset-2 hover:text-marca hover:underline"
            >
              Marcar todos como vistos
            </button>
          </div>
          <div className="sem-scroll mt-3 flex gap-2 overflow-x-auto">
            {novos.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  setModo("dia");
                  setData(n.data);
                  abrir(n);
                }}
                className="shrink-0 rounded-xl border border-borda bg-painel px-3 py-2 text-left transition hover:border-marca/60"
              >
                <p className="text-sm font-semibold">{mapaClientes.get(n.clienteId)?.nome ?? "Cliente"}</p>
                <p className="text-xs text-texto-2">
                  {formatarDataCurta(n.data)} · {n.inicio} · {primeiroNome(mapaBarbeiros.get(n.barbeiroId)?.nome ?? "")}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controles */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-xl border border-borda bg-painel-2">
          <button onClick={() => navegar(-1)} className="rounded-l-xl p-2.5 text-texto-2 hover:bg-painel-3 hover:text-texto" aria-label="Anterior">
            <ChevronLeft className="size-4" />
          </button>
          <span className="min-w-44 px-2 text-center text-sm font-semibold">{tituloPeriodo}</span>
          <button onClick={() => navegar(1)} className="rounded-r-xl p-2.5 text-texto-2 hover:bg-painel-3 hover:text-texto" aria-label="Próximo">
            <ChevronRight className="size-4" />
          </button>
        </div>
        <Botao variante="secundario" tamanho="sm" className="h-10" onClick={() => setData(hoje())} disabled={data === hoje()}>
          Hoje
        </Botao>
        <input
          type="date"
          value={data}
          onChange={(e) => e.target.value && setData(e.target.value)}
          className="h-10 rounded-xl border border-borda bg-painel-2 px-3 text-sm text-texto-2 [color-scheme:dark]"
          aria-label="Escolher data"
        />
        <Segmentado
          valor={modo}
          aoMudar={setModo}
          opcoes={[
            { valor: "dia", rotulo: "Dia" },
            { valor: "semana", rotulo: "Semana" },
          ]}
        />
        {modo === "semana" && (
          <Select value={barbeiroSemanaEfetivo} onChange={(e) => setBarbeiroSemana(e.target.value)} className="!h-10 !w-auto">
            {ativos.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nome}
              </option>
            ))}
          </Select>
        )}
        <button
          onClick={() => setMostrarInativos((v) => !v)}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs text-texto-2 hover:bg-painel-2 hover:text-texto"
        >
          {mostrarInativos ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          Cancelados e faltas
        </button>
      </div>

      {/* Resumo */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { r: "Agendamentos", v: String(validos.length) },
          { r: "A confirmar", v: String(pendentes), destaque: pendentes > 0 },
          { r: "Previsto", v: formatarMoeda(previsto) },
          { r: "Já recebido", v: formatarMoeda(recebido), marca: true },
        ].map((k) => (
          <div key={k.r} className="rounded-xl border border-borda bg-painel px-3.5 py-2.5">
            <p className="text-[11px] tracking-wide text-texto-3 uppercase">{k.r}</p>
            <p className={`font-display text-xl font-semibold ${k.marca ? "text-marca" : k.destaque ? "text-aviso" : ""}`}>{k.v}</p>
          </div>
        ))}
      </div>

      {carregando || !barbeiros || !clientes ? (
        <Skeleton className="h-[480px]" />
      ) : (
        <Timeline
          colunas={colunas}
          agendamentos={modo === "dia" ? visiveis : visiveis.filter((a) => a.barbeiroId === barbeiroSemanaEfetivo)}
          bloqueios={bloqueios ?? []}
          inicioMin={inicioMin}
          fimMin={fimMin}
          clientes={mapaClientes}
          barbeiros={mapaBarbeiros}
          aoClicarAgendamento={abrir}
          aoClicarVazio={(barbeiroId, d, hora) => setPrefillNovo({ barbeiroId, data: d, hora })}
          aoClicarBloqueio={setRemovendoBloqueio}
        />
      )}
      <p className="mt-2 text-xs text-texto-3">
        Dica: clique em um espaço vazio da agenda para criar um agendamento naquele horário.
      </p>

      {/* Modais */}
      <DetalheAgendamentoModal
        agendamento={selecionado}
        cliente={selecionado ? mapaClientes.get(selecionado.clienteId) : undefined}
        barbeiro={selecionado ? mapaBarbeiros.get(selecionado.barbeiroId) : undefined}
        aoFechar={() => setSelecionadoId(null)}
        aoRemarcar={(a) => {
          setSelecionadoId(null);
          setRemarcando(a);
        }}
      />
      <RemarcarModal agendamento={remarcando} aoFechar={() => setRemarcando(null)} por="barbeiro" barbeiros={barbeiros} />
      {barbeiros && servicos && clientes && (
        <NovoAgendamentoModal prefill={prefillNovo} aoFechar={() => setPrefillNovo(null)} barbeiros={barbeiros} servicos={servicos} clientes={clientes} />
      )}
      {barbeiros && <BloqueioModal prefill={prefillBloqueio} aoFechar={() => setPrefillBloqueio(null)} barbeiros={barbeiros} />}
      <Confirmar
        aberto={!!removendoBloqueio}
        aoFechar={() => setRemovendoBloqueio(null)}
        titulo="Remover bloqueio?"
        mensagem={removendoBloqueio && `${removendoBloqueio.motivo} · ${removendoBloqueio.inicio} – ${removendoBloqueio.fim}. O horário volta a ficar disponível para agendamento.`}
        textoConfirmar="Remover"
        perigo
        aoConfirmar={async () => {
          await bloqueioService.remover(removendoBloqueio!.id);
          toast.sucesso("Bloqueio removido");
          setRemovendoBloqueio(null);
        }}
      />
    </div>
  );
}

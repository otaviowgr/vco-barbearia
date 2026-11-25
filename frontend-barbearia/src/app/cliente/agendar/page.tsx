"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  CreditCard,
  Gift,
  QrCode,
  Store,
  Users,
} from "lucide-react";
import type { Agendamento, SlotDisponivel } from "@/types";
import { useSessao } from "@/components/SessaoProvider";
import { useApi } from "@/hooks/useApi";
import {
  agendamentoService,
  barbeiroService,
  configService,
  ErroApi,
  fidelidadeService,
  servicoService,
} from "@/services";
import { ServicoCard } from "@/components/cliente/ServicoCard";
import { PagamentoSimulado } from "@/components/cliente/PagamentoSimulado";
import { Calendario } from "@/components/agenda/Calendario";
import { GradeHorarios } from "@/components/agenda/GradeHorarios";
import { Avatar, Skeleton } from "@/components/ui/basicos";
import { Botao } from "@/components/ui/Botao";
import { useToast } from "@/components/ui/Toast";
import { diaDaSemana, formatarDataAmigavel, formatarDuracao, hoje, nomeDiaCurto, somarDias, deISODate } from "@/lib/datas";
import { formatarMoeda } from "@/lib/formatadores";

const ETAPAS = ["Serviços", "Barbeiro", "Data", "Horário", "Pagamento", "Resumo"];
type OpcaoPagamento = "pix" | "cartao" | "na_barbearia";

function servicosDaUrl(): string[] {
  if (typeof window === "undefined") return [];
  const p = new URLSearchParams(window.location.search).get("servicos");
  return p ? p.split(",").filter(Boolean) : [];
}

export default function PaginaAgendar() {
  const { sessao } = useSessao();
  const clienteId = sessao!.clienteId!;
  const router = useRouter();
  const toast = useToast();
  const config = configService.obterSync();

  const [etapa, setEtapa] = useState(0);
  const [servicoIds, setServicoIds] = useState<string[]>(servicosDaUrl);
  const [barbeiroId, setBarbeiroId] = useState<string | null | undefined>(undefined); // null = qualquer
  const [data, setData] = useState<string>();
  const [slot, setSlot] = useState<SlotDisponivel>();
  const [pagamento, setPagamento] = useState<OpcaoPagamento>();
  const [pagando, setPagando] = useState(false);
  const [criando, setCriando] = useState(false);
  const [criado, setCriado] = useState<Agendamento>();

  const { dados: servicos } = useApi(() => servicoService.listar(), []);
  const { dados: barbeiros } = useApi(() => barbeiroService.listar(), []);

  const selecionados = useMemo(
    () => (servicos ?? []).filter((s) => servicoIds.includes(s.id)),
    [servicos, servicoIds],
  );
  const total = selecionados.reduce((t, s) => t + s.preco, 0);
  const duracao = selecionados.reduce((t, s) => t + s.duracaoMin, 0);

  const { dados: slots, carregando: carregandoSlots } = useApi(
    () =>
      data && duracao
        ? agendamentoService.horariosDisponiveis({ data, duracaoMin: duracao, barbeiroId })
        : Promise.resolve(undefined),
    [data, duracao, barbeiroId],
  );
  const { dados: desconto } = useApi(
    () => (etapa >= 4 && total ? fidelidadeService.simularDesconto(clienteId, total) : Promise.resolve(undefined)),
    [etapa >= 4, total, clienteId],
  );
  const valorFinal = total - (desconto?.desconto ?? 0);

  const podeAvancar = [
    servicoIds.length > 0,
    barbeiroId !== undefined,
    !!data,
    !!slot,
    !!pagamento,
    true,
  ][etapa];

  const alternarServico = (id: string) =>
    setServicoIds((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));

  const nomeBarbeiro = (id?: string | null) => barbeiros?.find((b) => b.id === id)?.nome;
  const proximosDias = useMemo(() => {
    const dias: string[] = [];
    for (let i = 0; dias.length < 7 && i < 14; i++) {
      const d = somarDias(hoje(), i);
      if (config.horarios[diaDaSemana(d)]) dias.push(d);
    }
    return dias;
  }, [config.horarios]);

  const criar = async (pagamentoAprovado: boolean) => {
    if (!data || !slot || !pagamento) return;
    setCriando(true);
    try {
      const novo = await agendamentoService.criar({
        clienteId,
        barbeiroId: barbeiroId ?? null,
        servicoIds,
        data,
        inicio: slot.hora,
        formaPagamento: pagamento === "na_barbearia" ? "na_barbearia" : "online",
        metodoPagamento: pagamento === "na_barbearia" ? undefined : pagamento,
        pagamentoAprovado,
        criadoPor: "cliente",
      });
      setPagando(false);
      setCriado(novo);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setPagando(false);
      toast.erro("Não foi possível agendar", (e as Error).message);
      if (e instanceof ErroApi && e.status === 409) {
        setSlot(undefined);
        setEtapa(3);
      }
    } finally {
      setCriando(false);
    }
  };

  const confirmar = () => {
    if (pagamento === "na_barbearia") criar(false);
    else setPagando(true);
  };

  if (criado) {
    return <Sucesso agendamento={criado} barbeiro={barbeiros?.find((b) => b.id === criado.barbeiroId)} />;
  }

  return (
    <div className="mx-auto max-w-4xl pb-28">
      {/* Cabeçalho + progresso */}
      <div className="mb-6">
        <button
          onClick={() => (etapa ? setEtapa(etapa - 1) : router.push("/cliente"))}
          className="mb-3 inline-flex items-center gap-1 text-sm text-texto-2 hover:text-marca"
        >
          <ArrowLeft className="size-4" /> {etapa ? "Voltar" : "Início"}
        </button>
        <div className="flex items-baseline justify-between">
          <h1 className="font-display text-3xl font-semibold tracking-wide uppercase">{ETAPAS[etapa]}</h1>
          <span className="text-sm text-texto-3">
            Etapa {etapa + 1} de {ETAPAS.length}
          </span>
        </div>
        <div className="mt-3 flex gap-1.5">
          {ETAPAS.map((nome, i) => (
            <button
              key={nome}
              disabled={i > etapa}
              onClick={() => setEtapa(i)}
              className="group flex-1"
              aria-label={`Ir para ${nome}`}
            >
              <span
                className={`block h-1.5 rounded-full transition-all duration-500 ${
                  i < etapa ? "bg-marca" : i === etapa ? "bg-gradient-to-r from-marca to-marca/40" : "bg-painel-3"
                }`}
              />
              <span className={`mt-1.5 hidden text-[11px] sm:block ${i <= etapa ? "text-texto-2" : "text-texto-3"}`}>{nome}</span>
            </button>
          ))}
        </div>
      </div>

      <div key={etapa} className="animate-entrar">
        {/* 1. Serviços */}
        {etapa === 0 && (
          <>
            <p className="mb-4 text-sm text-texto-2">Escolha um ou mais serviços — o preço e o tempo são somados automaticamente.</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {!servicos
                ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-32" />)
                : servicos.map((s) => (
                    <ServicoCard key={s.id} servico={s} compacto selecionado={servicoIds.includes(s.id)} aoClicar={() => alternarServico(s.id)} />
                  ))}
            </div>
          </>
        )}

        {/* 2. Barbeiro */}
        {etapa === 1 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <OpcaoCard
              ativo={barbeiroId === null}
              aoClicar={() => {
                setBarbeiroId(null);
                setSlot(undefined);
              }}
              icone={
                <span className="grid size-14 place-items-center rounded-full bg-marca/15 text-marca">
                  <Users className="size-6" />
                </span>
              }
              titulo="Qualquer barbeiro disponível"
              descricao="Mais opções de horário"
            />
            {barbeiros?.map((b) => (
              <OpcaoCard
                key={b.id}
                ativo={barbeiroId === b.id}
                aoClicar={() => {
                  setBarbeiroId(b.id);
                  setSlot(undefined);
                }}
                icone={<Avatar nome={b.nome} cor={b.cor} tamanho={56} />}
                titulo={b.nome}
                descricao={b.especialidade}
              />
            ))}
          </div>
        )}

        {/* 3. Data */}
        {etapa === 2 && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <div className="min-w-0">
              <p className="mb-3 text-sm text-texto-2">Próximos dias</p>
              <div className="sem-scroll -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-4 md:px-0">
                {proximosDias.map((d) => {
                  const dt = deISODate(d);
                  const sel = d === data;
                  return (
                    <button
                      key={d}
                      onClick={() => {
                        setData(d);
                        setSlot(undefined);
                      }}
                      className={`flex w-16 shrink-0 flex-col items-center rounded-xl border py-2.5 transition md:w-auto ${
                        sel ? "border-marca-escuro bg-marca-escuro text-white" : "border-borda bg-painel-2 hover:border-marca/50"
                      }`}
                    >
                      <span className="text-[11px] font-semibold uppercase">{d === hoje() ? "Hoje" : nomeDiaCurto(dt.getDay())}</span>
                      <span className="font-display text-2xl font-semibold">{dt.getDate()}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-xs text-texto-3">Fechamos aos domingos. Agendamentos com até 60 dias de antecedência.</p>
            </div>
            <Calendario
              valor={data}
              aoEscolher={(d) => {
                setData(d);
                setSlot(undefined);
              }}
              desabilitado={(d) => !config.horarios[diaDaSemana(d)]}
            />
          </div>
        )}

        {/* 4. Horário */}
        {etapa === 3 && data && (
          <>
            <p className="mb-4 text-sm text-texto-2">
              <span className="font-semibold text-texto">{formatarDataAmigavel(data)}</span> · {formatarDuracao(duracao)} ·{" "}
              {barbeiroId ? nomeBarbeiro(barbeiroId) : "qualquer barbeiro"}
            </p>
            <GradeHorarios slots={slots} carregando={carregandoSlots} valor={slot?.hora} aoEscolher={setSlot} />
          </>
        )}

        {/* 5. Pagamento */}
        {etapa === 4 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-widest text-texto-3 uppercase">Pagar agora</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <OpcaoCard
                ativo={pagamento === "pix"}
                aoClicar={() => setPagamento("pix")}
                icone={<IconePag><QrCode className="size-6" /></IconePag>}
                titulo="Pix"
                descricao="Aprovação na hora, com QR Code"
              />
              <OpcaoCard
                ativo={pagamento === "cartao"}
                aoClicar={() => setPagamento("cartao")}
                icone={<IconePag><CreditCard className="size-6" /></IconePag>}
                titulo="Cartão de crédito"
                descricao="Visa, Master, Elo"
              />
            </div>
            <p className="pt-3 text-xs font-semibold tracking-widest text-texto-3 uppercase">Ou</p>
            <OpcaoCard
              ativo={pagamento === "na_barbearia"}
              aoClicar={() => setPagamento("na_barbearia")}
              icone={<IconePag><Store className="size-6" /></IconePag>}
              titulo="Pagar na barbearia"
              descricao="Dinheiro, Pix ou cartão no dia do atendimento"
            />
          </div>
        )}

        {/* 6. Resumo */}
        {etapa === 5 && data && slot && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div className="space-y-3 rounded-2xl border border-borda bg-painel p-5">
              <LinhaResumo icone={<CalendarDays className="size-4" />} rotulo="Data" valor={formatarDataAmigavel(data)} />
              <LinhaResumo icone={<Clock className="size-4" />} rotulo="Horário" valor={`${slot.hora} · ${formatarDuracao(duracao)}`} />
              <LinhaResumo
                icone={<Users className="size-4" />}
                rotulo="Barbeiro"
                valor={
                  barbeiroId
                    ? nomeBarbeiro(barbeiroId)!
                    : slot.barbeiroIds.length === 1
                      ? nomeBarbeiro(slot.barbeiroIds[0])!
                      : "Definido automaticamente"
                }
              />
              <LinhaResumo
                icone={pagamento === "na_barbearia" ? <Store className="size-4" /> : pagamento === "pix" ? <QrCode className="size-4" /> : <CreditCard className="size-4" />}
                rotulo="Pagamento"
                valor={pagamento === "na_barbearia" ? "Na barbearia" : pagamento === "pix" ? "Pix (agora)" : "Cartão (agora)"}
              />
              <div className="h-px bg-borda" />
              {selecionados.map((s) => (
                <div key={s.id} className="flex justify-between text-sm">
                  <span className="text-texto-2">{s.nome}</span>
                  <span>{formatarMoeda(s.preco)}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col rounded-2xl border border-marca/30 bg-gradient-to-b from-marca-fundo to-painel p-5">
              <div className="flex justify-between text-sm">
                <span className="text-texto-2">Valor original</span>
                <span className={desconto?.aplicado ? "text-texto-3 line-through" : ""}>{formatarMoeda(total)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="flex items-center gap-1.5 text-texto-2">
                  <Gift className="size-4 text-marca" /> Desconto fidelidade
                </span>
                {!desconto ? (
                  <Skeleton className="h-5 w-16" />
                ) : desconto.aplicado ? (
                  <span className="font-semibold text-sucesso">− {formatarMoeda(desconto.desconto)}</span>
                ) : (
                  <span className="text-texto-3">—</span>
                )}
              </div>
              {desconto?.aplicado && (
                <p className="mt-2 animate-entrar rounded-lg bg-marca/15 px-3 py-2 text-xs text-marca-claro">
                  🎉 Você completou o plano fidelidade e ganhou {desconto.percentual}% de desconto!
                </p>
              )}
              <div className="my-4 h-px bg-borda" />
              <div className="flex items-end justify-between">
                <span className="text-sm text-texto-2">Total</span>
                <span className="font-display text-4xl font-semibold text-marca">{formatarMoeda(valorFinal)}</span>
              </div>
              <Botao className="mt-5" tamanho="lg" largura="total" carregando={criando && !pagando} onClick={confirmar} icone={<Check className="size-5" />}>
                {pagamento === "na_barbearia" ? "Confirmar agendamento" : `Pagar e confirmar`}
              </Botao>
            </div>
          </div>
        )}
      </div>

      {/* Barra inferior fixa */}
      {etapa < 5 && (
        <div className="fixed inset-x-0 bottom-[64px] z-20 border-t border-borda bg-painel/95 backdrop-blur-xl lg:bottom-0">
          <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3 sm:px-6">
            <div className="min-w-0 flex-1">
              {servicoIds.length ? (
                <>
                  <p className="truncate text-xs text-texto-2">
                    {selecionados.length} serviço{selecionados.length > 1 ? "s" : ""} · {formatarDuracao(duracao)}
                    {slot && data ? ` · ${formatarDataAmigavel(data).split(",")[0]} ${slot.hora}` : ""}
                  </p>
                  <p className="font-display text-2xl leading-tight font-semibold text-marca">{formatarMoeda(total)}</p>
                </>
              ) : (
                <p className="text-sm text-texto-3">Selecione pelo menos um serviço</p>
              )}
            </div>
            <Botao tamanho="lg" disabled={!podeAvancar} onClick={() => setEtapa(etapa + 1)}>
              Continuar <ArrowRight className="size-4" />
            </Botao>
          </div>
        </div>
      )}

      {pagamento && pagamento !== "na_barbearia" && (
        <PagamentoSimulado
          aberto={pagando}
          metodo={pagamento}
          valor={valorFinal}
          aoFechar={() => !criando && setPagando(false)}
          aoAprovar={() => criar(true)}
        />
      )}
    </div>
  );
}

function IconePag({ children }: { children: React.ReactNode }) {
  return <span className="grid size-14 place-items-center rounded-2xl bg-painel-3 text-marca">{children}</span>;
}

function OpcaoCard({
  ativo,
  aoClicar,
  icone,
  titulo,
  descricao,
}: {
  ativo: boolean;
  aoClicar: () => void;
  icone: React.ReactNode;
  titulo: string;
  descricao: string;
}) {
  return (
    <button
      onClick={aoClicar}
      aria-pressed={ativo}
      className={`flex w-full items-center gap-4 rounded-2xl border bg-painel p-4 text-left transition hover:-translate-y-0.5 ${
        ativo ? "border-marca ring-2 ring-marca/30" : "border-borda hover:border-marca/40"
      }`}
    >
      {icone}
      <span className="min-w-0 flex-1">
        <span className="block font-display text-lg font-medium tracking-wide">{titulo}</span>
        <span className="block text-sm text-texto-2">{descricao}</span>
      </span>
      <span className={`grid size-6 shrink-0 place-items-center rounded-full border transition ${ativo ? "border-marca-escuro bg-marca-escuro text-white" : "border-borda-forte"}`}>
        {ativo && <Check className="size-4" strokeWidth={3} />}
      </span>
    </button>
  );
}

function LinhaResumo({ icone, rotulo, valor }: { icone: React.ReactNode; rotulo: string; valor: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="grid size-8 place-items-center rounded-lg bg-painel-3 text-marca">{icone}</span>
      <span className="text-texto-2">{rotulo}</span>
      <span className="ml-auto text-right font-medium">{valor}</span>
    </div>
  );
}

const CORES_CONFETE = ["#3b82f6", "#60a5fa", "#ffffff", "#93c5fd", "#a1a1aa"];

function Sucesso({ agendamento: a, barbeiro }: { agendamento: Agendamento; barbeiro?: { nome: string; foto: string; cor: string } }) {
  // posições do confete geradas uma vez
  const [confetes] = useState(() =>
    Array.from({ length: 36 }, (_, i) => ({
      cor: CORES_CONFETE[i % CORES_CONFETE.length],
      dx: `${(Math.random() - 0.5) * 520}px`,
      dy: `${120 + Math.random() * 380}px`,
      rot: `${Math.random() * 720}deg`,
      delay: `${Math.random() * 0.3}s`,
    })),
  );
  return (
    <div className="relative mx-auto flex max-w-md flex-col items-center overflow-hidden pt-6 text-center">
      <div className="pointer-events-none absolute top-16 left-1/2">
        {confetes.map((c, i) => (
          <span
            key={i}
            className="confete"
            style={{ background: c.cor, ["--dx" as string]: c.dx, ["--dy" as string]: c.dy, ["--rot" as string]: c.rot, animationDelay: c.delay }}
          />
        ))}
      </div>
      <svg viewBox="0 0 56 56" className="size-28">
        <circle className="check-circulo" cx="28" cy="28" r="26" fill="none" stroke="#3b82f6" strokeWidth="2.5" />
        <path className="check-marca" fill="none" stroke="#3b82f6" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" d="M16 29l8 8 16-17" />
      </svg>
      <h1 className="mt-4 animate-entrar font-display text-3xl font-semibold tracking-wide uppercase [animation-delay:600ms]">Agendamento feito!</h1>
      <p className="mt-2 animate-entrar text-texto-2 [animation-delay:700ms]">
        {a.statusPagamento === "pago" ? "Pagamento aprovado. " : ""}A barbearia vai confirmar seu horário em instantes.
      </p>
      <div className="mt-6 w-full animate-entrar rounded-2xl border border-borda bg-painel p-5 text-left [animation-delay:800ms]">
        <p className="font-display text-xl tracking-wide">{a.servicos.map((s) => s.nome).join(" + ")}</p>
        <p className="mt-1 text-sm text-texto-2">
          {formatarDataAmigavel(a.data)} · {a.inicio} – {a.fim}
        </p>
        {barbeiro && (
          <p className="mt-3 flex items-center gap-2 text-sm">
            <Avatar nome={barbeiro.nome} cor={barbeiro.cor} tamanho={28} /> com {barbeiro.nome}
          </p>
        )}
        <div className="mt-4 flex items-end justify-between border-t border-borda pt-3">
          <span className="text-sm text-texto-2">{a.statusPagamento === "pago" ? "Pago" : "A pagar na barbearia"}</span>
          <span className="font-display text-2xl font-semibold text-marca">{formatarMoeda(a.valorFinal)}</span>
        </div>
        {a.descontoFidelidade && <p className="mt-2 text-xs text-sucesso">Desconto fidelidade de {formatarMoeda(a.desconto)} aplicado.</p>}
      </div>
      <div className="mt-6 flex w-full animate-entrar flex-col gap-2 [animation-delay:900ms] sm:flex-row">
        <Link href="/cliente/agendamentos" className="flex-1">
          <Botao largura="total" tamanho="lg">
            Ver meus agendamentos
          </Botao>
        </Link>
        <Link href="/cliente" className="flex-1">
          <Botao largura="total" tamanho="lg" variante="secundario">
            Voltar ao início
          </Botao>
        </Link>
      </div>
    </div>
  );
}

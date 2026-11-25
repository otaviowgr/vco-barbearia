"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarPlus, AtSign, Clock, MapPin, Phone, Sparkles, Star } from "lucide-react";
import { useSessao } from "@/components/SessaoProvider";
import { useApi } from "@/hooks/useApi";
import { agendamentoService, barbeiroService, configService, fidelidadeService, servicoService } from "@/services";
import { ServicoCard } from "@/components/cliente/ServicoCard";
import { FidelidadeCard } from "@/components/cliente/FidelidadeCard";
import { AgendamentoCard } from "@/components/cliente/AgendamentoCard";
import { IconeWhatsApp } from "@/components/cliente/BotaoWhatsApp";
import { Avatar, Skeleton } from "@/components/ui/basicos";
import { Botao } from "@/components/ui/Botao";
import { IconeServico } from "@/components/cliente/IconeServico";
import { hoje, nomeDiaLongo } from "@/lib/datas";
import { linkWhatsApp, primeiroNome } from "@/lib/formatadores";

export default function VitrineCliente() {
  const { sessao } = useSessao();
  const router = useRouter();
  const clienteId = sessao!.clienteId!;
  const config = configService.obterSync();
  const { dados: servicos } = useApi(() => servicoService.listar(), []);
  const { dados: barbeiros } = useApi(() => barbeiroService.listar(), []);
  const { dados: fidelidade } = useApi(() => fidelidadeService.obterProgresso(clienteId), [clienteId]);
  const { dados: proximos } = useApi(
    () => agendamentoService.listar({ clienteId, inicio: hoje(), status: ["pendente", "confirmado"] }),
    [clienteId],
  );
  const proximo = proximos?.[0];
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const destaques = servicos?.filter((s) => s.destaque) ?? [];
  const outros = servicos?.filter((s) => !s.destaque) ?? [];

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="fundo-grade relative -mx-4 -mt-5 flex items-center justify-between gap-10 overflow-hidden border-b border-borda sm:mx-0 sm:mt-0 sm:rounded-3xl sm:border">
        <div className="relative max-w-xl px-5 py-12 sm:px-10 sm:py-16">
          <p className="animate-entrar text-sm text-texto-2">
            {saudacao}, <span className="font-semibold text-texto">{primeiroNome(sessao!.nome)}</span>
          </p>
          <h1 className="mt-2 animate-entrar font-display text-4xl leading-[1.05] font-semibold tracking-wide uppercase [animation-delay:80ms] sm:text-5xl">
            Bora dar um <span className="texto-marca">trato no visual?</span>
          </h1>
          <p className="mt-3 animate-entrar text-texto-2 [animation-delay:160ms]">{config.slogan} Escolha o serviço, o barbeiro e o horário em menos de um minuto.</p>
          <div className="mt-6 flex animate-entrar flex-wrap gap-3 [animation-delay:240ms]">
            <Link href="/cliente/agendar">
              <Botao tamanho="lg" icone={<CalendarPlus className="size-5" />}>
                Agendar horário
              </Botao>
            </Link>
            <a href="#servicos">
              <Botao tamanho="lg" variante="secundario">
                Ver serviços
              </Botao>
            </a>
          </div>
          <div className="mt-6 flex items-center gap-2 text-sm text-texto-2">
            <div className="flex text-marca">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className="size-4 fill-current" />
              ))}
            </div>
            4,9 · mais de 1.200 clientes atendidos
          </div>
        </div>
        {/* Detalhe minimalista: os serviços em ícones */}
        <div className="relative mr-10 hidden shrink-0 grid-cols-2 gap-3 lg:grid" aria-hidden>
          {destaques.slice(0, 4).map((s, i) => (
            <Link
              key={s.id}
              href={`/cliente/agendar?servicos=${s.id}`}
              tabIndex={-1}
              className={`group flex animate-entrar flex-col items-center gap-2 rounded-2xl border border-borda bg-fundo/60 p-4 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-marca/40 ${
                i % 2 ? "translate-y-6 hover:translate-y-5" : ""
              }`}
              style={{ animationDelay: `${200 + i * 80}ms` }}
            >
              <IconeServico nome={s.nome} tamanho="lg" />
              <span className="text-xs text-texto-2">{s.nome}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Próximo agendamento + fidelidade */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-xs font-semibold tracking-widest text-texto-3 uppercase">Seu próximo horário</h2>
          {!proximos ? (
            <Skeleton className="h-32" />
          ) : proximo ? (
            <Link href="/cliente/agendamentos" className="block">
              <AgendamentoCard agendamento={proximo} barbeiro={barbeiros?.find((b) => b.id === proximo.barbeiroId)} />
            </Link>
          ) : (
            <Link
              href="/cliente/agendar"
              className="flex h-[calc(100%-1.75rem)] min-h-32 items-center justify-between gap-4 rounded-2xl border border-dashed border-borda-forte p-5 transition hover:border-marca/50"
            >
              <div>
                <p className="font-display text-lg font-medium tracking-wide">Nenhum horário marcado</p>
                <p className="text-sm text-texto-2">Que tal agendar agora?</p>
              </div>
              <ArrowRight className="size-5 text-marca" />
            </Link>
          )}
        </div>
        <div>
          <h2 className="mb-3 text-xs font-semibold tracking-widest text-texto-3 uppercase">Fidelidade</h2>
          {fidelidade ? <FidelidadeCard progresso={fidelidade} link /> : <Skeleton className="h-40" />}
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="scroll-mt-20">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-widest text-marca uppercase">
              <Sparkles className="size-3.5" /> Serviços
            </p>
            <h2 className="mt-1 font-display text-3xl font-semibold tracking-wide uppercase">Os mais pedidos</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {!servicos
            ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-80" />)
            : destaques.map((s, i) => (
                <div key={s.id} className="animate-entrar" style={{ animationDelay: `${i * 60}ms` }}>
                  <ServicoCard servico={s} aoClicar={() => router.push(`/cliente/agendar?servicos=${s.id}`)} />
                </div>
              ))}
        </div>
        {outros.length > 0 && (
          <>
            <h3 className="mt-8 mb-3 font-display text-xl tracking-wide uppercase text-texto-2">Complementos</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {outros.map((s) => (
                <ServicoCard key={s.id} servico={s} compacto aoClicar={() => router.push(`/cliente/agendar?servicos=${s.id}`)} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Equipe */}
      <section>
        <p className="text-xs font-semibold tracking-widest text-marca uppercase">Nossa equipe</p>
        <h2 className="mt-1 mb-5 font-display text-3xl font-semibold tracking-wide uppercase">Quem cuida de você</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {!barbeiros
            ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-28" />)
            : barbeiros.map((b) => (
                <div key={b.id} className="flex animate-entrar items-center gap-4 rounded-2xl border border-borda bg-painel p-4 transition hover:border-marca/30">
                  <Avatar nome={b.nome} cor={b.cor} tamanho={72} />
                  <div className="min-w-0">
                    <p className="font-display text-xl font-medium tracking-wide">{b.nome}</p>
                    <p className="text-sm text-marca">{b.especialidade}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-texto-2">{b.bio}</p>
                  </div>
                </div>
              ))}
        </div>
      </section>

      {/* Sobre */}
      <section className="grid grid-cols-1 gap-4 rounded-3xl border border-borda bg-painel p-6 sm:p-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div>
          <p className="text-xs font-semibold tracking-widest text-marca uppercase">Sobre a barbearia</p>
          <h2 className="mt-1 font-display text-3xl font-semibold tracking-wide uppercase">{config.nome}</h2>
          <p className="mt-3 text-texto-2">{config.sobre}</p>
          <div className="mt-5 space-y-2.5 text-sm">
            <p className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-marca" />
              <span>
                {config.endereco}
                <br />
                <span className="text-texto-2">{config.cidade}</span>
              </span>
            </p>
            <p className="flex items-center gap-2.5">
              <Phone className="size-4 text-marca" /> {config.telefone}
            </p>
            <p className="flex items-center gap-2.5">
              <AtSign className="size-4 text-marca" /> {config.instagram}
            </p>
          </div>
          <a href={linkWhatsApp(config.whatsapp, `Olá, ${config.nome}!`)} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block">
            <Botao variante="secundario" icone={<IconeWhatsApp className="size-4" />}>
              Chamar no WhatsApp
            </Botao>
          </a>
        </div>
        <div className="rounded-2xl border border-borda bg-painel-2 p-5">
          <p className="mb-3 flex items-center gap-2 font-display text-lg tracking-wide uppercase">
            <Clock className="size-4 text-marca" /> Horário de funcionamento
          </p>
          <ul className="space-y-1.5 text-sm">
            {[1, 2, 3, 4, 5, 6, 0].map((dow) => {
              const h = config.horarios[dow];
              const ehHoje = new Date().getDay() === dow;
              return (
                <li key={dow} className={`flex justify-between rounded-lg px-2 py-1 ${ehHoje ? "bg-marca/10 text-marca" : "text-texto-2"}`}>
                  <span>{nomeDiaLongo(dow)}</span>
                  <span className="tabular-nums">{h ? `${h.abre} – ${h.fecha}` : "Fechado"}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}

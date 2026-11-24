"use client";

import { useDeferredValue, useState } from "react";
import { ChevronRight, Crown, Mail, Phone, Search, UserPlus, Users } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { barbeiroService, clienteService, configService } from "@/services";
import { Avatar, Badge, BarraProgresso, Campo, EstadoVazio, Input, Skeleton, TituloPagina } from "@/components/ui/basicos";
import { Botao } from "@/components/ui/Botao";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { IconeWhatsApp } from "@/components/cliente/BotaoWhatsApp";
import { mensagemWhatsApp } from "@/components/barbeiro/DetalheAgendamentoModal";
import { formatarData } from "@/lib/datas";
import { formatarMoeda, formatarTelefone, linkWhatsApp, primeiroNome } from "@/lib/formatadores";
import { STATUS_AGENDAMENTO } from "@/lib/status";

export default function PaginaClientes() {
  const [busca, setBusca] = useState("");
  const termo = useDeferredValue(busca);
  const [abertoId, setAbertoId] = useState<string | null>(null);
  const [novo, setNovo] = useState(false);
  const { dados: clientes, carregando } = useApi(() => clienteService.listar(termo), [termo]);

  return (
    <div>
      <TituloPagina
        titulo="Clientes"
        subtitulo={clientes ? `${clientes.length} cliente${clientes.length === 1 ? "" : "s"}${termo ? " encontrados" : " cadastrados"}` : " "}
        acoes={
          <Botao icone={<UserPlus className="size-4" />} onClick={() => setNovo(true)}>
            Novo cliente
          </Botao>
        }
      />
      <div className="relative mb-5">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-texto-3" />
        <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, e-mail ou telefone..." className="pl-10" autoFocus />
      </div>

      {carregando && !clientes ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : !clientes?.length ? (
        <EstadoVazio icone={<Users className="size-6" />} titulo="Nenhum cliente encontrado" descricao="Tente buscar por outro nome ou telefone." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {clientes.map((c) => (
            <button
              key={c.id}
              onClick={() => setAbertoId(c.id)}
              className="group flex animate-entrar items-center gap-3 rounded-2xl border border-borda bg-painel p-4 text-left transition hover:-translate-y-0.5 hover:border-ouro/40"
            >
              <Avatar nome={c.nome} tamanho={48} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate font-semibold">
                  {c.nome}
                  {c.fidelidade.descontoDisponivel && <Crown className="size-3.5 shrink-0 text-ouro" />}
                </p>
                <p className="text-sm text-texto-2">{c.telefone}</p>
                <p className="mt-1 text-xs text-texto-3">
                  {c.atendimentos} atendimento{c.atendimentos === 1 ? "" : "s"} · <span className="text-ouro">{formatarMoeda(c.totalGasto)}</span>
                  {c.proximoAgendamento && ` · próx. ${formatarData(c.proximoAgendamento.data).slice(0, 5)}`}
                </p>
              </div>
              <ChevronRight className="size-5 text-texto-3 transition group-hover:translate-x-0.5 group-hover:text-ouro" />
            </button>
          ))}
        </div>
      )}

      <FichaModal id={abertoId} aoFechar={() => setAbertoId(null)} />
      <NovoClienteModal aberto={novo} aoFechar={() => setNovo(false)} />
    </div>
  );
}

function FichaModal({ id, aoFechar }: { id: string | null; aoFechar: () => void }) {
  const { dados: f } = useApi(() => (id ? clienteService.obterFicha(id) : Promise.resolve(undefined)), [id]);
  const { dados: barbeiros } = useApi(() => barbeiroService.listar({ incluirInativos: true }), []);
  const ficha = f && f.id === id ? f : undefined;
  const cfg = configService.obterSync();
  const prox = ficha?.proximoAgendamento;
  const msg = ficha
    ? prox
      ? mensagemWhatsApp(prox, ficha, barbeiros?.find((b) => b.id === prox.barbeiroId))
      : `Olá, ${primeiroNome(ficha.nome)}! Aqui é da ${cfg.nome} ✂️ Faz um tempinho que você não aparece... bora agendar um horário? ${
          ficha.fidelidade.descontoDisponivel ? `Você tem ${ficha.fidelidade.percentual}% de desconto esperando!` : ""
        }`
    : "";

  return (
    <Modal aberto={!!id} aoFechar={aoFechar} titulo="Ficha do cliente" largura="lg">
      {!ficha ? (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-24" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar nome={ficha.nome} tamanho={64} />
            <div className="min-w-0 flex-1">
              <p className="font-display text-2xl tracking-wide">{ficha.nome}</p>
              <p className="flex items-center gap-1.5 text-sm text-texto-2">
                <Phone className="size-3.5" /> {ficha.telefone}
              </p>
              {ficha.email && (
                <p className="flex items-center gap-1.5 text-sm text-texto-2">
                  <Mail className="size-3.5" /> {ficha.email}
                </p>
              )}
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <a href={linkWhatsApp(ficha.telefone, msg)} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Botao largura="total" className="!bg-none !bg-[#25d366] !text-white" icone={<IconeWhatsApp className="size-4" />}>
                  Chamar no WhatsApp
                </Botao>
              </a>
              <a href={`tel:${ficha.telefone.replace(/\D/g, "")}`} className="flex-1">
                <Botao largura="total" variante="secundario" icone={<Phone className="size-4" />}>
                  Ligar
                </Botao>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { r: "Total gasto", v: formatarMoeda(ficha.totalGasto), ouro: true },
              { r: "Atendimentos", v: String(ficha.atendimentos) },
              { r: "Faltas", v: String(ficha.faltas) },
              { r: "Última visita", v: ficha.ultimaVisita ? formatarData(ficha.ultimaVisita) : "—" },
            ].map((k) => (
              <div key={k.r} className="rounded-xl border border-borda bg-painel-2 p-3">
                <p className="text-[11px] tracking-wide text-texto-3 uppercase">{k.r}</p>
                <p className={`font-display text-lg font-semibold ${k.ouro ? "text-ouro" : ""}`}>{k.v}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-ouro/30 bg-ouro/5 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 font-medium">
                <Crown className="size-4 text-ouro" /> Fidelidade
              </span>
              <span className="text-texto-2">
                {ficha.fidelidade.descontoDisponivel
                  ? `🎉 ${ficha.fidelidade.percentual}% de desconto disponível`
                  : `${ficha.fidelidade.progressoCiclo}/${ficha.fidelidade.meta} · faltam ${ficha.fidelidade.faltam}`}
              </span>
            </div>
            <BarraProgresso
              className="mt-2"
              valor={ficha.fidelidade.descontoDisponivel ? ficha.fidelidade.meta : ficha.fidelidade.progressoCiclo}
              max={ficha.fidelidade.meta}
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold tracking-widest text-texto-3 uppercase">Histórico ({ficha.historico.length})</p>
            <div className="max-h-72 divide-y divide-borda overflow-y-auto rounded-xl border border-borda">
              {ficha.historico.length === 0 && <p className="p-4 text-sm text-texto-3">Sem agendamentos ainda.</p>}
              {ficha.historico.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-3.5 py-2.5 text-sm">
                  <span className="w-20 shrink-0 text-texto-2 tabular-nums">{formatarData(a.data)}</span>
                  <span className="min-w-0 flex-1 truncate">{a.servicos.map((s) => s.nome).join(" + ")}</span>
                  <Badge cor={STATUS_AGENDAMENTO[a.status].cor} className="hidden sm:inline-flex">
                    {STATUS_AGENDAMENTO[a.status].rotulo}
                  </Badge>
                  <span className="w-20 shrink-0 text-right font-medium">{formatarMoeda(a.valorFinal)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function NovoClienteModal({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({ nome: "", telefone: "", email: "" });
  const [salvando, setSalvando] = useState(false);
  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo="Novo cliente" largura="sm">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setSalvando(true);
          try {
            await clienteService.criar(form);
            toast.sucesso("Cliente cadastrado!");
            setForm({ nome: "", telefone: "", email: "" });
            aoFechar();
          } catch (err) {
            toast.erro("Erro", (err as Error).message);
          } finally {
            setSalvando(false);
          }
        }}
      >
        <Campo rotulo="Nome">
          <Input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </Campo>
        <Campo rotulo="WhatsApp">
          <Input required value={form.telefone} onChange={(e) => setForm({ ...form, telefone: formatarTelefone(e.target.value) })} inputMode="tel" placeholder="(48) 90000-0000" />
        </Campo>
        <Campo rotulo="E-mail (opcional)">
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Campo>
        <Botao type="submit" largura="total" carregando={salvando}>
          Cadastrar
        </Botao>
      </form>
    </Modal>
  );
}

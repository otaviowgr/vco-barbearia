"use client";

import { useState } from "react";
import { Clock, Crown, Save, Store } from "lucide-react";
import type { ConfigBarbearia } from "@/types";
import { useApi } from "@/hooks/useApi";
import { configService } from "@/services";
import { RestaurarDemo } from "@/components/RestaurarDemo";
import { Campo, Input, Interruptor, Skeleton, Textarea, TituloPagina } from "@/components/ui/basicos";
import { Botao } from "@/components/ui/Botao";
import { useToast } from "@/components/ui/Toast";
import { nomeDiaLongo } from "@/lib/datas";
import { formatarTelefone, somenteDigitos } from "@/lib/formatadores";

export default function Configuracoes() {
  const { dados } = useApi(() => configService.obter(), []);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <TituloPagina titulo="Configurações" subtitulo="Dados da barbearia, horários e plano fidelidade" />
      {dados ? <Form key={JSON.stringify(dados)} inicial={dados} /> : <Skeleton className="h-96" />}
      <RestaurarDemo />
    </div>
  );
}

function Secao({ icone, titulo, children }: { icone: React.ReactNode; titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-borda bg-painel p-5">
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg tracking-wide uppercase [&>svg]:size-5 [&>svg]:text-marca">
        {icone}
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Form({ inicial }: { inicial: ConfigBarbearia }) {
  const toast = useToast();
  const [c, setC] = useState(inicial);
  const [salvando, setSalvando] = useState(false);
  const set = <K extends keyof ConfigBarbearia>(k: K, v: ConfigBarbearia[K]) => setC((x) => ({ ...x, [k]: v }));

  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setSalvando(true);
        try {
          await configService.salvar(c);
          toast.sucesso("Configurações salvas", "Já valem para a agenda e para o cliente.");
        } finally {
          setSalvando(false);
        }
      }}
    >
      <Secao icone={<Store />} titulo="Barbearia">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo rotulo="Nome">
            <Input value={c.nome} onChange={(e) => set("nome", e.target.value)} />
          </Campo>
          <Campo rotulo="Slogan">
            <Input value={c.slogan} onChange={(e) => set("slogan", e.target.value)} />
          </Campo>
          <div className="sm:col-span-2">
            <Campo rotulo="Sobre">
              <Textarea rows={3} value={c.sobre} onChange={(e) => set("sobre", e.target.value)} />
            </Campo>
          </div>
          <Campo rotulo="Endereço">
            <Input value={c.endereco} onChange={(e) => set("endereco", e.target.value)} />
          </Campo>
          <Campo rotulo="Cidade">
            <Input value={c.cidade} onChange={(e) => set("cidade", e.target.value)} />
          </Campo>
          <Campo rotulo="Telefone">
            <Input value={c.telefone} onChange={(e) => set("telefone", formatarTelefone(e.target.value))} />
          </Campo>
          <Campo rotulo="WhatsApp (com DDD)" dica="Usado no botão flutuante do cliente">
            <Input
              value={formatarTelefone(c.whatsapp)}
              onChange={(e) => set("whatsapp", "55" + somenteDigitos(e.target.value).replace(/^55(?=\d{10,11}$)/, ""))}
            />
          </Campo>
        </div>
      </Secao>

      <Secao icone={<Clock />} titulo="Horário de funcionamento">
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 0].map((dow) => {
            const h = c.horarios[dow];
            const atualizar = (v: ConfigBarbearia["horarios"][number]) => set("horarios", c.horarios.map((x, i) => (i === dow ? v : x)));
            return (
              <div key={dow} className="flex flex-wrap items-center gap-3 rounded-xl border border-borda bg-painel-2 px-3 py-2">
                <Interruptor ligado={!!h} aoMudar={(v) => atualizar(v ? { abre: "09:00", fecha: "19:00" } : null)} rotulo={`Abrir ${nomeDiaLongo(dow)}`} />
                <span className="w-32 text-sm">{nomeDiaLongo(dow)}</span>
                {h ? (
                  <div className="ml-auto flex items-center gap-2 text-sm">
                    <input type="time" step={1800} value={h.abre} onChange={(e) => atualizar({ ...h, abre: e.target.value })} className="h-9 rounded-lg border border-borda bg-painel px-2 [color-scheme:dark]" />
                    <span className="text-texto-3">às</span>
                    <input type="time" step={1800} value={h.fecha} onChange={(e) => atualizar({ ...h, fecha: e.target.value })} className="h-9 rounded-lg border border-borda bg-painel px-2 [color-scheme:dark]" />
                  </div>
                ) : (
                  <span className="ml-auto text-sm text-texto-3">Fechado</span>
                )}
              </div>
            );
          })}
        </div>
      </Secao>

      <Secao icone={<Crown />} titulo="Plano fidelidade">
        <div className="grid grid-cols-2 gap-4">
          <Campo rotulo="A cada (atendimentos)">
            <Input type="number" min={1} max={50} value={c.fidelidade.meta} onChange={(e) => set("fidelidade", { ...c.fidelidade, meta: Math.max(1, Number(e.target.value)) })} />
          </Campo>
          <Campo rotulo="Desconto (%)">
            <Input type="number" min={1} max={100} value={c.fidelidade.percentual} onChange={(e) => set("fidelidade", { ...c.fidelidade, percentual: Math.min(100, Math.max(1, Number(e.target.value))) })} />
          </Campo>
        </div>
        <p className="mt-3 text-sm text-texto-2">
          A cada <b className="text-marca">{c.fidelidade.meta}</b> atendimentos concluídos, o cliente ganha <b className="text-marca">{c.fidelidade.percentual}%</b> de desconto no próximo.
        </p>
      </Secao>

      <Botao type="submit" tamanho="lg" carregando={salvando} icone={<Save className="size-5" />}>
        Salvar configurações
      </Botao>
    </form>
  );
}

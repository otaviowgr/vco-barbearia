"use client";

import { useState } from "react";
import { LogOut, Save } from "lucide-react";
import { useSessao } from "@/components/SessaoProvider";
import { useApi } from "@/hooks/useApi";
import { clienteService } from "@/services";
import { RestaurarDemo } from "@/components/RestaurarDemo";
import { Avatar, Campo, Input, Skeleton, TituloPagina } from "@/components/ui/basicos";
import { Botao } from "@/components/ui/Botao";
import { useToast } from "@/components/ui/Toast";
import { formatarTelefone } from "@/lib/formatadores";
import type { FichaCliente } from "@/services";

export default function PerfilCliente() {
  const { sessao, sair } = useSessao();
  const clienteId = sessao!.clienteId!;
  const { dados: ficha } = useApi(() => clienteService.obterFicha(clienteId), [clienteId]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <TituloPagina titulo="Configurações" subtitulo="Seus dados e opções da demonstração" />
      {ficha ? <FormDados key={ficha.id + ficha.telefone} ficha={ficha} /> : <Skeleton className="h-64" />}
      <RestaurarDemo />
      <Botao variante="secundario" icone={<LogOut className="size-4" />} onClick={sair}>
        Sair da conta
      </Botao>
    </div>
  );
}

function FormDados({ ficha }: { ficha: FichaCliente }) {
  const toast = useToast();
  const [nome, setNome] = useState(ficha.nome);
  const [telefone, setTelefone] = useState(ficha.telefone);
  const [salvando, setSalvando] = useState(false);
  return (
    <form
      className="rounded-2xl border border-borda bg-painel p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setSalvando(true);
        try {
          await clienteService.atualizar(ficha.id, { nome, telefone });
          toast.sucesso("Dados atualizados");
        } finally {
          setSalvando(false);
        }
      }}
    >
      <div className="mb-5 flex items-center gap-4">
        <Avatar nome={nome} tamanho={56} />
        <div>
          <p className="font-display text-xl tracking-wide">{nome}</p>
          <p className="text-sm text-texto-2">{ficha.email}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo rotulo="Nome">
          <Input value={nome} onChange={(e) => setNome(e.target.value)} />
        </Campo>
        <Campo rotulo="WhatsApp">
          <Input value={telefone} onChange={(e) => setTelefone(formatarTelefone(e.target.value))} inputMode="tel" />
        </Campo>
      </div>
      <Botao type="submit" className="mt-4" carregando={salvando} icone={<Save className="size-4" />}>
        Salvar
      </Botao>
    </form>
  );
}

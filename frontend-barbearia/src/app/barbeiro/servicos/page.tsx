"use client";

import { useState } from "react";
import { Clock, Pencil, Plus, Scissors } from "lucide-react";
import type { Servico } from "@/types";
import { useApi } from "@/hooks/useApi";
import { servicoService, type ServicoForm } from "@/services";
import { Badge, Campo, EstadoVazio, Imagem, Input, Interruptor, Skeleton, Textarea, TituloPagina } from "@/components/ui/basicos";
import { Botao } from "@/components/ui/Botao";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatarDuracao } from "@/lib/datas";
import { formatarMoeda } from "@/lib/formatadores";

const VAZIO: ServicoForm = { nome: "", descricao: "", duracaoMin: 30, preco: 40, foto: "", ativo: true, destaque: false };

export default function PaginaServicos() {
  const toast = useToast();
  const { dados: servicos } = useApi(() => servicoService.listar({ incluirInativos: true }), []);
  const [editando, setEditando] = useState<ServicoForm | null>(null);

  const alternar = async (s: Servico) => {
    try {
      const r = await servicoService.alternarAtivo(s.id);
      toast.sucesso(r.ativo ? "Serviço ativado" : "Serviço desativado", r.ativo ? "Já aparece para os clientes." : "Não aparece mais na vitrine.");
    } catch (e) {
      toast.erro("Erro", (e as Error).message);
    }
  };

  return (
    <div>
      <TituloPagina
        titulo="Serviços"
        subtitulo="O que aparece na vitrine e no agendamento do cliente"
        acoes={
          <Botao icone={<Plus className="size-4" />} onClick={() => setEditando({ ...VAZIO })}>
            Novo serviço
          </Botao>
        }
      />
      {!servicos ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : servicos.length === 0 ? (
        <EstadoVazio icone={<Scissors className="size-6" />} titulo="Nenhum serviço" acao={<Botao onClick={() => setEditando({ ...VAZIO })}>Cadastrar o primeiro</Botao>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {servicos.map((s) => (
            <div key={s.id} className={`animate-entrar overflow-hidden rounded-2xl border border-borda bg-painel transition ${s.ativo ? "" : "opacity-55 grayscale"}`}>
              <div className="relative h-36">
                <Imagem src={s.foto} alt={s.nome} className="size-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-painel to-transparent" />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  {s.destaque && <Badge cor="ouro">Destaque</Badge>}
                  {!s.ativo && <Badge cor="vermelho">Inativo</Badge>}
                </div>
              </div>
              <div className="p-4 pt-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display text-lg tracking-wide">{s.nome}</p>
                  <p className="font-display text-xl font-semibold text-ouro">{formatarMoeda(s.preco)}</p>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-texto-2">{s.descricao}</p>
                <div className="mt-3 flex items-center gap-3 border-t border-borda pt-3">
                  <span className="flex items-center gap-1 text-xs text-texto-3">
                    <Clock className="size-3.5" /> {formatarDuracao(s.duracaoMin)}
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <Interruptor ligado={s.ativo} aoMudar={() => alternar(s)} rotulo={`Ativar ${s.nome}`} />
                    <Botao tamanho="sm" variante="secundario" icone={<Pencil className="size-3.5" />} onClick={() => setEditando({ ...s })}>
                      Editar
                    </Botao>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal aberto={!!editando} aoFechar={() => setEditando(null)} titulo={editando?.id ? "Editar serviço" : "Novo serviço"}>
        {editando && <FormServico inicial={editando} aoFechar={() => setEditando(null)} />}
      </Modal>
    </div>
  );
}

function FormServico({ inicial, aoFechar }: { inicial: ServicoForm; aoFechar: () => void }) {
  const toast = useToast();
  const [f, setF] = useState(inicial);
  const [salvando, setSalvando] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setSalvando(true);
        try {
          await servicoService.salvar(f);
          toast.sucesso(f.id ? "Serviço atualizado" : "Serviço criado");
          aoFechar();
        } catch (err) {
          toast.erro("Erro ao salvar", (err as Error).message);
        } finally {
          setSalvando(false);
        }
      }}
    >
      <Campo rotulo="Nome">
        <Input required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
      </Campo>
      <Campo rotulo="Descrição (o que é feito)">
        <Textarea rows={3} value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} />
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Preço (R$)">
          <Input type="number" min={1} step="0.01" required value={f.preco} onChange={(e) => setF({ ...f, preco: Number(e.target.value) })} />
        </Campo>
        <Campo rotulo="Duração (min)">
          <Input type="number" min={5} step={5} required value={f.duracaoMin} onChange={(e) => setF({ ...f, duracaoMin: Number(e.target.value) })} />
        </Campo>
      </div>
      <Campo rotulo="URL da foto" dica="Deixe em branco para usar uma imagem padrão.">
        <Input value={f.foto} onChange={(e) => setF({ ...f, foto: e.target.value })} placeholder="https://..." />
      </Campo>
      <div className="flex items-center justify-between rounded-xl border border-borda bg-painel-2 p-3">
        <span className="text-sm">Mostrar como destaque na vitrine</span>
        <Interruptor ligado={f.destaque} aoMudar={(v) => setF({ ...f, destaque: v })} rotulo="Destaque" />
      </div>
      <div className="flex items-center justify-between rounded-xl border border-borda bg-painel-2 p-3">
        <span className="text-sm">Ativo (disponível para agendamento)</span>
        <Interruptor ligado={f.ativo} aoMudar={(v) => setF({ ...f, ativo: v })} rotulo="Ativo" />
      </div>
      <Botao type="submit" largura="total" tamanho="lg" carregando={salvando}>
        Salvar
      </Botao>
    </form>
  );
}

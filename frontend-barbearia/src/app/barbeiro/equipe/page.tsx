"use client";

import { useState } from "react";
import { Pencil, Phone, Plus, ShieldCheck } from "lucide-react";
import type { Barbeiro } from "@/types";
import { useApi } from "@/hooks/useApi";
import { barbeiroService, type BarbeiroForm } from "@/services";
import { Avatar, Badge, Campo, Input, Interruptor, Skeleton, Textarea, TituloPagina } from "@/components/ui/basicos";
import { Botao } from "@/components/ui/Botao";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatarTelefone } from "@/lib/formatadores";

// cores de identificação na agenda, dentro do tema (azuis, cinzas e branco)
const CORES = ["#3b82f6", "#94a3b8", "#e4e4e7", "#60a5fa", "#1d4ed8", "#71717a"];
const VAZIO: BarbeiroForm = { nome: "", especialidade: "", bio: "", foto: "", telefone: "", cor: CORES[3], ativo: true };

export default function PaginaEquipe() {
  const toast = useToast();
  const { dados: barbeiros } = useApi(() => barbeiroService.listar({ incluirInativos: true }), []);
  const [editando, setEditando] = useState<BarbeiroForm | null>(null);

  const alternar = async (b: Barbeiro) => {
    try {
      const r = await barbeiroService.alternarAtivo(b.id);
      toast.sucesso(r.ativo ? `${r.nome} ativado` : `${r.nome} desativado`, r.ativo ? "Volta a aparecer na agenda." : "Não recebe novos agendamentos.");
    } catch (e) {
      toast.erro("Não permitido", (e as Error).message);
    }
  };

  return (
    <div>
      <TituloPagina
        titulo="Equipe"
        subtitulo="Barbeiros que aparecem para o cliente e na agenda"
        acoes={
          <Botao icone={<Plus className="size-4" />} onClick={() => setEditando({ ...VAZIO })}>
            Novo barbeiro
          </Botao>
        }
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {!barbeiros
          ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-48" />)
          : barbeiros.map((b) => (
              <div key={b.id} className={`animate-entrar rounded-2xl border border-borda bg-painel p-5 transition ${b.ativo ? "" : "opacity-55"}`}>
                <div className="flex items-start gap-4">
                  <Avatar nome={b.nome} cor={b.cor} tamanho={64} />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-xl tracking-wide">{b.nome}</p>
                    <p className="text-sm text-marca">{b.especialidade}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {b.temLogin && <Badge cor="marca" icone={<ShieldCheck className="size-3" />}>Admin</Badge>}
                      {!b.ativo && <Badge cor="vermelho">Inativo</Badge>}
                      <span className="inline-flex items-center gap-1 text-xs text-texto-3">
                        <span className="size-2.5 rounded-full" style={{ background: b.cor }} /> cor na agenda
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-texto-2">{b.bio}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-borda pt-3">
                  <span className="flex items-center gap-1 text-xs whitespace-nowrap text-texto-3">
                    <Phone className="size-3.5" /> {b.telefone}
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <Interruptor ligado={b.ativo} aoMudar={() => alternar(b)} rotulo={`Ativar ${b.nome}`} />
                    <Botao tamanho="sm" variante="secundario" icone={<Pencil className="size-3.5" />} onClick={() => setEditando({ ...b })}>
                      Editar
                    </Botao>
                  </div>
                </div>
              </div>
            ))}
      </div>
      <Modal aberto={!!editando} aoFechar={() => setEditando(null)} titulo={editando?.id ? "Editar barbeiro" : "Novo barbeiro"}>
        {editando && <FormBarbeiro inicial={editando} aoFechar={() => setEditando(null)} />}
      </Modal>
    </div>
  );
}

function FormBarbeiro({ inicial, aoFechar }: { inicial: BarbeiroForm; aoFechar: () => void }) {
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
          await barbeiroService.salvar(f);
          toast.sucesso(f.id ? "Barbeiro atualizado" : "Barbeiro cadastrado");
          aoFechar();
        } catch (err) {
          toast.erro("Erro ao salvar", (err as Error).message);
        } finally {
          setSalvando(false);
        }
      }}
    >
      <div className="flex items-center gap-4">
        <Avatar nome={f.nome || "?"} cor={f.cor} tamanho={56} />
        <div className="flex-1">
          <Campo rotulo="Nome">
            <Input required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
          </Campo>
        </div>
      </div>
      <Campo rotulo="Especialidade">
        <Input value={f.especialidade} onChange={(e) => setF({ ...f, especialidade: e.target.value })} placeholder="Ex.: degradê, barba..." />
      </Campo>
      <Campo rotulo="Apresentação">
        <Textarea rows={2} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} />
      </Campo>
      <Campo rotulo="Telefone">
        <Input value={f.telefone} onChange={(e) => setF({ ...f, telefone: formatarTelefone(e.target.value) })} inputMode="tel" />
      </Campo>
      <div>
        <span className="mb-1.5 block text-xs font-medium tracking-wide text-texto-2 uppercase">Cor na agenda</span>
        <div className="flex flex-wrap gap-2.5 p-1.5">
          {CORES.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setF({ ...f, cor: c })}
              className={`size-8 rounded-full transition ${f.cor === c ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-painel" : ""}`}
              style={{ background: c }}
              aria-label={`Cor ${c}`}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between rounded-xl border border-borda bg-painel-2 p-3">
        <span className="text-sm">Ativo (recebe agendamentos)</span>
        <Interruptor ligado={f.ativo} aoMudar={(v) => setF({ ...f, ativo: v })} rotulo="Ativo" />
      </div>
      <Botao type="submit" largura="total" tamanho="lg" carregando={salvando}>
        Salvar
      </Botao>
    </form>
  );
}

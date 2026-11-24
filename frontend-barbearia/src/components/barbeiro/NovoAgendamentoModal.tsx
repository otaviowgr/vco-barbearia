"use client";

import { useState } from "react";
import { CalendarPlus, UserPlus } from "lucide-react";
import type { Barbeiro, Cliente, Servico } from "@/types";
import { agendamentoService, clienteService, configService } from "@/services";
import { useApi } from "@/hooks/useApi";
import { diaDaSemana, formatarDuracao, hoje } from "@/lib/datas";
import { formatarMoeda, formatarTelefone } from "@/lib/formatadores";
import { Modal } from "../ui/Modal";
import { Botao } from "../ui/Botao";
import { Campo, Input, Select } from "../ui/basicos";
import { useToast } from "../ui/Toast";
import { GradeHorarios } from "../agenda/GradeHorarios";

export interface PrefillAgendamento {
  barbeiroId?: string;
  data?: string;
  hora?: string;
}

export function NovoAgendamentoModal({
  prefill,
  aoFechar,
  barbeiros,
  servicos,
  clientes,
}: {
  prefill: PrefillAgendamento | null;
  aoFechar: () => void;
  barbeiros: Barbeiro[];
  servicos: Servico[];
  clientes: Cliente[];
}) {
  return (
    <Modal aberto={!!prefill} aoFechar={aoFechar} titulo="Novo agendamento" subtitulo="Agendamento manual (balcão, telefone ou WhatsApp)" largura="lg">
      {prefill && <Form prefill={prefill} aoFechar={aoFechar} barbeiros={barbeiros} servicos={servicos} clientes={clientes} />}
    </Modal>
  );
}

function Form({
  prefill,
  aoFechar,
  barbeiros,
  servicos,
  clientes,
}: {
  prefill: PrefillAgendamento;
  aoFechar: () => void;
  barbeiros: Barbeiro[];
  servicos: Servico[];
  clientes: Cliente[];
}) {
  const toast = useToast();
  const config = configService.obterSync();
  const [clienteId, setClienteId] = useState("");
  const [novoCliente, setNovoCliente] = useState(false);
  const [nomeNovo, setNomeNovo] = useState("");
  const [telNovo, setTelNovo] = useState("");
  const [servicoIds, setServicoIds] = useState<string[]>(["srv-corte"]);
  const [barbeiroId, setBarbeiroId] = useState(prefill.barbeiroId ?? barbeiros[0]?.id);
  const [data, setData] = useState(prefill.data ?? hoje());
  const [hora, setHora] = useState<string | undefined>(prefill.hora);
  const [salvando, setSalvando] = useState(false);

  const ativos = servicos.filter((s) => s.ativo);
  const sel = ativos.filter((s) => servicoIds.includes(s.id));
  const duracao = sel.reduce((t, s) => t + s.duracaoMin, 0);
  const total = sel.reduce((t, s) => t + s.preco, 0);
  const fechado = !config.horarios[diaDaSemana(data)];

  const { dados: slots, carregando } = useApi(
    () => (duracao && !fechado ? agendamentoService.horariosDisponiveis({ data, duracaoMin: duracao, barbeiroId }) : Promise.resolve([])),
    [data, duracao, barbeiroId],
  );
  const horaValida = !!hora && !!slots?.some((s) => s.hora === hora);

  const salvar = async () => {
    if (!horaValida || !hora) return;
    setSalvando(true);
    try {
      let id = clienteId;
      if (novoCliente) {
        const c = await clienteService.criar({ nome: nomeNovo, telefone: telNovo });
        id = c.id;
      }
      if (!id) throw new Error("Escolha o cliente.");
      await agendamentoService.criar({
        clienteId: id,
        barbeiroId,
        servicoIds,
        data,
        inicio: hora,
        formaPagamento: "na_barbearia",
        criadoPor: "barbeiro",
      });
      toast.sucesso("Agendamento criado!", `${hora} · ${sel.map((s) => s.nome).join(" + ")}`);
      aoFechar();
    } catch (e) {
      toast.erro("Não foi possível agendar", (e as Error).message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="space-y-4">
        {novoCliente ? (
          <div className="space-y-3 rounded-xl border border-ouro/30 bg-ouro/5 p-3">
            <Campo rotulo="Nome do novo cliente">
              <Input value={nomeNovo} onChange={(e) => setNomeNovo(e.target.value)} placeholder="Nome completo" />
            </Campo>
            <Campo rotulo="WhatsApp">
              <Input value={telNovo} onChange={(e) => setTelNovo(formatarTelefone(e.target.value))} placeholder="(48) 90000-0000" inputMode="tel" />
            </Campo>
            <button className="text-xs text-texto-2 underline" onClick={() => setNovoCliente(false)}>
              Escolher cliente existente
            </button>
          </div>
        ) : (
          <Campo rotulo="Cliente">
            <div className="flex gap-2">
              <Select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                <option value="">Selecione...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </Select>
              <Botao variante="secundario" className="h-11 shrink-0" onClick={() => setNovoCliente(true)} title="Cadastrar cliente">
                <UserPlus className="size-4" />
              </Botao>
            </div>
          </Campo>
        )}
        <div>
          <span className="mb-1.5 block text-xs font-medium tracking-wide text-texto-2 uppercase">Serviços</span>
          <div className="flex flex-wrap gap-1.5">
            {ativos.map((s) => {
              const on = servicoIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => setServicoIds((l) => (on ? l.filter((x) => x !== s.id) : [...l, s.id]))}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${on ? "border-ouro bg-ouro/15 text-ouro" : "border-borda text-texto-2 hover:border-ouro/40"}`}
                >
                  {s.nome}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-texto-3">
            {formatarDuracao(duracao || 0)} · <span className="text-ouro">{formatarMoeda(total)}</span> · pagamento na barbearia
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Barbeiro">
            <Select value={barbeiroId} onChange={(e) => setBarbeiroId(e.target.value)}>
              {barbeiros.filter((b) => b.ativo).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                </option>
              ))}
            </Select>
          </Campo>
          <Campo rotulo="Data">
            <Input type="date" value={data} min={hoje()} onChange={(e) => e.target.value && setData(e.target.value)} />
          </Campo>
        </div>
      </div>
      <div className="flex flex-col">
        <p className="mb-3 text-sm text-texto-2">Horários livres</p>
        {fechado ? (
          <p className="rounded-xl border border-dashed border-borda p-6 text-center text-sm text-texto-3">A barbearia não abre nesse dia.</p>
        ) : (
          <GradeHorarios slots={slots} carregando={carregando} valor={hora} aoEscolher={(s) => setHora(s.hora)} textoVazio="Sem horário livre para esse barbeiro nesse dia." />
        )}
        <Botao
          className="mt-5"
          tamanho="lg"
          icone={<CalendarPlus className="size-5" />}
          disabled={!horaValida || !servicoIds.length || (novoCliente ? !nomeNovo.trim() : !clienteId)}
          carregando={salvando}
          onClick={salvar}
        >
          Agendar {horaValida ? hora : ""}
        </Botao>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { Agendamento, Barbeiro, Perfil } from "@/types";
import { diaDaSemana, formatarDataAmigavel, formatarDuracao } from "@/lib/datas";
import { agendamentoService, configService } from "@/services";
import { useApi } from "@/hooks/useApi";
import { Modal } from "../ui/Modal";
import { Botao } from "../ui/Botao";
import { Campo, Select } from "../ui/basicos";
import { useToast } from "../ui/Toast";
import { Calendario } from "./Calendario";
import { GradeHorarios } from "./GradeHorarios";

export function RemarcarModal({
  agendamento,
  aoFechar,
  por,
  barbeiros,
}: {
  agendamento: Agendamento | null;
  aoFechar: () => void;
  por: Perfil;
  /** se informado, permite trocar de barbeiro (visão do barbeiro) */
  barbeiros?: Barbeiro[];
}) {
  return (
    <Modal
      aberto={!!agendamento}
      aoFechar={aoFechar}
      titulo="Remarcar horário"
      subtitulo={agendamento ? `${agendamento.servicos.map((s) => s.nome).join(" + ")} · ${formatarDuracao(agendamento.duracaoMin)}` : ""}
      largura="lg"
    >
      {agendamento && <Conteudo key={agendamento.id} agendamento={agendamento} aoFechar={aoFechar} por={por} barbeiros={barbeiros} />}
    </Modal>
  );
}

function Conteudo({
  agendamento,
  aoFechar,
  por,
  barbeiros,
}: {
  agendamento: Agendamento;
  aoFechar: () => void;
  por: Perfil;
  barbeiros?: Barbeiro[];
}) {
  const toast = useToast();
  const config = configService.obterSync();
  const [data, setData] = useState(agendamento.data);
  const [barbeiroId, setBarbeiroId] = useState(agendamento.barbeiroId);
  const [hora, setHora] = useState<string>();
  const [salvando, setSalvando] = useState(false);

  const { dados: slots, carregando } = useApi(
    () =>
      agendamentoService.horariosDisponiveis({
        data,
        duracaoMin: agendamento.duracaoMin,
        barbeiroId,
        ignorarAgendamentoId: agendamento.id,
      }),
    [data, barbeiroId],
  );

  const salvar = async () => {
    if (!hora) return;
    setSalvando(true);
    try {
      await agendamentoService.remarcar(agendamento.id, { data, inicio: hora, barbeiroId }, por);
      toast.sucesso("Horário remarcado!", `${formatarDataAmigavel(data)} às ${hora}`);
      aoFechar();
    } catch (e) {
      toast.erro("Não foi possível remarcar", (e as Error).message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div className="space-y-4">
        {barbeiros && (
          <Campo rotulo="Barbeiro">
            <Select
              value={barbeiroId}
              onChange={(e) => {
                setBarbeiroId(e.target.value);
                setHora(undefined);
              }}
            >
              {barbeiros.filter((b) => b.ativo).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                </option>
              ))}
            </Select>
          </Campo>
        )}
        <Calendario
          valor={data}
          aoEscolher={(d) => {
            setData(d);
            setHora(undefined);
          }}
          desabilitado={(d) => !config.horarios[diaDaSemana(d)]}
        />
      </div>
      <div className="flex flex-col">
        <p className="mb-3 text-sm text-texto-2">
          Horários livres em <span className="font-semibold text-texto">{formatarDataAmigavel(data)}</span>
        </p>
        <GradeHorarios slots={slots} carregando={carregando} valor={hora} aoEscolher={(s) => setHora(s.hora)} />
        <div className="mt-auto flex gap-2 pt-5">
          <Botao variante="secundario" largura="total" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao largura="total" disabled={!hora} carregando={salvando} onClick={salvar}>
            Confirmar {hora ?? ""}
          </Botao>
        </div>
      </div>
    </div>
  );
}

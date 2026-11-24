"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import type { Barbeiro } from "@/types";
import { bloqueioService, configService } from "@/services";
import { diaDaSemana, hoje, horaParaMin, minParaHora } from "@/lib/datas";
import { Modal } from "../ui/Modal";
import { Botao } from "../ui/Botao";
import { Campo, Input, Select } from "../ui/basicos";
import { useToast } from "../ui/Toast";

export function BloqueioModal({
  prefill,
  aoFechar,
  barbeiros,
}: {
  prefill: { barbeiroId?: string; data?: string; hora?: string } | null;
  aoFechar: () => void;
  barbeiros: Barbeiro[];
}) {
  return (
    <Modal aberto={!!prefill} aoFechar={aoFechar} titulo="Bloquear horário" subtitulo="Almoço, folga, compromisso... o horário some da agenda do cliente." largura="sm">
      {prefill && <Form prefill={prefill} aoFechar={aoFechar} barbeiros={barbeiros} />}
    </Modal>
  );
}

function Form({
  prefill,
  aoFechar,
  barbeiros,
}: {
  prefill: { barbeiroId?: string; data?: string; hora?: string };
  aoFechar: () => void;
  barbeiros: Barbeiro[];
}) {
  const toast = useToast();
  const config = configService.obterSync();
  const [barbeiroId, setBarbeiroId] = useState(prefill.barbeiroId ?? barbeiros[0]?.id);
  const [data, setData] = useState(prefill.data ?? hoje());
  const [inicio, setInicio] = useState(prefill.hora ?? "12:00");
  const [fim, setFim] = useState(minParaHora(horaParaMin(prefill.hora ?? "12:00") + 60));
  const [motivo, setMotivo] = useState("Almoço");
  const [salvando, setSalvando] = useState(false);

  const h = config.horarios[diaDaSemana(data)] ?? { abre: "08:00", fecha: "20:00" };
  const opcoes: string[] = [];
  for (let m = horaParaMin(h.abre); m <= horaParaMin(h.fecha); m += 30) opcoes.push(minParaHora(m));

  const salvar = async () => {
    setSalvando(true);
    try {
      await bloqueioService.criar({ barbeiroId, data, inicio, fim, motivo });
      toast.sucesso("Horário bloqueado", `${inicio} – ${fim}`);
      aoFechar();
    } catch (e) {
      toast.erro("Não foi possível bloquear", (e as Error).message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-4">
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
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Das">
          <Select value={inicio} onChange={(e) => setInicio(e.target.value)}>
            {opcoes.slice(0, -1).map((o) => (
              <option key={o}>{o}</option>
            ))}
          </Select>
        </Campo>
        <Campo rotulo="Até">
          <Select value={fim} onChange={(e) => setFim(e.target.value)}>
            {opcoes.slice(1).map((o) => (
              <option key={o}>{o}</option>
            ))}
          </Select>
        </Campo>
      </div>
      <Campo rotulo="Motivo">
        <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: almoço, médico, folga" />
      </Campo>
      <Botao largura="total" tamanho="lg" icone={<Lock className="size-4" />} carregando={salvando} onClick={salvar}>
        Bloquear
      </Botao>
    </div>
  );
}

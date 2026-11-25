"use client";

import { useState } from "react";
import {
  Banknote,
  CalendarClock,
  Check,
  CheckCheck,
  Clock,
  CreditCard,
  Phone,
  QrCode,
  Tag,
  UserX,
  XCircle,
} from "lucide-react";
import type { Agendamento, Barbeiro, Cliente, MetodoPagamento } from "@/types";
import { agendamentoService, configService } from "@/services";
import { formatarDataAmigavel, formatarDuracao } from "@/lib/datas";
import { formatarMoeda, linkWhatsApp, primeiroNome } from "@/lib/formatadores";
import { descreverPagamento, METODO_PAGAMENTO, STATUS_AGENDAMENTO, STATUS_PAGAMENTO } from "@/lib/status";
import { Modal } from "../ui/Modal";
import { Botao } from "../ui/Botao";
import { Avatar, Badge } from "../ui/basicos";
import { useToast } from "../ui/Toast";
import { IconeWhatsApp } from "../cliente/BotaoWhatsApp";

export function mensagemWhatsApp(a: Agendamento, cliente: Cliente, barbeiro?: Barbeiro) {
  const cfg = configService.obterSync();
  return `Olá, ${primeiroNome(cliente.nome)}! Aqui é da ${cfg.nome} ✂️\nPassando para lembrar do seu horário de *${a.servicos
    .map((s) => s.nome)
    .join(" + ")}* em *${formatarDataAmigavel(a.data)}* às *${a.inicio}*${barbeiro ? ` com ${barbeiro.nome}` : ""}.\nValor: ${formatarMoeda(a.valorFinal)}.\nQualquer coisa é só responder por aqui. Até lá!`;
}

const METODOS: { valor: MetodoPagamento; icone: React.ReactNode }[] = [
  { valor: "dinheiro", icone: <Banknote className="size-5" /> },
  { valor: "pix", icone: <QrCode className="size-5" /> },
  { valor: "cartao", icone: <CreditCard className="size-5" /> },
];

export function DetalheAgendamentoModal({
  agendamento: a,
  cliente,
  barbeiro,
  aoFechar,
  aoRemarcar,
}: {
  agendamento: Agendamento | null;
  cliente?: Cliente;
  barbeiro?: Barbeiro;
  aoFechar: () => void;
  aoRemarcar: (a: Agendamento) => void;
}) {
  const toast = useToast();
  const [modo, setModo] = useState<"detalhe" | "concluir" | "cancelar">("detalhe");
  const [metodo, setMetodo] = useState<MetodoPagamento>("pix");
  const [processando, setProcessando] = useState<string | null>(null);

  const fechar = () => {
    setModo("detalhe");
    aoFechar();
  };

  const acao = async (chave: string, fn: () => Promise<unknown>, msg: string) => {
    setProcessando(chave);
    try {
      await fn();
      toast.sucesso(msg);
      fechar();
    } catch (e) {
      toast.erro("Ops!", (e as Error).message);
    } finally {
      setProcessando(null);
    }
  };

  if (!a) return <Modal aberto={false} aoFechar={fechar}>{null}</Modal>;
  const st = STATUS_AGENDAMENTO[a.status];
  const pg = STATUS_PAGAMENTO[a.statusPagamento];
  const aberto = a.status === "pendente" || a.status === "confirmado";
  const precisaPagar = a.statusPagamento !== "pago";

  return (
    <Modal aberto aoFechar={fechar} titulo={cliente?.nome ?? "Agendamento"} subtitulo={`${formatarDataAmigavel(a.data)} · ${a.inicio} – ${a.fim}`}>
      {modo === "detalhe" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            <Badge cor={st.cor}>{st.rotulo}</Badge>
            <Badge cor={pg.cor} icone={<CreditCard className="size-3" />}>
              {pg.rotulo}
            </Badge>
            {a.descontoFidelidade && (
              <Badge cor="marca" icone={<Tag className="size-3" />}>
                Fidelidade −{formatarMoeda(a.desconto)}
              </Badge>
            )}
            {a.criadoPor === "cliente" && <Badge cor="roxo">Agendado pelo app</Badge>}
          </div>

          <div className="rounded-xl border border-borda bg-painel-2 p-4">
            {a.servicos.map((s) => (
              <div key={s.id} className="flex justify-between py-0.5 text-sm">
                <span>{s.nome}</span>
                <span className="text-texto-2">{formatarMoeda(s.preco)}</span>
              </div>
            ))}
            <div className="mt-2 flex items-end justify-between border-t border-borda pt-2">
              <span className="flex items-center gap-1.5 text-xs text-texto-3">
                <Clock className="size-3.5" /> {formatarDuracao(a.duracaoMin)} · {descreverPagamento(a)}
              </span>
              <span className="font-display text-2xl font-semibold text-marca">{formatarMoeda(a.valorFinal)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {barbeiro && <Avatar nome={barbeiro.nome} cor={barbeiro.cor} tamanho={36} />}
            <div className="min-w-0 flex-1 text-sm">
              <p className="text-texto-3">Barbeiro</p>
              <p className="truncate font-medium">{barbeiro?.nome}</p>
            </div>
            {cliente && (
              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                <a href={linkWhatsApp(cliente.telefone, mensagemWhatsApp(a, cliente, barbeiro))} target="_blank" rel="noopener noreferrer" className="min-w-0">
                  <Botao tamanho="sm" largura="total" variante="secundario" icone={<IconeWhatsApp className="size-4" />}>
                    WhatsApp
                  </Botao>
                </a>
                <a href={`tel:${cliente.telefone.replace(/\D/g, "")}`} className="min-w-0">
                  <Botao tamanho="sm" largura="total" variante="secundario" icone={<Phone className="size-4" />}>
                    Ligar
                  </Botao>
                </a>
              </div>
            )}
          </div>
          {a.observacao && <p className="rounded-lg bg-painel-2 p-3 text-sm text-texto-2">{a.observacao}</p>}

          {aberto && (
            <div className="grid grid-cols-2 gap-2 border-t border-borda pt-4">
              {a.status === "pendente" && (
                <Botao
                  className="col-span-2"
                  variante="contorno"
                  icone={<Check className="size-4" />}
                  carregando={processando === "confirmar"}
                  onClick={() => acao("confirmar", () => agendamentoService.confirmar(a.id), "Agendamento confirmado!")}
                >
                  Confirmar agendamento
                </Botao>
              )}
              <Botao className="col-span-2" tamanho="lg" icone={<CheckCheck className="size-5" />} onClick={() => setModo("concluir")}>
                Concluir atendimento
              </Botao>
              <Botao variante="secundario" icone={<CalendarClock className="size-4" />} onClick={() => aoRemarcar(a)}>
                Remarcar
              </Botao>
              <Botao
                variante="secundario"
                icone={<UserX className="size-4" />}
                carregando={processando === "falta"}
                onClick={() => acao("falta", () => agendamentoService.marcarNaoCompareceu(a.id), "Marcado como não compareceu")}
              >
                Não compareceu
              </Botao>
              <Botao className="col-span-2" variante="perigo" icone={<XCircle className="size-4" />} onClick={() => setModo("cancelar")}>
                Cancelar agendamento
              </Botao>
            </div>
          )}
        </div>
      )}

      {modo === "concluir" && (
        <div className="space-y-4">
          {precisaPagar ? (
            <>
              <p className="text-sm text-texto-2">
                O cliente vai pagar <b className="text-marca">{formatarMoeda(a.valorFinal)}</b> na barbearia. Como foi o pagamento?
              </p>
              <div className="grid grid-cols-3 gap-2">
                {METODOS.map((m) => (
                  <button
                    key={m.valor}
                    onClick={() => setMetodo(m.valor)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition ${
                      metodo === m.valor ? "border-marca bg-marca/10 text-marca" : "border-borda bg-painel-2 text-texto-2 hover:border-marca/40"
                    }`}
                  >
                    {m.icone}
                    {METODO_PAGAMENTO[m.valor]}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="rounded-xl bg-sucesso/10 p-4 text-sm text-sucesso">
              Este atendimento já foi pago online ({a.metodoPagamento ? METODO_PAGAMENTO[a.metodoPagamento] : ""}). É só concluir.
            </p>
          )}
          <div className="flex gap-2">
            <Botao variante="secundario" largura="total" onClick={() => setModo("detalhe")}>
              Voltar
            </Botao>
            <Botao
              largura="total"
              carregando={processando === "concluir"}
              icone={<CheckCheck className="size-4" />}
              onClick={() =>
                acao(
                  "concluir",
                  () => agendamentoService.concluir(a.id, precisaPagar ? metodo : undefined),
                  `Atendimento concluído · ${formatarMoeda(a.valorFinal)} no caixa`,
                )
              }
            >
              Concluir {precisaPagar ? "e receber" : ""}
            </Botao>
          </div>
        </div>
      )}

      {modo === "cancelar" && (
        <div className="space-y-4">
          <p className="text-sm text-texto-2">
            Cancelar o horário de <b className="text-texto">{cliente?.nome}</b> às {a.inicio}?
            {a.statusPagamento === "pago" && " O valor pago online será estornado."}
          </p>
          <div className="flex gap-2">
            <Botao variante="secundario" largura="total" onClick={() => setModo("detalhe")}>
              Voltar
            </Botao>
            <Botao
              variante="perigo"
              largura="total"
              carregando={processando === "cancelar"}
              onClick={() => acao("cancelar", () => agendamentoService.cancelar(a.id, "barbeiro"), "Agendamento cancelado")}
            >
              Sim, cancelar
            </Botao>
          </div>
        </div>
      )}
    </Modal>
  );
}

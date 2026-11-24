"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, CreditCard, Lock, QrCode, ShieldCheck } from "lucide-react";
import { pagamentoService } from "@/services";
import { formatarMoeda } from "@/lib/formatadores";
import { Modal } from "../ui/Modal";
import { Botao } from "../ui/Botao";
import { Campo, Input, Skeleton } from "../ui/basicos";
import { useToast } from "../ui/Toast";

type MetodoOnline = "pix" | "cartao";

export function PagamentoSimulado({
  aberto,
  metodo,
  valor,
  aoFechar,
  aoAprovar,
}: {
  aberto: boolean;
  metodo: MetodoOnline;
  valor: number;
  aoFechar: () => void;
  aoAprovar: () => Promise<void>;
}) {
  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={metodo === "pix" ? "Pagar com Pix" : "Pagar com cartão"}
      subtitulo={
        <span className="inline-flex items-center gap-1.5">
          <Lock className="size-3.5" /> Ambiente simulado — nenhum pagamento real é feito
        </span>
      }
      largura="md"
    >
      {aberto && (metodo === "pix" ? <Pix valor={valor} aoAprovar={aoAprovar} /> : <Cartao valor={valor} aoAprovar={aoAprovar} />)}
    </Modal>
  );
}

function Pix({ valor, aoAprovar }: { valor: number; aoAprovar: () => Promise<void> }) {
  const toast = useToast();
  const [pix, setPix] = useState<{ codigo: string; expiraEmSegundos: number } | null>(null);
  const [restante, setRestante] = useState(600);
  const [copiado, setCopiado] = useState(false);
  const [aprovando, setAprovando] = useState(false);

  useEffect(() => {
    pagamentoService.gerarPix(valor).then((p) => {
      setPix(p);
      setRestante(p.expiraEmSegundos);
    });
    const t = setInterval(() => setRestante((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [valor]);

  const copiar = async () => {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix.codigo);
    } catch {
      /* navegadores sem permissão de clipboard: segue como copiado na demo */
    }
    setCopiado(true);
    toast.sucesso("Código Pix copiado!");
    setTimeout(() => setCopiado(false), 2000);
  };

  const aprovar = async () => {
    setAprovando(true);
    try {
      await pagamentoService.aprovar("pix", valor);
      await aoAprovar();
    } finally {
      setAprovando(false);
    }
  };

  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-sm text-texto-2">Valor a pagar</p>
      <p className="font-display text-4xl font-semibold text-marca">{formatarMoeda(valor)}</p>
      <div className="mt-5 rounded-2xl bg-white p-4 shadow-xl shadow-black/40">
        {pix ? (
          <QRCodeSVG value={pix.codigo} size={190} level="M" fgColor="#0a0a0b" />
        ) : (
          <div className="grid size-[190px] place-items-center">
            <QrCode className="size-12 animate-pulse text-zinc-300" />
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-texto-3 tabular-nums">
        Expira em {String(Math.floor(restante / 60)).padStart(2, "0")}:{String(restante % 60).padStart(2, "0")}
      </p>
      <div className="mt-4 w-full">
        {pix ? (
          <div className="flex items-center gap-2 rounded-xl border border-borda bg-painel-2 p-2 pl-3">
            <code className="min-w-0 flex-1 truncate text-left text-xs text-texto-2">{pix.codigo}</code>
            <Botao tamanho="sm" variante="secundario" icone={copiado ? <Check className="size-4 text-sucesso" /> : <Copy className="size-4" />} onClick={copiar}>
              {copiado ? "Copiado" : "Copiar código"}
            </Botao>
          </div>
        ) : (
          <Skeleton className="h-12" />
        )}
      </div>
      <ol className="mt-4 w-full space-y-1 text-left text-xs text-texto-3">
        <li>1. Abra o app do seu banco e escolha pagar com Pix.</li>
        <li>2. Escaneie o QR Code ou cole o código.</li>
        <li>3. Confirme o pagamento — a aprovação é instantânea.</li>
      </ol>
      <Botao className="mt-5" tamanho="lg" largura="total" variante="sucesso" carregando={aprovando} disabled={!pix} icone={<ShieldCheck className="size-5" />} onClick={aprovar}>
        {aprovando ? "Confirmando pagamento..." : "Simular pagamento aprovado"}
      </Botao>
    </div>
  );
}

function Cartao({ valor, aoAprovar }: { valor: number; aoAprovar: () => Promise<void> }) {
  const [form, setForm] = useState({ numero: "4111 1111 1111 1111", nome: "JOAO SILVA", validade: "12/30", cvv: "123" });
  const [aprovando, setAprovando] = useState(false);

  const fmt = (k: keyof typeof form, v: string) => {
    if (k === "numero") return v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
    if (k === "validade") return v.replace(/\D/g, "").slice(0, 4).replace(/(\d{2})(?=\d)/, "$1/");
    if (k === "cvv") return v.replace(/\D/g, "").slice(0, 4);
    return v.toUpperCase();
  };
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: fmt(k, e.target.value) }));

  const pagar = async (e: React.FormEvent) => {
    e.preventDefault();
    setAprovando(true);
    try {
      await pagamentoService.aprovar("cartao", valor);
      await aoAprovar();
    } finally {
      setAprovando(false);
    }
  };

  return (
    <form onSubmit={pagar}>
      {/* cartão visual */}
      <div className="relative mx-auto aspect-[1.586] w-full max-w-xs overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-700 via-zinc-800 to-black p-5 shadow-2xl shadow-black/60">
        <div className="absolute -top-10 -right-10 size-40 rounded-full bg-marca/20 blur-2xl" />
        <div className="flex items-center justify-between">
          <div className="h-7 w-10 rounded-md bg-gradient-to-br from-marca-claro to-marca-escuro" />
          <CreditCard className="size-6 text-white/70" />
        </div>
        <p className="mt-6 font-mono text-lg tracking-widest text-white">{form.numero || "•••• •••• •••• ••••"}</p>
        <div className="mt-4 flex justify-between text-[11px] text-white/70 uppercase">
          <span className="truncate pr-4">{form.nome || "NOME NO CARTÃO"}</span>
          <span className="font-mono">{form.validade || "MM/AA"}</span>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Campo rotulo="Número do cartão">
            <Input value={form.numero} onChange={set("numero")} inputMode="numeric" required />
          </Campo>
        </div>
        <div className="col-span-2">
          <Campo rotulo="Nome impresso">
            <Input value={form.nome} onChange={set("nome")} required />
          </Campo>
        </div>
        <Campo rotulo="Validade">
          <Input value={form.validade} onChange={set("validade")} placeholder="MM/AA" inputMode="numeric" required />
        </Campo>
        <Campo rotulo="CVV">
          <Input value={form.cvv} onChange={set("cvv")} inputMode="numeric" required />
        </Campo>
      </div>
      <p className="mt-3 text-xs text-texto-3">Dados de exemplo já preenchidos. A aprovação é automática.</p>
      <Botao type="submit" className="mt-4" tamanho="lg" largura="total" carregando={aprovando} icone={<Lock className="size-4" />}>
        {aprovando ? "Processando..." : `Pagar ${formatarMoeda(valor)}`}
      </Botao>
    </form>
  );
}

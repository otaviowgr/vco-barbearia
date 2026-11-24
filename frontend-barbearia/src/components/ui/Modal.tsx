"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Botao } from "./Botao";

/** Modal centralizado no desktop e "bottom sheet" no celular. */
export function Modal({
  aberto,
  aoFechar,
  titulo,
  subtitulo,
  children,
  rodape,
  largura = "md",
}: {
  aberto: boolean;
  aoFechar: () => void;
  titulo?: ReactNode;
  subtitulo?: ReactNode;
  children: ReactNode;
  rodape?: ReactNode;
  largura?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!aberto) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && aoFechar();
    document.addEventListener("keydown", esc);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = overflow;
    };
  }, [aberto, aoFechar]);

  if (!aberto) return null;
  const w = { sm: "sm:max-w-sm", md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-4xl" }[largura];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-entrar bg-black/70 backdrop-blur-sm" onClick={aoFechar} />
      <div
        className={`relative flex max-h-[92dvh] w-full ${w} animate-subir flex-col rounded-t-3xl border border-borda bg-painel shadow-2xl shadow-black sm:animate-escala sm:rounded-2xl`}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-borda-forte sm:hidden" />
        {(titulo || subtitulo) && (
          <div className="flex items-start justify-between gap-4 border-b border-borda px-5 pt-4 pb-3.5">
            <div className="min-w-0">
              {titulo && <h2 className="font-display text-xl font-medium tracking-wide">{titulo}</h2>}
              {subtitulo && <p className="mt-0.5 text-sm text-texto-2">{subtitulo}</p>}
            </div>
            <button onClick={aoFechar} className="-mr-1 rounded-lg p-1.5 text-texto-3 transition hover:bg-painel-3 hover:text-texto" aria-label="Fechar">
              <X className="size-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {rodape && <div className="border-t border-borda px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">{rodape}</div>}
      </div>
    </div>,
    document.body,
  );
}

/** Diálogo de confirmação simples ("Tem certeza?"). */
export function Confirmar({
  aberto,
  aoFechar,
  aoConfirmar,
  titulo,
  mensagem,
  textoConfirmar = "Confirmar",
  perigo,
}: {
  aberto: boolean;
  aoFechar: () => void;
  aoConfirmar: () => Promise<unknown> | void;
  titulo: string;
  mensagem: ReactNode;
  textoConfirmar?: string;
  perigo?: boolean;
}) {
  const [carregando, setCarregando] = useState(false);
  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={titulo}
      largura="sm"
      rodape={
        <div className="flex gap-2">
          <Botao variante="secundario" largura="total" onClick={aoFechar}>
            Voltar
          </Botao>
          <Botao
            variante={perigo ? "perigo" : "primario"}
            largura="total"
            carregando={carregando}
            onClick={async () => {
              setCarregando(true);
              try {
                await aoConfirmar();
              } finally {
                setCarregando(false);
              }
            }}
          >
            {textoConfirmar}
          </Botao>
        </div>
      }
    >
      <div className="text-sm text-texto-2">{mensagem}</div>
    </Modal>
  );
}

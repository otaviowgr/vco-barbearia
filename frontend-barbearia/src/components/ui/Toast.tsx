"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

type TipoToast = "sucesso" | "erro" | "info";
interface ToastItem {
  id: number;
  tipo: TipoToast;
  titulo: string;
  descricao?: string;
}

interface ToastApi {
  sucesso: (titulo: string, descricao?: string) => void;
  erro: (titulo: string, descricao?: string) => void;
  info: (titulo: string, descricao?: string) => void;
}

const Ctx = createContext<ToastApi | null>(null);

let proximoId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ToastItem[]>([]);

  const remover = useCallback((id: number) => setItens((l) => l.filter((t) => t.id !== id)), []);

  const adicionar = useCallback(
    (tipo: TipoToast, titulo: string, descricao?: string) => {
      const id = proximoId++;
      setItens((l) => [...l.slice(-3), { id, tipo, titulo, descricao }]);
      setTimeout(() => remover(id), tipo === "erro" ? 5000 : 3500);
    },
    [remover],
  );

  const [api] = useState<ToastApi>(() => ({
    sucesso: (t, d) => adicionar("sucesso", t, d),
    erro: (t, d) => adicionar("erro", t, d),
    info: (t, d) => adicionar("info", t, d),
  }));

  return (
    <Ctx.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3 sm:top-auto sm:bottom-6 sm:right-6 sm:left-auto sm:items-end"
      >
        {itens.map((t) => {
          const Icone = t.tipo === "sucesso" ? CheckCircle2 : t.tipo === "erro" ? XCircle : Info;
          const cor = t.tipo === "sucesso" ? "text-sucesso" : t.tipo === "erro" ? "text-perigo" : "text-marca";
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto flex w-full max-w-sm animate-entrar items-start gap-3 rounded-xl border border-borda bg-painel-2/95 p-3.5 shadow-2xl shadow-black/50 backdrop-blur"
            >
              <Icone className={`mt-0.5 size-5 shrink-0 ${cor}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-texto">{t.titulo}</p>
                {t.descricao && <p className="mt-0.5 text-sm text-texto-2">{t.descricao}</p>}
              </div>
              <button
                onClick={() => remover(t.id)}
                className="rounded-md p-0.5 text-texto-3 transition hover:text-texto"
                aria-label="Fechar aviso"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useToast precisa estar dentro de ToastProvider");
  return c;
}

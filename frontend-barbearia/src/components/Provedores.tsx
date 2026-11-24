"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ServerCrash } from "lucide-react";
import { API_URL, inicializarDados } from "@/services";
import { SessaoProvider } from "./SessaoProvider";
import { ToastProvider } from "./ui/Toast";
import { Logo } from "./Logo";
import { Botao } from "./ui/Botao";

/**
 * Prepara os dados antes de abrir as telas:
 * - modo demonstração: carrega o seed no localStorage;
 * - modo API: busca a configuração da barbearia no back-end.
 */
export function Provedores({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<"carregando" | "pronto" | string>("carregando");

  const iniciar = useCallback(() => {
    inicializarDados()
      .then(() => setEstado("pronto"))
      .catch((e: Error) => setEstado(e.message || "Erro ao carregar os dados."));
  }, []);

  useEffect(iniciar, [iniciar]);

  if (estado === "carregando") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="animate-pulse">
          <Logo tamanho="lg" />
        </div>
      </div>
    );
  }

  if (estado !== "pronto") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <ServerCrash className="size-12 text-perigo" />
        <p className="font-display text-2xl tracking-wide uppercase">Servidor indisponível</p>
        <p className="max-w-md text-sm text-texto-2">
          {estado}
          <br />
          Endereço da API: <code className="text-ouro">{API_URL}</code>
        </p>
        <Botao
          onClick={() => {
            setEstado("carregando");
            iniciar();
          }}
        >
          Tentar de novo
        </Botao>
      </div>
    );
  }

  return (
    <ToastProvider>
      <SessaoProvider>{children}</SessaoProvider>
    </ToastProvider>
  );
}

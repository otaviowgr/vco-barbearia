"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { garantirSeed } from "@/services";
import { SessaoProvider } from "./SessaoProvider";
import { ToastProvider } from "./ui/Toast";
import { Logo } from "./Logo";

const assinarNada = () => () => {};

/**
 * Todo o protótipo roda no navegador (dados no localStorage).
 * Enquanto o JavaScript não carrega, mostramos uma tela de abertura.
 */
export function Provedores({ children }: { children: ReactNode }) {
  const noCliente = useSyncExternalStore(
    assinarNada,
    () => true,
    () => false,
  );

  if (!noCliente) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="animate-pulse">
          <Logo tamanho="lg" />
        </div>
      </div>
    );
  }

  garantirSeed();

  return (
    <ToastProvider>
      <SessaoProvider>{children}</SessaoProvider>
    </ToastProvider>
  );
}

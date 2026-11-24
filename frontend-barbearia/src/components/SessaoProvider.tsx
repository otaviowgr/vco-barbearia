"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Perfil, Sessao } from "@/types";
import { authService, EVENTO_DB } from "@/services";

interface SessaoCtx {
  sessao: Sessao | null;
  /** navega para a página inicial do perfil */
  irParaInicio: (s: Sessao) => void;
  entrarDemo: (perfil: Perfil) => Promise<void>;
  entrar: (email: string, senha: string) => Promise<void>;
  trocarPerfil: () => Promise<void>;
  sair: () => Promise<void>;
  definirSessao: (s: Sessao) => void;
  trocando: boolean;
}

const Ctx = createContext<SessaoCtx | null>(null);

export const rotaInicial = (s: Sessao) => (s.perfil === "cliente" ? "/cliente" : "/barbeiro/agenda");

export function SessaoProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [sessao, setSessao] = useState<Sessao | null>(() => authService.sessaoAtual());
  const [trocando, setTrocando] = useState(false);

  useEffect(() => {
    // mantém a sessão em sincronia (ex.: login feito em outra aba)
    const ouvir = () => setSessao(authService.sessaoAtual());
    window.addEventListener(EVENTO_DB, ouvir);
    return () => window.removeEventListener(EVENTO_DB, ouvir);
  }, []);

  const irParaInicio = useCallback((s: Sessao) => router.push(rotaInicial(s)), [router]);

  const valor: SessaoCtx = {
    sessao,
    trocando,
    irParaInicio,
    definirSessao: setSessao,
    entrarDemo: async (perfil) => {
      const s = await authService.loginDemo(perfil);
      setSessao(s);
      irParaInicio(s);
    },
    entrar: async (email, senha) => {
      const s = await authService.login(email, senha);
      setSessao(s);
      irParaInicio(s);
    },
    trocarPerfil: async () => {
      setTrocando(true);
      try {
        const s = await authService.trocarPerfil();
        setSessao(s);
        irParaInicio(s);
      } finally {
        setTimeout(() => setTrocando(false), 300);
      }
    },
    sair: async () => {
      await authService.sair();
      setSessao(null);
      router.push("/login");
    },
  };

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useSessao() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSessao precisa estar dentro de SessaoProvider");
  return c;
}

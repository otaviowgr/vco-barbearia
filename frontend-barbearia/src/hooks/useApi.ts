"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EVENTO_DB } from "@/services";

/**
 * Executa uma chamada da "API" e mantém o resultado atualizado:
 * sempre que algo muda no banco (nesta aba ou em outra), recarrega
 * em segundo plano, sem mostrar o skeleton de novo.
 */
export function useApi<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [dados, setDados] = useState<T | undefined>(undefined);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const fnRef = useRef(fn);
  const seq = useRef(0);

  useEffect(() => {
    fnRef.current = fn;
  });

  const executar = useCallback(async (silencioso: boolean) => {
    const meu = ++seq.current;
    if (!silencioso) setCarregando(true);
    try {
      const r = await fnRef.current();
      if (meu === seq.current) {
        setDados(r);
        setErro(null);
      }
    } catch (e) {
      if (meu === seq.current) setErro(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      if (meu === seq.current) setCarregando(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    executar(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const ouvir = () => executar(true);
    window.addEventListener(EVENTO_DB, ouvir);
    return () => window.removeEventListener(EVENTO_DB, ouvir);
  }, [executar]);

  return { dados, carregando, erro, recarregar: () => executar(true) };
}

/** Envolve uma ação (botão) com estado de "processando" e tratamento de erro. */
export function useAcao() {
  const [processando, setProcessando] = useState<string | null>(null);
  const executar = useCallback(
    async <T,>(chave: string, fn: () => Promise<T>, aoFalhar?: (msg: string) => void): Promise<T | undefined> => {
      setProcessando(chave);
      try {
        return await fn();
      } catch (e) {
        aoFalhar?.(e instanceof Error ? e.message : "Erro inesperado");
        return undefined;
      } finally {
        setProcessando(null);
      }
    },
    [],
  );
  return { processando, executar };
}

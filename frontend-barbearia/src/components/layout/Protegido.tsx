"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Perfil } from "@/types";
import { rotaInicial, useSessao } from "../SessaoProvider";
import { Spinner } from "../ui/basicos";

/** Só mostra o conteúdo se houver sessão do perfil esperado; senão redireciona. */
export function Protegido({ perfil, children }: { perfil: Perfil; children: ReactNode }) {
  const { sessao } = useSessao();
  const router = useRouter();
  const ok = sessao?.perfil === perfil;

  useEffect(() => {
    if (!sessao) router.replace("/login");
    else if (sessao.perfil !== perfil) router.replace(rotaInicial(sessao));
  }, [sessao, perfil, router]);

  if (!ok) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner className="size-8" />
      </div>
    );
  }
  return <>{children}</>;
}

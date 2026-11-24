"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { rotaInicial, useSessao } from "@/components/SessaoProvider";
import { Logo } from "@/components/Logo";

export default function Inicio() {
  const { sessao } = useSessao();
  const router = useRouter();
  useEffect(() => {
    router.replace(sessao ? rotaInicial(sessao) : "/login");
  }, [sessao, router]);
  return (
    <div className="grid min-h-dvh place-items-center">
      <div className="animate-pulse">
        <Logo tamanho="lg" />
      </div>
    </div>
  );
}

"use client";

import { CalendarCheck, CalendarPlus, Crown, Home } from "lucide-react";
import { BarraTopo, NavInferior, type ItemNav } from "@/components/layout/BarraTopo";
import { Protegido } from "@/components/layout/Protegido";
import { BotaoWhatsApp } from "@/components/cliente/BotaoWhatsApp";

const ITENS: ItemNav[] = [
  { href: "/cliente", rotulo: "Início", icone: <Home className="size-5 lg:size-4" /> },
  { href: "/cliente/agendar", rotulo: "Agendar", icone: <CalendarPlus className="size-5 lg:size-4" /> },
  { href: "/cliente/agendamentos", rotulo: "Meus horários", icone: <CalendarCheck className="size-5 lg:size-4" /> },
  { href: "/cliente/fidelidade", rotulo: "Fidelidade", icone: <Crown className="size-5 lg:size-4" /> },
];

export default function LayoutCliente({ children }: { children: React.ReactNode }) {
  return (
    <Protegido perfil="cliente">
      <div className="min-h-dvh pb-24 lg:pb-10">
        <BarraTopo itens={ITENS} inicio="/cliente" linkConfig="/cliente/perfil" />
        <main className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 sm:pt-8">{children}</main>
        <BotaoWhatsApp />
        <NavInferior itens={ITENS} inicio="/cliente" />
      </div>
    </Protegido>
  );
}

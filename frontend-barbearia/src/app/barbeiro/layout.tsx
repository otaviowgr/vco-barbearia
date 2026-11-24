"use client";

import { BarChart3, CalendarDays, Scissors, Users, UsersRound } from "lucide-react";
import { BarraTopo, NavInferior, type ItemNav } from "@/components/layout/BarraTopo";
import { Protegido } from "@/components/layout/Protegido";
import { useApi } from "@/hooks/useApi";
import { agendamentoService } from "@/services";

function Shell({ children }: { children: React.ReactNode }) {
  const { dados: novos } = useApi(() => agendamentoService.contarNaoVistos(), []);
  const itens: ItemNav[] = [
    { href: "/barbeiro/agenda", rotulo: "Agenda", icone: <CalendarDays className="size-5 lg:size-4" />, badge: novos },
    { href: "/barbeiro/clientes", rotulo: "Clientes", icone: <Users className="size-5 lg:size-4" /> },
    { href: "/barbeiro/financeiro", rotulo: "Financeiro", icone: <BarChart3 className="size-5 lg:size-4" /> },
    { href: "/barbeiro/servicos", rotulo: "Serviços", icone: <Scissors className="size-5 lg:size-4" /> },
    { href: "/barbeiro/equipe", rotulo: "Equipe", icone: <UsersRound className="size-5 lg:size-4" /> },
  ];
  return (
    <div className="min-h-dvh pb-24 lg:pb-10">
      <BarraTopo itens={itens} inicio="/barbeiro/agenda" linkConfig="/barbeiro/configuracoes" />
      <main className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-8">{children}</main>
      <NavInferior itens={itens} inicio="/barbeiro/agenda" />
    </div>
  );
}

export default function LayoutBarbeiro({ children }: { children: React.ReactNode }) {
  return (
    <Protegido perfil="barbeiro">
      <Shell>{children}</Shell>
    </Protegido>
  );
}

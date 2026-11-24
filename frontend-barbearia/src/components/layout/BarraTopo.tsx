"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeftRight, ChevronDown, LogOut, Settings } from "lucide-react";
import { useSessao } from "../SessaoProvider";
import { Avatar } from "../ui/basicos";
import { Logo } from "../Logo";

export interface ItemNav {
  href: string;
  rotulo: string;
  icone: ReactNode;
  badge?: number;
}

export function ativo(pathname: string, href: string, exato?: boolean) {
  return exato ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

export function BotaoTrocarPerfil() {
  const { sessao, trocarPerfil, trocando } = useSessao();
  const destino = sessao?.perfil === "cliente" ? "Barbeiro" : "Cliente";
  return (
    <button
      onClick={trocarPerfil}
      disabled={trocando}
      title={`Trocar para o perfil ${destino} (demonstração)`}
      className="group inline-flex h-9 items-center gap-1.5 rounded-full border border-borda bg-painel-2 px-3 text-xs font-medium text-texto-2 transition hover:border-marca/50 hover:text-marca disabled:opacity-60"
    >
      <ArrowLeftRight className={`size-3.5 transition-transform duration-500 ${trocando ? "rotate-180" : "group-hover:rotate-180"}`} />
      <span className="hidden sm:inline">Trocar perfil</span>
      <span className="sm:hidden">{destino}</span>
    </button>
  );
}

function MenuUsuario({ linkConfig }: { linkConfig: string }) {
  const { sessao, sair } = useSessao();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fora = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setAberto(false);
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);
  if (!sessao) return null;
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setAberto((v) => !v)} className="flex items-center gap-1.5 rounded-full p-0.5 pr-1.5 transition hover:bg-painel-3">
        <Avatar nome={sessao.nome} tamanho={32} />
        <ChevronDown className="size-4 text-texto-3" />
      </button>
      {aberto && (
        <div className="absolute right-0 z-40 mt-2 w-56 animate-escala rounded-xl border border-borda bg-painel-2 p-1.5 shadow-2xl shadow-black/60">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold">{sessao.nome}</p>
            <p className="text-xs text-texto-3">{sessao.perfil === "cliente" ? "Cliente" : "Barbeiro · Administrador"}</p>
          </div>
          <div className="my-1 h-px bg-borda" />
          <Link
            href={linkConfig}
            onClick={() => setAberto(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-texto-2 hover:bg-painel-3 hover:text-texto"
          >
            <Settings className="size-4" /> Configurações
          </Link>
          <button
            onClick={sair}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-perigo hover:bg-perigo/10"
          >
            <LogOut className="size-4" /> Sair
          </button>
        </div>
      )}
    </div>
  );
}

export function BarraTopo({ itens, linkConfig, inicio }: { itens: ItemNav[]; linkConfig: string; inicio: string }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-borda/70 bg-fundo/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href={inicio} className="shrink-0">
          <span className="hidden sm:inline">
            <Logo tamanho="sm" />
          </span>
          <span className="sm:hidden">
            <Logo tamanho="sm" compacto />
          </span>
        </Link>
        <nav className="hidden flex-1 items-center gap-1 lg:flex">
          {itens.map((i) => {
            const at = ativo(pathname, i.href, i.href === inicio);
            return (
              <Link
                key={i.href}
                href={i.href}
                className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  at ? "bg-marca/10 text-marca" : "text-texto-2 hover:bg-painel-2 hover:text-texto"
                }`}
              >
                {i.icone}
                {i.rotulo}
                {!!i.badge && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-marca-escuro px-1 text-[11px] font-bold text-white">{i.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <BotaoTrocarPerfil />
          <MenuUsuario linkConfig={linkConfig} />
        </div>
      </div>
    </header>
  );
}

/** Navegação inferior (celular). */
export function NavInferior({ itens, inicio }: { itens: ItemNav[]; inicio: string }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-borda bg-painel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-lg">
        {itens.map((i) => {
          const at = ativo(pathname, i.href, i.href === inicio);
          return (
            <Link
              key={i.href}
              href={i.href}
              className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${at ? "text-marca" : "text-texto-3"}`}
            >
              {at && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-marca" />}
              <span className="relative">
                {i.icone}
                {!!i.badge && (
                  <span className="absolute -top-1.5 -right-2.5 grid h-4 min-w-4 place-items-center rounded-full bg-marca-escuro px-1 text-[10px] font-bold text-white">
                    {i.badge}
                  </span>
                )}
              </span>
              {i.rotulo}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

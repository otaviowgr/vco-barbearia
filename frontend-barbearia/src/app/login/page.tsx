"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Scissors, User } from "lucide-react";
import { Logo } from "@/components/Logo";
import { rotaInicial, useSessao } from "@/components/SessaoProvider";
import { Botao } from "@/components/ui/Botao";
import { Campo, Imagem, Input, Segmentado } from "@/components/ui/basicos";
import { useToast } from "@/components/ui/Toast";
import { authService } from "@/services";
import { IMAGEM_LOGIN } from "@/data/seed";
import { formatarTelefone } from "@/lib/formatadores";
import type { Perfil } from "@/types";

export default function PaginaLogin() {
  const { sessao, entrar, entrarDemo, definirSessao, irParaInicio } = useSessao();
  const router = useRouter();
  const toast = useToast();
  const [aba, setAba] = useState<"entrar" | "cadastrar">("entrar");
  const [carregando, setCarregando] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", senha: "" });

  useEffect(() => {
    if (sessao && !carregando) router.replace(rotaInicial(sessao));
  }, [sessao, carregando, router]);

  const demo = async (perfil: Perfil) => {
    setCarregando(perfil);
    try {
      await entrarDemo(perfil);
      toast.sucesso(perfil === "cliente" ? "Bem-vindo, João!" : "Bem-vindo, Carlos!", "Você entrou com o login de demonstração.");
    } catch (e) {
      toast.erro("Não foi possível entrar", (e as Error).message);
      setCarregando(null);
    }
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setCarregando("form");
    try {
      if (aba === "entrar") {
        await entrar(form.email, form.senha);
        toast.sucesso("Login realizado!");
      } else {
        const s = await authService.cadastrarCliente(form);
        definirSessao(s);
        toast.sucesso("Conta criada!", "Agora é só agendar seu horário.");
        irParaInicio(s);
      }
    } catch (err) {
      toast.erro(aba === "entrar" ? "Falha no login" : "Falha no cadastro", (err as Error).message);
      setCarregando(null);
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: k === "telefone" ? formatarTelefone(e.target.value) : e.target.value }));

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* Painel com foto (desktop) */}
      <div className="relative hidden overflow-hidden lg:block">
        <Imagem src={IMAGEM_LOGIN} alt="Barbeiro trabalhando" className="absolute inset-0 size-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-fundo via-fundo/50 to-fundo/10" />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <p className="font-display text-5xl leading-tight font-semibold tracking-wide uppercase">
            Seu estilo,
            <br />
            <span className="texto-ouro">no seu horário.</span>
          </p>
          <p className="mt-4 max-w-md text-texto-2">
            Agende em segundos, acompanhe seus horários e ganhe descontos no plano fidelidade.
          </p>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex flex-col justify-center px-5 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-md animate-entrar">
          <Logo tamanho="md" />
          <h1 className="mt-8 font-display text-3xl font-semibold tracking-wide uppercase">
            {aba === "entrar" ? "Entrar" : "Criar conta"}
          </h1>
          <p className="mt-1 text-sm text-texto-2">Protótipo de demonstração — todos os dados são fictícios.</p>

          {/* Atalhos demo */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => demo("cliente")}
              disabled={!!carregando}
              className="group flex items-center gap-3 rounded-2xl border border-ouro/40 bg-ouro/10 p-4 text-left transition hover:-translate-y-0.5 hover:bg-ouro/15 disabled:opacity-60"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ouro text-fundo">
                <User className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ouro">Entrar como Cliente</span>
                <span className="block text-xs text-texto-2">(demo) João Silva</span>
              </span>
              <ArrowRight className={`ml-auto size-4 text-ouro transition group-hover:translate-x-0.5 ${carregando === "cliente" ? "animate-pulse" : ""}`} />
            </button>
            <button
              onClick={() => demo("barbeiro")}
              disabled={!!carregando}
              className="group flex items-center gap-3 rounded-2xl border border-borda bg-painel-2 p-4 text-left transition hover:-translate-y-0.5 hover:border-ouro/40 disabled:opacity-60"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-painel-3 text-ouro">
                <Scissors className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">Entrar como Barbeiro</span>
                <span className="block text-xs text-texto-2">(demo) Carlos · admin</span>
              </span>
              <ArrowRight className={`ml-auto size-4 text-texto-2 transition group-hover:translate-x-0.5 ${carregando === "barbeiro" ? "animate-pulse" : ""}`} />
            </button>
          </div>

          <div className="my-7 flex items-center gap-3 text-xs text-texto-3">
            <div className="h-px flex-1 bg-borda" /> ou use e-mail e senha <div className="h-px flex-1 bg-borda" />
          </div>

          <Segmentado
            className="mb-5 w-full"
            valor={aba}
            aoMudar={setAba}
            opcoes={[
              { valor: "entrar", rotulo: "Já tenho conta" },
              { valor: "cadastrar", rotulo: "Sou novo aqui" },
            ]}
          />

          <form onSubmit={enviar} className="space-y-4">
            {aba === "cadastrar" && (
              <>
                <Campo rotulo="Nome completo">
                  <Input required value={form.nome} onChange={set("nome")} placeholder="Seu nome" autoComplete="name" />
                </Campo>
                <Campo rotulo="WhatsApp">
                  <Input required value={form.telefone} onChange={set("telefone")} placeholder="(48) 90000-0000" inputMode="tel" />
                </Campo>
              </>
            )}
            <Campo rotulo="E-mail">
              <Input required type="email" value={form.email} onChange={set("email")} placeholder="voce@email.com" autoComplete="email" />
            </Campo>
            <Campo rotulo="Senha" dica={aba === "cadastrar" ? "Mínimo de 6 caracteres" : undefined}>
              <Input required type="password" value={form.senha} onChange={set("senha")} placeholder="••••••" autoComplete={aba === "entrar" ? "current-password" : "new-password"} />
            </Campo>
            <Botao type="submit" tamanho="lg" largura="total" carregando={carregando === "form"} disabled={!!carregando}>
              {aba === "entrar" ? "Entrar" : "Criar minha conta"}
            </Botao>
          </form>

          <div className="mt-6 rounded-xl border border-borda bg-painel p-3.5 text-xs text-texto-2">
            <p className="mb-1 font-semibold text-texto">Logins de demonstração</p>
            <p>Cliente: <code className="text-ouro">cliente@demo.com</code> / <code className="text-ouro">123456</code></p>
            <p>Barbeiro: <code className="text-ouro">barbeiro@demo.com</code> / <code className="text-ouro">123456</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}

import type { Perfil, Sessao, Usuario } from "@/types";
import { formatarTelefone } from "@/lib/formatadores";
import { agoraISO, alterar, chamadaApi, ErroApi, garantirSeed, gerarId, gravar, ler } from "./db";

export const CREDENCIAIS_DEMO: Record<Perfil, { email: string; senha: string }> = {
  cliente: { email: "cliente@demo.com", senha: "123456" },
  barbeiro: { email: "barbeiro@demo.com", senha: "123456" },
};

function criarSessao(u: Usuario): Sessao {
  const sessao: Sessao = {
    usuarioId: u.id,
    perfil: u.perfil,
    nome: u.nome,
    clienteId: u.clienteId,
    barbeiroId: u.barbeiroId,
    isAdmin: u.isAdmin,
  };
  gravar("sessao", sessao);
  return sessao;
}

function autenticar(email: string, senha: string): Sessao {
  const u = ler("usuarios").find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
  if (!u || u.senha !== senha) throw new ErroApi("E-mail ou senha inválidos.", 401);
  return criarSessao(u);
}

export interface DadosCadastro {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
}

export const authService = {
  /** Leitura síncrona da sessão (usada para proteger rotas sem "piscar" a tela). */
  sessaoAtual(): Sessao | null {
    if (typeof window === "undefined") return null;
    garantirSeed();
    return ler("sessao");
  },

  login: (email: string, senha: string) => chamadaApi(() => autenticar(email, senha)),

  loginDemo: (perfil: Perfil) =>
    chamadaApi(() => autenticar(CREDENCIAIS_DEMO[perfil].email, CREDENCIAIS_DEMO[perfil].senha)),

  /** Alterna entre cliente demo e barbeiro demo (atalho da apresentação). */
  trocarPerfil: () =>
    chamadaApi(() => {
      const atual = ler("sessao");
      const destino: Perfil = atual?.perfil === "cliente" ? "barbeiro" : "cliente";
      return autenticar(CREDENCIAIS_DEMO[destino].email, CREDENCIAIS_DEMO[destino].senha);
    }, { min: 150, max: 300 }),

  sair: () => chamadaApi(() => gravar("sessao", null), { min: 100, max: 200 }),

  cadastrarCliente: (dados: DadosCadastro) =>
    chamadaApi(() => {
      const email = dados.email.trim().toLowerCase();
      if (!dados.nome.trim() || !email || !dados.senha) throw new ErroApi("Preencha todos os campos.");
      if (dados.senha.length < 6) throw new ErroApi("A senha precisa ter pelo menos 6 caracteres.");
      if (ler("usuarios").some((u) => u.email.toLowerCase() === email)) {
        throw new ErroApi("Já existe uma conta com esse e-mail.", 409);
      }
      const clienteId = gerarId("cli");
      const telefone = formatarTelefone(dados.telefone);
      alterar("clientes", (l) => [
        ...l,
        { id: clienteId, nome: dados.nome.trim(), email, telefone, criadoEm: agoraISO() },
      ]);
      const usuario: Usuario = {
        id: gerarId("usr"),
        nome: dados.nome.trim(),
        email,
        senha: dados.senha,
        telefone,
        perfil: "cliente",
        clienteId,
      };
      alterar("usuarios", (l) => [...l, usuario]);
      return criarSessao(usuario);
    }, { min: 600, max: 900 }),
};

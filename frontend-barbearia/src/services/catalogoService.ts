// Serviços (cortes, barba...), barbeiros e configurações da barbearia.
import type { Barbeiro, ConfigBarbearia, Servico } from "@/types";
import { alterar, chamadaApi, ErroApi, gerarId, gravar, ler, restaurarDemo } from "./db";

const FOTO_PADRAO_SERVICO =
  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=70";

export type ServicoForm = Omit<Servico, "id"> & { id?: string };
export type BarbeiroForm = Omit<Barbeiro, "id" | "temLogin"> & { id?: string; temLogin?: boolean };

function validarServico(s: ServicoForm) {
  if (!s.nome.trim()) throw new ErroApi("Informe o nome do serviço.");
  if (!(s.preco > 0)) throw new ErroApi("O preço precisa ser maior que zero.");
  if (!(s.duracaoMin >= 5)) throw new ErroApi("A duração mínima é de 5 minutos.");
}

export const servicoService = {
  listar: (opcoes: { incluirInativos?: boolean } = {}) =>
    chamadaApi(() => ler("servicos").filter((s) => opcoes.incluirInativos || s.ativo)),

  salvar: (form: ServicoForm) =>
    chamadaApi(() => {
      validarServico(form);
      const servico: Servico = {
        ...form,
        nome: form.nome.trim(),
        foto: form.foto?.trim() || FOTO_PADRAO_SERVICO,
        id: form.id ?? gerarId("srv"),
      };
      alterar("servicos", (l) =>
        form.id ? l.map((s) => (s.id === form.id ? servico : s)) : [...l, servico],
      );
      return servico;
    }),

  alternarAtivo: (id: string) =>
    chamadaApi(() => {
      let r!: Servico;
      alterar("servicos", (l) => l.map((s) => (s.id === id ? (r = { ...s, ativo: !s.ativo }) : s)));
      return r;
    }),
};

export const barbeiroService = {
  listar: (opcoes: { incluirInativos?: boolean } = {}) =>
    chamadaApi(() => ler("barbeiros").filter((b) => opcoes.incluirInativos || b.ativo)),

  salvar: (form: BarbeiroForm) =>
    chamadaApi(() => {
      if (!form.nome.trim()) throw new ErroApi("Informe o nome do barbeiro.");
      const existente = form.id ? ler("barbeiros").find((b) => b.id === form.id) : undefined;
      if (existente?.temLogin && !form.ativo) throw new ErroApi("O barbeiro administrador não pode ser desativado.");
      const barbeiro: Barbeiro = {
        ...form,
        nome: form.nome.trim(),
        id: form.id ?? gerarId("brb"),
        temLogin: existente?.temLogin ?? false,
      };
      alterar("barbeiros", (l) =>
        existente ? l.map((b) => (b.id === barbeiro.id ? barbeiro : b)) : [...l, barbeiro],
      );
      return barbeiro;
    }),

  alternarAtivo: (id: string) =>
    chamadaApi(() => {
      const b = ler("barbeiros").find((x) => x.id === id);
      if (b?.temLogin && b.ativo) throw new ErroApi("O barbeiro administrador não pode ser desativado.");
      let r!: Barbeiro;
      alterar("barbeiros", (l) => l.map((x) => (x.id === id ? (r = { ...x, ativo: !x.ativo }) : x)));
      return r;
    }),
};

export const configService = {
  obter: () => chamadaApi(() => ler("config"), { min: 50, max: 150 }),
  /** leitura síncrona para dados quase estáticos (nome, horários...) */
  obterSync: (): ConfigBarbearia => ler("config"),
  salvar: (config: ConfigBarbearia) => chamadaApi(() => (gravar("config", config), config)),
  restaurarDemonstracao: () => chamadaApi(() => restaurarDemo(true), { min: 700, max: 1000 }),
};

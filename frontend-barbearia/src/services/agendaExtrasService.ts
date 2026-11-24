// Bloqueios de horário, despesas e pagamento online simulado.
import type { Bloqueio, Despesa, MetodoPagamento } from "@/types";
import { horaParaMin, sobrepoe } from "@/lib/datas";
import { alterar, chamadaApi, ErroApi, esperar, gerarId, ler } from "./db";

export const bloqueioService = {
  listar: (f: { inicio?: string; fim?: string; barbeiroId?: string } = {}) =>
    chamadaApi(() =>
      ler("bloqueios").filter(
        (b) =>
          (!f.inicio || b.data >= f.inicio) &&
          (!f.fim || b.data <= f.fim) &&
          (!f.barbeiroId || b.barbeiroId === f.barbeiroId),
      ),
    ),

  criar: (dados: Omit<Bloqueio, "id">) =>
    chamadaApi(() => {
      const ini = horaParaMin(dados.inicio);
      const fim = horaParaMin(dados.fim);
      if (fim <= ini) throw new ErroApi("O horário final precisa ser depois do inicial.");
      const conflito = ler("agendamentos").find(
        (a) =>
          a.barbeiroId === dados.barbeiroId &&
          a.data === dados.data &&
          (a.status === "pendente" || a.status === "confirmado") &&
          sobrepoe(ini, fim, horaParaMin(a.inicio), horaParaMin(a.fim)),
      );
      if (conflito) {
        throw new ErroApi(`Já existe um agendamento às ${conflito.inicio} nesse intervalo. Remarque-o antes de bloquear.`, 409);
      }
      const novo: Bloqueio = { ...dados, id: gerarId("blq"), motivo: dados.motivo.trim() || "Horário bloqueado" };
      alterar("bloqueios", (l) => [...l, novo]);
      return novo;
    }),

  remover: (id: string) => chamadaApi(() => alterar("bloqueios", (l) => l.filter((b) => b.id !== id))),
};

export const despesaService = {
  listar: (f: { inicio?: string; fim?: string } = {}) =>
    chamadaApi(() =>
      ler("despesas")
        .filter((d) => (!f.inicio || d.data >= f.inicio) && (!f.fim || d.data <= f.fim))
        .sort((a, b) => b.data.localeCompare(a.data)),
    ),

  criar: (dados: Omit<Despesa, "id">) =>
    chamadaApi(() => {
      if (!dados.descricao.trim()) throw new ErroApi("Informe a descrição da despesa.");
      if (!(dados.valor > 0)) throw new ErroApi("O valor precisa ser maior que zero.");
      const nova: Despesa = { ...dados, id: gerarId("dsp") };
      alterar("despesas", (l) => [...l, nova]);
      return nova;
    }),

  remover: (id: string) => chamadaApi(() => alterar("despesas", (l) => l.filter((d) => d.id !== id))),
};

/** Pagamento 100% simulado: nenhum dado sai do navegador. */
export const pagamentoService = {
  gerarPix: (valor: number) =>
    chamadaApi(() => {
      const txid = Math.random().toString(36).slice(2, 12).toUpperCase();
      const v = valor.toFixed(2);
      // formato parecido com um "Pix copia e cola", apenas ilustrativo
      const codigo = `00020126580014BR.GOV.BCB.PIX0136vco-barbearia-demo@pix.com.br520400005303986540${v.length}${v}5802BR5913VCO BARBEARIA6013FLORIANOPOLIS62140510${txid}6304DEMO`;
      return { codigo, txid, expiraEmSegundos: 600 };
    }, { min: 400, max: 700 }),

  aprovar: async (metodo: Exclude<MetodoPagamento, "dinheiro">, valor: number) => {
    await esperar(metodo === "cartao" ? 1600 : 900);
    return {
      aprovado: true as const,
      metodo,
      valor,
      codigoTransacao: `TX-${Date.now().toString(36).toUpperCase()}`,
    };
  },
};

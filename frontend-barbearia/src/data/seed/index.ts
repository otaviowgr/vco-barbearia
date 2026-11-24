import { hoje } from "@/lib/datas";
import type { BancoDemo } from "@/services/db";
import {
  barbeirosSeed,
  clientesSeed,
  configSeed,
  servicosSeed,
  usuariosSeed,
} from "./catalogo";
import { gerarMovimento } from "./movimento";

export * from "./catalogo";

/** Monta o banco inicial completo da demonstração. */
export function gerarSeed(): BancoDemo {
  const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
  const config = clone(configSeed);
  const servicos = clone(servicosSeed);
  const barbeiros = clone(barbeirosSeed);
  const { agendamentos, despesas, bloqueios } = gerarMovimento(config, servicos, barbeiros, hoje());
  return {
    config,
    servicos,
    barbeiros,
    clientes: clone(clientesSeed),
    usuarios: clone(usuariosSeed),
    agendamentos,
    despesas,
    bloqueios,
    sessao: null,
  };
}

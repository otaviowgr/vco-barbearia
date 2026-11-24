// Ponto único de acesso das telas aos dados.
//
// - Sem NEXT_PUBLIC_API_URL: tudo é simulado no localStorage (modo demonstração).
// - Com NEXT_PUBLIC_API_URL (ex.: http://localhost:8080/api): os mesmos serviços
//   chamam a API REST do back-end Spring Boot + MySQL (remoto.ts).
//
// As telas não sabem (nem precisam saber) qual dos dois modos está ativo.
import * as local_agendamento from "./agendamentoService";
import * as local_auth from "./authService";
import * as local_catalogo from "./catalogoService";
import * as local_cliente from "./clienteService";
import * as local_fidelidade from "./fidelidadeService";
import * as local_financeiro from "./financeiroService";
import * as local_extras from "./agendaExtrasService";
import { garantirSeed } from "./db";
import * as remoto from "./remoto";
import { USAR_API } from "./nucleo";

export const agendamentoService = USAR_API ? remoto.agendamentoService : local_agendamento.agendamentoService;
export const authService = USAR_API ? remoto.authService : local_auth.authService;
export const servicoService = USAR_API ? remoto.servicoService : local_catalogo.servicoService;
export const barbeiroService = USAR_API ? remoto.barbeiroService : local_catalogo.barbeiroService;
export const configService = USAR_API ? remoto.configService : local_catalogo.configService;
export const clienteService = USAR_API ? remoto.clienteService : local_cliente.clienteService;
export const fidelidadeService = USAR_API ? remoto.fidelidadeService : local_fidelidade.fidelidadeService;
export const financeiroService = USAR_API ? remoto.financeiroService : local_financeiro.financeiroService;
export const bloqueioService = USAR_API ? remoto.bloqueioService : local_extras.bloqueioService;
export const despesaService = USAR_API ? remoto.despesaService : local_extras.despesaService;
export const pagamentoService = USAR_API ? remoto.pagamentoService : local_extras.pagamentoService;

/** Prepara os dados antes de abrir as telas (seed local ou configuração vinda da API). */
export async function inicializarDados() {
  if (USAR_API) await remoto.carregarConfig();
  else garantirSeed();
}

export { STATUS_ATIVOS } from "./agendamentoService";
export { CREDENCIAIS_DEMO } from "./authService";
export type { FiltroAgendamentos, NovoAgendamento, ConsultaHorarios } from "./agendamentoService";
export type { DadosCadastro } from "./authService";
export type { ServicoForm, BarbeiroForm } from "./catalogoService";
export type { ClienteResumo, FichaCliente } from "./clienteService";
export { ErroApi, EVENTO_DB, USAR_API, API_URL } from "./nucleo";

// Ponto único de acesso das telas à "API".
// Hoje tudo é simulado no localStorage; amanhã, cada serviço pode
// passar a chamar o back-end (Spring Boot) mantendo as mesmas assinaturas.
export { agendamentoService, STATUS_ATIVOS } from "./agendamentoService";
export type { FiltroAgendamentos, NovoAgendamento, ConsultaHorarios } from "./agendamentoService";
export { authService, CREDENCIAIS_DEMO } from "./authService";
export type { DadosCadastro } from "./authService";
export { servicoService, barbeiroService, configService } from "./catalogoService";
export type { ServicoForm, BarbeiroForm } from "./catalogoService";
export { clienteService } from "./clienteService";
export type { ClienteResumo, FichaCliente } from "./clienteService";
export { fidelidadeService } from "./fidelidadeService";
export { financeiroService } from "./financeiroService";
export { bloqueioService, despesaService, pagamentoService } from "./agendaExtrasService";
export { ErroApi, EVENTO_DB, garantirSeed } from "./db";

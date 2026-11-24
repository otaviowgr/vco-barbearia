package br.com.vco.barbearia.dto;

import br.com.vco.barbearia.dominio.Agendamento;
import br.com.vco.barbearia.dominio.Barbeiro;
import br.com.vco.barbearia.dominio.Bloqueio;
import br.com.vco.barbearia.dominio.Cliente;
import br.com.vco.barbearia.dominio.ConfigBarbearia;
import br.com.vco.barbearia.dominio.Despesa;
import br.com.vco.barbearia.dominio.Enums.CategoriaDespesa;
import br.com.vco.barbearia.dominio.Enums.FormaPagamento;
import br.com.vco.barbearia.dominio.Enums.MetodoPagamento;
import br.com.vco.barbearia.dominio.Enums.Perfil;
import br.com.vco.barbearia.dominio.Enums.StatusAgendamento;
import br.com.vco.barbearia.dominio.Enums.StatusPagamento;
import br.com.vco.barbearia.dominio.Servico;
import br.com.vco.barbearia.dominio.ServicoAgendado;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Objetos devolvidos pela API. Os nomes dos campos são os mesmos
 * dos tipos TypeScript do front-end (src/types/index.ts).
 */
public final class Respostas {

    private Respostas() {
    }

    public record ServicoDTO(String id, String nome, String descricao, int duracaoMin, BigDecimal preco,
                             String foto, boolean ativo, boolean destaque) {
        public static ServicoDTO de(Servico s) {
            return new ServicoDTO(s.getId(), s.getNome(), s.getDescricao(), s.getDuracaoMin(), s.getPreco(),
                    s.getFoto(), s.isAtivo(), s.isDestaque());
        }
    }

    public record BarbeiroDTO(String id, String nome, String especialidade, String bio, String foto,
                              String telefone, String cor, boolean ativo, boolean temLogin) {
        public static BarbeiroDTO de(Barbeiro b) {
            return new BarbeiroDTO(b.getId(), b.getNome(), b.getEspecialidade(), b.getBio(), b.getFoto(),
                    b.getTelefone(), b.getCor(), b.isAtivo(), b.isTemLogin());
        }
    }

    public record ClienteDTO(String id, String nome, String email, String telefone, Instant criadoEm,
                             String observacoes) {
        public static ClienteDTO de(Cliente c) {
            return new ClienteDTO(c.getId(), c.getNome(), c.getEmail(), c.getTelefone(), c.getCriadoEm(),
                    c.getObservacoes());
        }
    }

    public record ServicoAgendadoDTO(String id, String nome, BigDecimal preco, int duracaoMin) {
        public static ServicoAgendadoDTO de(ServicoAgendado s) {
            return new ServicoAgendadoDTO(s.getServicoId(), s.getNome(), s.getPreco(), s.getDuracaoMin());
        }
    }

    public record AgendamentoDTO(
            String id,
            String clienteId,
            String barbeiroId,
            List<ServicoAgendadoDTO> servicos,
            LocalDate data,
            @JsonFormat(pattern = "HH:mm") LocalTime inicio,
            @JsonFormat(pattern = "HH:mm") LocalTime fim,
            int duracaoMin,
            BigDecimal valorOriginal,
            BigDecimal desconto,
            BigDecimal valorFinal,
            boolean descontoFidelidade,
            FormaPagamento formaPagamento,
            MetodoPagamento metodoPagamento,
            StatusPagamento statusPagamento,
            StatusAgendamento status,
            Perfil criadoPor,
            Instant criadoEm,
            Instant atualizadoEm,
            boolean vistoPeloBarbeiro,
            String observacao) {

        public static AgendamentoDTO de(Agendamento a) {
            return new AgendamentoDTO(
                    a.getId(),
                    a.getCliente().getId(), // só o id: não carrega o cliente do banco
                    a.getBarbeiro().getId(),
                    a.getServicos().stream().map(ServicoAgendadoDTO::de).toList(),
                    a.getData(), a.getInicio(), a.getFim(), a.getDuracaoMin(),
                    a.getValorOriginal(), a.getDesconto(), a.getValorFinal(), a.isDescontoFidelidade(),
                    a.getFormaPagamento(), a.getMetodoPagamento(), a.getStatusPagamento(), a.getStatus(),
                    a.getCriadoPor(), a.getCriadoEm(), a.getAtualizadoEm(), a.isVistoPeloBarbeiro(),
                    a.getObservacao());
        }
    }

    public record BloqueioDTO(String id, String barbeiroId, LocalDate data,
                              @JsonFormat(pattern = "HH:mm") LocalTime inicio,
                              @JsonFormat(pattern = "HH:mm") LocalTime fim,
                              String motivo) {
        public static BloqueioDTO de(Bloqueio b) {
            return new BloqueioDTO(b.getId(), b.getBarbeiro().getId(), b.getData(), b.getInicio(), b.getFim(),
                    b.getMotivo());
        }
    }

    public record DespesaDTO(String id, String descricao, CategoriaDespesa categoria, BigDecimal valor,
                             LocalDate data) {
        public static DespesaDTO de(Despesa d) {
            return new DespesaDTO(d.getId(), d.getDescricao(), d.getCategoria(), d.getValor(), d.getData());
        }
    }

    public record SessaoDTO(String usuarioId, Perfil perfil, String nome, String clienteId, String barbeiroId,
                            boolean isAdmin) {
    }

    public record HorarioDiaDTO(@JsonFormat(pattern = "HH:mm") LocalTime abre,
                                @JsonFormat(pattern = "HH:mm") LocalTime fecha) {
    }

    public record FidelidadeRegraDTO(int meta, int percentual) {
    }

    /** horarios: lista de 7 posições (0 = domingo); null = fechado. */
    public record ConfigDTO(String nome, String slogan, String sobre, String endereco, String cidade,
                            String telefone, String whatsapp, String instagram, List<HorarioDiaDTO> horarios,
                            int intervaloSlotsMin, FidelidadeRegraDTO fidelidade) {
        public static ConfigDTO de(ConfigBarbearia c) {
            List<HorarioDiaDTO> semana = new ArrayList<>();
            for (int dia = 0; dia < 7; dia++) {
                semana.add(c.horarioDoDia(dia).map(h -> new HorarioDiaDTO(h.getAbre(), h.getFecha())).orElse(null));
            }
            return new ConfigDTO(c.getNome(), c.getSlogan(), c.getSobre(), c.getEndereco(), c.getCidade(),
                    c.getTelefone(), c.getWhatsapp(), c.getInstagram(), semana, c.getIntervaloSlotsMin(),
                    new FidelidadeRegraDTO(c.getFidelidadeMeta(), c.getFidelidadePercentual()));
        }
    }

    public record SlotDTO(@JsonFormat(pattern = "HH:mm") LocalTime hora, List<String> barbeiroIds) {
    }

    public record ProgressoFidelidadeDTO(int meta, int percentual, int concluidos, int progressoCiclo, int faltam,
                                         boolean descontoDisponivel) {
    }

    public record SimulacaoDescontoDTO(BigDecimal desconto, boolean aplicado, int percentual) {
    }

    public record ClienteResumoDTO(String id, String nome, String email, String telefone, Instant criadoEm,
                                   String observacoes, BigDecimal totalGasto, int atendimentos,
                                   LocalDate ultimaVisita, AgendamentoDTO proximoAgendamento,
                                   ProgressoFidelidadeDTO fidelidade) {
    }

    public record FichaClienteDTO(String id, String nome, String email, String telefone, Instant criadoEm,
                                  String observacoes, BigDecimal totalGasto, int atendimentos,
                                  LocalDate ultimaVisita, AgendamentoDTO proximoAgendamento,
                                  ProgressoFidelidadeDTO fidelidade, List<AgendamentoDTO> historico,
                                  int faltas, int cancelamentos) {
    }

    // ---------- Financeiro ----------

    public record ServicoMaisVendidoDTO(String nome, long quantidade) {
    }

    public record ResumoFinanceiroDTO(BigDecimal faturamento, int atendimentos, BigDecimal ticketMedio,
                                      BigDecimal descontos, BigDecimal despesas, BigDecimal lucro,
                                      double taxaFaltas, ServicoMaisVendidoDTO servicoMaisVendido,
                                      Map<String, BigDecimal> porMetodo) {
    }

    public record PeriodoDTO(LocalDate inicio, LocalDate fim, String barbeiroId, MetodoPagamento metodo) {
    }

    public record ResumoComparativoDTO(ResumoFinanceiroDTO atual, ResumoFinanceiroDTO anterior,
                                       PeriodoDTO periodoAnterior) {
    }

    public record PontoSerieDTO(String rotulo, BigDecimal valor, BigDecimal anterior) {
    }

    public record RankingBarbeiroDTO(String barbeiroId, String nome, String cor, BigDecimal faturamento,
                                     int atendimentos) {
    }

    // ---------- Pagamento simulado ----------

    public record PixDTO(String codigo, String txid, int expiraEmSegundos) {
    }

    public record PagamentoAprovadoDTO(boolean aprovado, MetodoPagamento metodo, BigDecimal valor,
                                       String codigoTransacao) {
    }

    public record ErroDTO(int status, String erro, String mensagem) {
    }
}

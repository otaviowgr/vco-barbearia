package br.com.vco.barbearia.dto;

import br.com.vco.barbearia.dominio.Enums.CategoriaDespesa;
import br.com.vco.barbearia.dominio.Enums.FormaPagamento;
import br.com.vco.barbearia.dominio.Enums.MetodoPagamento;
import br.com.vco.barbearia.dominio.Enums.Perfil;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/** Corpos (JSON) recebidos pela API, já com as regras de validação. */
public final class Requisicoes {

    private Requisicoes() {
    }

    public record LoginRequest(@NotBlank(message = "Informe o e-mail.") String email,
                               @NotBlank(message = "Informe a senha.") String senha) {
    }

    public record CadastroRequest(@NotBlank(message = "Informe o nome.") String nome,
                                  @NotBlank(message = "Informe o e-mail.") @Email(message = "E-mail inválido.") String email,
                                  String telefone,
                                  @NotBlank @Size(min = 6, message = "A senha precisa ter pelo menos 6 caracteres.") String senha) {
    }

    public record NovoAgendamentoRequest(
            @NotBlank(message = "Informe o cliente.") String clienteId,
            /* null = qualquer barbeiro disponível */
            String barbeiroId,
            @NotEmpty(message = "Escolha pelo menos um serviço.") List<String> servicoIds,
            @NotNull(message = "Informe a data.") LocalDate data,
            @NotNull(message = "Informe o horário.") @JsonFormat(pattern = "HH:mm") LocalTime inicio,
            @NotNull FormaPagamento formaPagamento,
            MetodoPagamento metodoPagamento,
            boolean pagamentoAprovado,
            @NotNull Perfil criadoPor,
            String observacao) {
    }

    public record ConcluirRequest(MetodoPagamento metodo) {
    }

    public record RemarcarRequest(@NotNull LocalDate data,
                                  @NotNull @JsonFormat(pattern = "HH:mm") LocalTime inicio,
                                  String barbeiroId,
                                  @NotNull Perfil por) {
    }

    public record CancelarRequest(@NotNull Perfil por, String motivo) {
    }

    public record IdsRequest(@NotNull List<String> ids) {
    }

    public record ServicoRequest(@NotBlank(message = "Informe o nome do serviço.") String nome,
                                 String descricao,
                                 @Min(value = 5, message = "A duração mínima é de 5 minutos.") int duracaoMin,
                                 @NotNull @Positive(message = "O preço precisa ser maior que zero.") BigDecimal preco,
                                 String foto,
                                 boolean ativo,
                                 boolean destaque) {
    }

    public record BarbeiroRequest(@NotBlank(message = "Informe o nome do barbeiro.") String nome,
                                  String especialidade, String bio, String foto, String telefone, String cor,
                                  boolean ativo) {
    }

    public record ClienteRequest(@NotBlank(message = "Informe o nome do cliente.") String nome,
                                 String telefone, String email) {
    }

    public record AtualizarClienteRequest(String nome, String telefone, String email, String observacoes) {
    }

    public record BloqueioRequest(@NotBlank String barbeiroId,
                                  @NotNull LocalDate data,
                                  @NotNull @JsonFormat(pattern = "HH:mm") LocalTime inicio,
                                  @NotNull @JsonFormat(pattern = "HH:mm") LocalTime fim,
                                  String motivo) {
    }

    public record DespesaRequest(@NotBlank(message = "Informe a descrição da despesa.") String descricao,
                                 @NotNull CategoriaDespesa categoria,
                                 @NotNull @Positive(message = "O valor precisa ser maior que zero.") BigDecimal valor,
                                 @NotNull LocalDate data) {
    }

    public record HorarioDiaRequest(@JsonFormat(pattern = "HH:mm") LocalTime abre,
                                    @JsonFormat(pattern = "HH:mm") LocalTime fecha) {
    }

    public record FidelidadeRequest(@Min(1) @Max(50) int meta, @Min(1) @Max(100) int percentual) {
    }

    public record ConfigRequest(@NotBlank String nome, String slogan, String sobre, String endereco, String cidade,
                                String telefone, String whatsapp, String instagram,
                                @NotNull @Size(min = 7, max = 7) List<HorarioDiaRequest> horarios,
                                @Min(5) int intervaloSlotsMin,
                                @NotNull @Valid FidelidadeRequest fidelidade) {
    }

    public record PixRequest(@NotNull @Positive BigDecimal valor) {
    }

    public record AprovarPagamentoRequest(@NotNull MetodoPagamento metodo, @NotNull BigDecimal valor) {
    }
}

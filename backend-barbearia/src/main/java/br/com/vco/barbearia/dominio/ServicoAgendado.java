package br.com.vco.barbearia.dominio;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.math.BigDecimal;

/**
 * Cópia dos dados do serviço no momento do agendamento.
 * Se o preço do serviço mudar depois, o histórico continua correto.
 */
@Embeddable
public class ServicoAgendado {

    @Column(name = "servico_id", nullable = false, length = 40)
    private String servicoId;

    @Column(nullable = false, length = 80)
    private String nome;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal preco;

    @Column(name = "duracao_min", nullable = false)
    private int duracaoMin;

    protected ServicoAgendado() {
    }

    public ServicoAgendado(String servicoId, String nome, BigDecimal preco, int duracaoMin) {
        this.servicoId = servicoId;
        this.nome = nome;
        this.preco = preco;
        this.duracaoMin = duracaoMin;
    }

    public static ServicoAgendado de(Servico s) {
        return new ServicoAgendado(s.getId(), s.getNome(), s.getPreco(), s.getDuracaoMin());
    }

    public String getServicoId() { return servicoId; }
    public String getNome() { return nome; }
    public BigDecimal getPreco() { return preco; }
    public int getDuracaoMin() { return duracaoMin; }
}

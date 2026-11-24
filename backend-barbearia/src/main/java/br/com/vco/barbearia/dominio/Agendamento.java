package br.com.vco.barbearia.dominio;

import br.com.vco.barbearia.dominio.Enums.FormaPagamento;
import br.com.vco.barbearia.dominio.Enums.MetodoPagamento;
import br.com.vco.barbearia.dominio.Enums.Perfil;
import br.com.vco.barbearia.dominio.Enums.StatusAgendamento;
import br.com.vco.barbearia.dominio.Enums.StatusPagamento;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import org.hibernate.annotations.BatchSize;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "agendamento", indexes = {
        @Index(name = "idx_agendamento_data", columnList = "data"),
        @Index(name = "idx_agendamento_barbeiro_data", columnList = "barbeiro_id, data"),
        @Index(name = "idx_agendamento_cliente", columnList = "cliente_id")
})
public class Agendamento {

    @Id
    @Column(length = 40)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "barbeiro_id", nullable = false)
    private Barbeiro barbeiro;

    @ElementCollection
    @CollectionTable(name = "agendamento_servico", joinColumns = @JoinColumn(name = "agendamento_id"))
    @OrderColumn(name = "ordem")
    @BatchSize(size = 1000)
    private List<ServicoAgendado> servicos = new ArrayList<>();

    @Column(nullable = false)
    private LocalDate data;

    @Column(nullable = false)
    private LocalTime inicio;

    @Column(nullable = false)
    private LocalTime fim;

    @Column(name = "duracao_min", nullable = false)
    private int duracaoMin;

    @Column(name = "valor_original", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorOriginal;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal desconto = BigDecimal.ZERO;

    @Column(name = "valor_final", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorFinal;

    @Column(name = "desconto_fidelidade")
    private boolean descontoFidelidade;

    @Enumerated(EnumType.STRING)
    @Column(name = "forma_pagamento", nullable = false, length = 20)
    private FormaPagamento formaPagamento;

    @Enumerated(EnumType.STRING)
    @Column(name = "metodo_pagamento", length = 20)
    private MetodoPagamento metodoPagamento;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_pagamento", nullable = false, length = 20)
    private StatusPagamento statusPagamento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusAgendamento status;

    @Enumerated(EnumType.STRING)
    @Column(name = "criado_por", nullable = false, length = 20)
    private Perfil criadoPor;

    @Column(name = "criado_em", nullable = false)
    private Instant criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private Instant atualizadoEm;

    /** false enquanto o barbeiro ainda não viu (destaque "Novo"). */
    @Column(name = "visto_pelo_barbeiro")
    private boolean vistoPeloBarbeiro;

    @Column(length = 500)
    private String observacao;

    protected Agendamento() {
    }

    public Agendamento(String id, Cliente cliente, Barbeiro barbeiro, List<ServicoAgendado> servicos,
                       LocalDate data, LocalTime inicio) {
        this.id = id;
        this.cliente = cliente;
        this.barbeiro = barbeiro;
        this.servicos = new ArrayList<>(servicos);
        this.data = data;
        this.inicio = inicio;
        this.duracaoMin = servicos.stream().mapToInt(ServicoAgendado::getDuracaoMin).sum();
        this.fim = inicio.plusMinutes(duracaoMin);
        this.valorOriginal = servicos.stream().map(ServicoAgendado::getPreco).reduce(BigDecimal.ZERO, BigDecimal::add);
        this.valorFinal = valorOriginal;
        this.status = StatusAgendamento.PENDENTE;
        this.statusPagamento = StatusPagamento.PENDENTE;
        this.formaPagamento = FormaPagamento.NA_BARBEARIA;
        this.criadoPor = Perfil.CLIENTE;
        this.criadoEm = Instant.now();
        this.atualizadoEm = criadoEm;
    }

    /** Aplica (ou remove) o desconto de fidelidade e recalcula o valor final. */
    public void aplicarDesconto(BigDecimal valor, boolean fidelidade) {
        this.desconto = valor;
        this.descontoFidelidade = fidelidade;
        this.valorFinal = valorOriginal.subtract(valor);
    }

    /** Move o agendamento para outra data/hora/barbeiro mantendo a duração. */
    public void mover(LocalDate novaData, LocalTime novoInicio, Barbeiro novoBarbeiro) {
        this.data = novaData;
        this.inicio = novoInicio;
        this.fim = novoInicio.plusMinutes(duracaoMin);
        this.barbeiro = novoBarbeiro;
    }

    public void tocar() {
        this.atualizadoEm = Instant.now();
    }

    public String getId() { return id; }
    public Cliente getCliente() { return cliente; }
    public Barbeiro getBarbeiro() { return barbeiro; }
    public List<ServicoAgendado> getServicos() { return servicos; }
    public LocalDate getData() { return data; }
    public LocalTime getInicio() { return inicio; }
    public LocalTime getFim() { return fim; }
    public int getDuracaoMin() { return duracaoMin; }
    public BigDecimal getValorOriginal() { return valorOriginal; }
    public BigDecimal getDesconto() { return desconto; }
    public BigDecimal getValorFinal() { return valorFinal; }
    public boolean isDescontoFidelidade() { return descontoFidelidade; }
    public FormaPagamento getFormaPagamento() { return formaPagamento; }
    public void setFormaPagamento(FormaPagamento formaPagamento) { this.formaPagamento = formaPagamento; }
    public MetodoPagamento getMetodoPagamento() { return metodoPagamento; }
    public void setMetodoPagamento(MetodoPagamento metodoPagamento) { this.metodoPagamento = metodoPagamento; }
    public StatusPagamento getStatusPagamento() { return statusPagamento; }
    public void setStatusPagamento(StatusPagamento statusPagamento) { this.statusPagamento = statusPagamento; }
    public StatusAgendamento getStatus() { return status; }
    public void setStatus(StatusAgendamento status) { this.status = status; }
    public Perfil getCriadoPor() { return criadoPor; }
    public void setCriadoPor(Perfil criadoPor) { this.criadoPor = criadoPor; }
    public Instant getCriadoEm() { return criadoEm; }
    public void setCriadoEm(Instant criadoEm) { this.criadoEm = criadoEm; this.atualizadoEm = criadoEm; }
    public Instant getAtualizadoEm() { return atualizadoEm; }
    public boolean isVistoPeloBarbeiro() { return vistoPeloBarbeiro; }
    public void setVistoPeloBarbeiro(boolean vistoPeloBarbeiro) { this.vistoPeloBarbeiro = vistoPeloBarbeiro; }
    public String getObservacao() { return observacao; }
    public void setObservacao(String observacao) { this.observacao = observacao; }
}

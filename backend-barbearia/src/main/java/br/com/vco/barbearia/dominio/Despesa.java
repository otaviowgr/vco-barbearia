package br.com.vco.barbearia.dominio;

import br.com.vco.barbearia.dominio.Enums.CategoriaDespesa;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "despesa")
public class Despesa {

    @Id
    @Column(length = 40)
    private String id;

    @Column(nullable = false, length = 160)
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CategoriaDespesa categoria;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;

    @Column(nullable = false)
    private LocalDate data;

    protected Despesa() {
    }

    public Despesa(String id, String descricao, CategoriaDespesa categoria, BigDecimal valor, LocalDate data) {
        this.id = id;
        this.descricao = descricao;
        this.categoria = categoria;
        this.valor = valor;
        this.data = data;
    }

    public String getId() { return id; }
    public String getDescricao() { return descricao; }
    public CategoriaDespesa getCategoria() { return categoria; }
    public BigDecimal getValor() { return valor; }
    public LocalDate getData() { return data; }
}

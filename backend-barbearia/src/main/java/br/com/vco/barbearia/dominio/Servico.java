package br.com.vco.barbearia.dominio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

/** Serviço oferecido pela barbearia (corte, barba...). */
@Entity
@Table(name = "servico")
public class Servico {

    @Id
    @Column(length = 40)
    private String id;

    @Column(nullable = false, length = 80)
    private String nome;

    @Column(length = 500)
    private String descricao;

    @Column(name = "duracao_min", nullable = false)
    private int duracaoMin;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal preco;

    @Column(length = 500)
    private String foto;

    private boolean ativo = true;

    private boolean destaque;

    protected Servico() {
    }

    public Servico(String id, String nome, String descricao, int duracaoMin, BigDecimal preco,
                   String foto, boolean ativo, boolean destaque) {
        this.id = id;
        this.nome = nome;
        this.descricao = descricao;
        this.duracaoMin = duracaoMin;
        this.preco = preco;
        this.foto = foto;
        this.ativo = ativo;
        this.destaque = destaque;
    }

    public String getId() { return id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public int getDuracaoMin() { return duracaoMin; }
    public void setDuracaoMin(int duracaoMin) { this.duracaoMin = duracaoMin; }
    public BigDecimal getPreco() { return preco; }
    public void setPreco(BigDecimal preco) { this.preco = preco; }
    public String getFoto() { return foto; }
    public void setFoto(String foto) { this.foto = foto; }
    public boolean isAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }
    public boolean isDestaque() { return destaque; }
    public void setDestaque(boolean destaque) { this.destaque = destaque; }
}

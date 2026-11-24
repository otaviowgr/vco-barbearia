package br.com.vco.barbearia.dominio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "cliente")
public class Cliente {

    @Id
    @Column(length = 40)
    private String id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(length = 160)
    private String email;

    @Column(length = 20)
    private String telefone;

    @Column(name = "criado_em", nullable = false)
    private Instant criadoEm;

    @Column(length = 1000)
    private String observacoes;

    protected Cliente() {
    }

    public Cliente(String id, String nome, String email, String telefone, Instant criadoEm) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.telefone = telefone;
        this.criadoEm = criadoEm;
    }

    public String getId() { return id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getTelefone() { return telefone; }
    public void setTelefone(String telefone) { this.telefone = telefone; }
    public Instant getCriadoEm() { return criadoEm; }
    public String getObservacoes() { return observacoes; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }
}

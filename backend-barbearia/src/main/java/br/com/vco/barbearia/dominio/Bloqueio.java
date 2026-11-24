package br.com.vco.barbearia.dominio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalTime;

/** Intervalo em que o barbeiro não atende (almoço, folga...). */
@Entity
@Table(name = "bloqueio")
public class Bloqueio {

    @Id
    @Column(length = 40)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "barbeiro_id", nullable = false)
    private Barbeiro barbeiro;

    @Column(nullable = false)
    private LocalDate data;

    @Column(nullable = false)
    private LocalTime inicio;

    @Column(nullable = false)
    private LocalTime fim;

    @Column(length = 120)
    private String motivo;

    protected Bloqueio() {
    }

    public Bloqueio(String id, Barbeiro barbeiro, LocalDate data, LocalTime inicio, LocalTime fim, String motivo) {
        this.id = id;
        this.barbeiro = barbeiro;
        this.data = data;
        this.inicio = inicio;
        this.fim = fim;
        this.motivo = motivo;
    }

    public String getId() { return id; }
    public Barbeiro getBarbeiro() { return barbeiro; }
    public LocalDate getData() { return data; }
    public LocalTime getInicio() { return inicio; }
    public LocalTime getFim() { return fim; }
    public String getMotivo() { return motivo; }
}

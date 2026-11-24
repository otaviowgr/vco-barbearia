package br.com.vco.barbearia.dominio;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** Configurações gerais (existe uma única linha, id = 1). */
@Entity
@Table(name = "config_barbearia")
public class ConfigBarbearia {

    public static final long ID_UNICO = 1L;

    @Id
    private Long id = ID_UNICO;

    @Column(nullable = false, length = 80)
    private String nome;

    @Column(length = 160)
    private String slogan;

    @Column(length = 1000)
    private String sobre;

    @Column(length = 160)
    private String endereco;

    @Column(length = 80)
    private String cidade;

    @Column(length = 20)
    private String telefone;

    /** Só dígitos com DDI, ex.: 5548999991234. */
    @Column(length = 20)
    private String whatsapp;

    @Column(length = 60)
    private String instagram;

    /** Apenas os dias em que a barbearia abre. */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "config_horario", joinColumns = @JoinColumn(name = "config_id"))
    private List<Horario> horarios = new ArrayList<>();

    @Column(name = "intervalo_slots_min")
    private int intervaloSlotsMin = 30;

    @Column(name = "fidelidade_meta")
    private int fidelidadeMeta = 5;

    @Column(name = "fidelidade_percentual")
    private int fidelidadePercentual = 20;

    public ConfigBarbearia() {
    }

    /** Horário do dia da semana (0 = domingo ... 6 = sábado), vazio se fechado. */
    public Optional<Horario> horarioDoDia(int diaSemana) {
        return horarios.stream().filter(h -> h.getDiaSemana() == diaSemana).findFirst();
    }

    @Embeddable
    public static class Horario {
        @Column(name = "dia_semana", nullable = false)
        private int diaSemana;
        @Column(nullable = false)
        private LocalTime abre;
        @Column(nullable = false)
        private LocalTime fecha;

        protected Horario() {
        }

        public Horario(int diaSemana, LocalTime abre, LocalTime fecha) {
            this.diaSemana = diaSemana;
            this.abre = abre;
            this.fecha = fecha;
        }

        public int getDiaSemana() { return diaSemana; }
        public LocalTime getAbre() { return abre; }
        public LocalTime getFecha() { return fecha; }
    }

    public Long getId() { return id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getSlogan() { return slogan; }
    public void setSlogan(String slogan) { this.slogan = slogan; }
    public String getSobre() { return sobre; }
    public void setSobre(String sobre) { this.sobre = sobre; }
    public String getEndereco() { return endereco; }
    public void setEndereco(String endereco) { this.endereco = endereco; }
    public String getCidade() { return cidade; }
    public void setCidade(String cidade) { this.cidade = cidade; }
    public String getTelefone() { return telefone; }
    public void setTelefone(String telefone) { this.telefone = telefone; }
    public String getWhatsapp() { return whatsapp; }
    public void setWhatsapp(String whatsapp) { this.whatsapp = whatsapp; }
    public String getInstagram() { return instagram; }
    public void setInstagram(String instagram) { this.instagram = instagram; }
    public List<Horario> getHorarios() { return horarios; }
    public void setHorarios(List<Horario> horarios) { this.horarios.clear(); this.horarios.addAll(horarios); }
    public int getIntervaloSlotsMin() { return intervaloSlotsMin; }
    public void setIntervaloSlotsMin(int intervaloSlotsMin) { this.intervaloSlotsMin = intervaloSlotsMin; }
    public int getFidelidadeMeta() { return fidelidadeMeta; }
    public void setFidelidadeMeta(int fidelidadeMeta) { this.fidelidadeMeta = fidelidadeMeta; }
    public int getFidelidadePercentual() { return fidelidadePercentual; }
    public void setFidelidadePercentual(int fidelidadePercentual) { this.fidelidadePercentual = fidelidadePercentual; }
}

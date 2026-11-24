package br.com.vco.barbearia.dominio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "barbeiro")
public class Barbeiro {

    @Id
    @Column(length = 40)
    private String id;

    @Column(nullable = false, length = 80)
    private String nome;

    @Column(length = 120)
    private String especialidade;

    @Column(length = 500)
    private String bio;

    @Column(length = 500)
    private String foto;

    @Column(length = 20)
    private String telefone;

    /** Cor de identificação na agenda (hex). */
    @Column(length = 9)
    private String cor;

    private boolean ativo = true;

    /** Tem usuário para entrar no sistema (o dono/admin). */
    @Column(name = "tem_login")
    private boolean temLogin;

    protected Barbeiro() {
    }

    public Barbeiro(String id, String nome, String especialidade, String bio, String foto,
                    String telefone, String cor, boolean ativo, boolean temLogin) {
        this.id = id;
        this.nome = nome;
        this.especialidade = especialidade;
        this.bio = bio;
        this.foto = foto;
        this.telefone = telefone;
        this.cor = cor;
        this.ativo = ativo;
        this.temLogin = temLogin;
    }

    public String getId() { return id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getEspecialidade() { return especialidade; }
    public void setEspecialidade(String especialidade) { this.especialidade = especialidade; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getFoto() { return foto; }
    public void setFoto(String foto) { this.foto = foto; }
    public String getTelefone() { return telefone; }
    public void setTelefone(String telefone) { this.telefone = telefone; }
    public String getCor() { return cor; }
    public void setCor(String cor) { this.cor = cor; }
    public boolean isAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }
    public boolean isTemLogin() { return temLogin; }
}

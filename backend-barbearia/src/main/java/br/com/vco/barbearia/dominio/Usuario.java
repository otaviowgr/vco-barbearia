package br.com.vco.barbearia.dominio;

import br.com.vco.barbearia.dominio.Enums.Perfil;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** Conta de acesso. Um usuário é um cliente OU um barbeiro. */
@Entity
@Table(name = "usuario")
public class Usuario {

    @Id
    @Column(length = 40)
    private String id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(nullable = false, unique = true, length = 160)
    private String email;

    /** Hash BCrypt da senha (nunca a senha em texto puro). */
    @Column(name = "senha_hash", nullable = false, length = 100)
    private String senhaHash;

    @Column(length = 20)
    private String telefone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Perfil perfil;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "barbeiro_id")
    private Barbeiro barbeiro;

    private boolean admin;

    protected Usuario() {
    }

    public Usuario(String id, String nome, String email, String senhaHash, String telefone, Perfil perfil,
                   Cliente cliente, Barbeiro barbeiro, boolean admin) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.senhaHash = senhaHash;
        this.telefone = telefone;
        this.perfil = perfil;
        this.cliente = cliente;
        this.barbeiro = barbeiro;
        this.admin = admin;
    }

    public String getId() { return id; }
    public String getNome() { return nome; }
    public String getEmail() { return email; }
    public String getSenhaHash() { return senhaHash; }
    public String getTelefone() { return telefone; }
    public Perfil getPerfil() { return perfil; }
    public Cliente getCliente() { return cliente; }
    public Barbeiro getBarbeiro() { return barbeiro; }
    public boolean isAdmin() { return admin; }
}

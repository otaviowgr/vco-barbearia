package br.com.vco.barbearia.negocio;

import br.com.vco.barbearia.config.ApiException;
import br.com.vco.barbearia.dominio.Cliente;
import br.com.vco.barbearia.dominio.Enums.Perfil;
import br.com.vco.barbearia.dominio.Usuario;
import br.com.vco.barbearia.dto.Requisicoes.CadastroRequest;
import br.com.vco.barbearia.dto.Respostas.SessaoDTO;
import br.com.vco.barbearia.repositorio.ClienteRepository;
import br.com.vco.barbearia.repositorio.UsuarioRepository;
import br.com.vco.barbearia.util.Util;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Login e cadastro. Protótipo: devolve os dados da sessão, sem token.
 * Próximo passo para produção: Spring Security + JWT protegendo as rotas.
 */
@Service
public class AuthService {

    public static final String EMAIL_CLIENTE_DEMO = "cliente@demo.com";
    public static final String EMAIL_BARBEIRO_DEMO = "barbeiro@demo.com";
    public static final String SENHA_DEMO = "123456";

    private final UsuarioRepository usuarios;
    private final ClienteRepository clientes;
    private final PasswordEncoder encoder;

    public AuthService(UsuarioRepository usuarios, ClienteRepository clientes, PasswordEncoder encoder) {
        this.usuarios = usuarios;
        this.clientes = clientes;
        this.encoder = encoder;
    }

    @Transactional(readOnly = true)
    public SessaoDTO login(String email, String senha) {
        Usuario u = usuarios.findByEmailIgnoreCase(email.trim())
                .filter(x -> encoder.matches(senha, x.getSenhaHash()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos."));
        return sessao(u);
    }

    @Transactional(readOnly = true)
    public SessaoDTO loginDemo(Perfil perfil) {
        return login(perfil == Perfil.CLIENTE ? EMAIL_CLIENTE_DEMO : EMAIL_BARBEIRO_DEMO, SENHA_DEMO);
    }

    @Transactional
    public SessaoDTO cadastrarCliente(CadastroRequest r) {
        String email = r.email().trim().toLowerCase();
        if (usuarios.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflito("Já existe uma conta com esse e-mail.");
        }
        String telefone = Telefone.formatar(r.telefone());
        Cliente c = clientes.save(new Cliente(Util.gerarId("cli"), r.nome().trim(), email, telefone, Instant.now()));
        Usuario u = usuarios.save(new Usuario(Util.gerarId("usr"), r.nome().trim(), email, encoder.encode(r.senha()),
                telefone, Perfil.CLIENTE, c, null, false));
        return sessao(u);
    }

    private static SessaoDTO sessao(Usuario u) {
        return new SessaoDTO(u.getId(), u.getPerfil(), u.getNome(),
                u.getCliente() != null ? u.getCliente().getId() : null,
                u.getBarbeiro() != null ? u.getBarbeiro().getId() : null,
                u.isAdmin());
    }
}

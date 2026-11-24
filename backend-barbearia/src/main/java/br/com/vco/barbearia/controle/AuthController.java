package br.com.vco.barbearia.controle;

import br.com.vco.barbearia.dominio.Enums.Perfil;
import br.com.vco.barbearia.dto.Requisicoes.CadastroRequest;
import br.com.vco.barbearia.dto.Requisicoes.LoginRequest;
import br.com.vco.barbearia.dto.Respostas.SessaoDTO;
import br.com.vco.barbearia.negocio.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticação")
public class AuthController {

    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

    @PostMapping("/login")
    public SessaoDTO login(@Valid @RequestBody LoginRequest r) {
        return service.login(r.email(), r.senha());
    }

    @PostMapping("/demo/{perfil}")
    @Operation(summary = "Login de demonstração: perfil = cliente ou barbeiro")
    public SessaoDTO loginDemo(@PathVariable Perfil perfil) {
        return service.loginDemo(perfil);
    }

    @PostMapping("/cadastro")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Cadastro de novo cliente (já devolve a sessão)")
    public SessaoDTO cadastro(@Valid @RequestBody CadastroRequest r) {
        return service.cadastrarCliente(r);
    }
}

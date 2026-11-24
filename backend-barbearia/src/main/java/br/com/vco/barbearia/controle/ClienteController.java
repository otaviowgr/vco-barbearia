package br.com.vco.barbearia.controle;

import br.com.vco.barbearia.dto.Requisicoes.AtualizarClienteRequest;
import br.com.vco.barbearia.dto.Requisicoes.ClienteRequest;
import br.com.vco.barbearia.dto.Respostas.ClienteDTO;
import br.com.vco.barbearia.dto.Respostas.ClienteResumoDTO;
import br.com.vco.barbearia.dto.Respostas.FichaClienteDTO;
import br.com.vco.barbearia.dto.Respostas.ProgressoFidelidadeDTO;
import br.com.vco.barbearia.dto.Respostas.SimulacaoDescontoDTO;
import br.com.vco.barbearia.negocio.ClienteService;
import br.com.vco.barbearia.negocio.FidelidadeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api")
public class ClienteController {

    private final ClienteService service;
    private final FidelidadeService fidelidade;

    public ClienteController(ClienteService service, FidelidadeService fidelidade) {
        this.service = service;
        this.fidelidade = fidelidade;
    }

    @Tag(name = "Clientes")
    @GetMapping("/clientes")
    @Operation(summary = "Lista clientes com total gasto, atendimentos e fidelidade (busca por nome, e-mail ou telefone)")
    public List<ClienteResumoDTO> listar(@RequestParam(defaultValue = "") String busca) {
        return service.listar(busca);
    }

    @Tag(name = "Clientes")
    @GetMapping("/clientes/basico")
    @Operation(summary = "Lista simples (sem estatísticas), para selects")
    public List<ClienteDTO> listarBasico() {
        return service.listarBasico().stream().map(ClienteDTO::de).toList();
    }

    @Tag(name = "Clientes")
    @GetMapping("/clientes/{id}/ficha")
    public FichaClienteDTO ficha(@PathVariable String id) {
        return service.ficha(id);
    }

    @Tag(name = "Clientes")
    @PostMapping("/clientes")
    @ResponseStatus(HttpStatus.CREATED)
    public ClienteDTO criar(@Valid @RequestBody ClienteRequest r) {
        return ClienteDTO.de(service.criar(r));
    }

    @Tag(name = "Clientes")
    @PutMapping("/clientes/{id}")
    public ClienteDTO atualizar(@PathVariable String id, @RequestBody AtualizarClienteRequest r) {
        return ClienteDTO.de(service.atualizar(id, r));
    }

    // ---------- Fidelidade ----------

    @Tag(name = "Fidelidade")
    @GetMapping("/fidelidade/{clienteId}")
    public ProgressoFidelidadeDTO progresso(@PathVariable String clienteId) {
        return fidelidade.progresso(clienteId);
    }

    @Tag(name = "Fidelidade")
    @GetMapping("/fidelidade/{clienteId}/simular")
    @Operation(summary = "Quanto de desconto o cliente teria sobre o valor informado")
    public SimulacaoDescontoDTO simular(@PathVariable String clienteId, @RequestParam BigDecimal valor) {
        return fidelidade.simular(clienteId, valor);
    }
}

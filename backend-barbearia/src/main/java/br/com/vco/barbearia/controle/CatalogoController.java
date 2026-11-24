package br.com.vco.barbearia.controle;

import br.com.vco.barbearia.dto.Requisicoes.BarbeiroRequest;
import br.com.vco.barbearia.dto.Requisicoes.ServicoRequest;
import br.com.vco.barbearia.dto.Respostas.BarbeiroDTO;
import br.com.vco.barbearia.dto.Respostas.ServicoDTO;
import br.com.vco.barbearia.negocio.CatalogoService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Serviços (cortes, barba...) e barbeiros. */
@RestController
@RequestMapping("/api")
public class CatalogoController {

    private final CatalogoService service;

    public CatalogoController(CatalogoService service) {
        this.service = service;
    }

    // ---------- Serviços ----------

    @Tag(name = "Serviços")
    @GetMapping("/servicos")
    public List<ServicoDTO> listarServicos(@RequestParam(defaultValue = "false") boolean incluirInativos) {
        return service.listarServicos(incluirInativos).stream().map(ServicoDTO::de).toList();
    }

    @Tag(name = "Serviços")
    @PostMapping("/servicos")
    @ResponseStatus(HttpStatus.CREATED)
    public ServicoDTO criarServico(@Valid @RequestBody ServicoRequest r) {
        return ServicoDTO.de(service.criarServico(r));
    }

    @Tag(name = "Serviços")
    @PutMapping("/servicos/{id}")
    public ServicoDTO atualizarServico(@PathVariable String id, @Valid @RequestBody ServicoRequest r) {
        return ServicoDTO.de(service.atualizarServico(id, r));
    }

    @Tag(name = "Serviços")
    @PatchMapping("/servicos/{id}/alternar-ativo")
    public ServicoDTO alternarServico(@PathVariable String id) {
        return ServicoDTO.de(service.alternarServico(id));
    }

    // ---------- Barbeiros ----------

    @Tag(name = "Barbeiros")
    @GetMapping("/barbeiros")
    public List<BarbeiroDTO> listarBarbeiros(@RequestParam(defaultValue = "false") boolean incluirInativos) {
        return service.listarBarbeiros(incluirInativos).stream().map(BarbeiroDTO::de).toList();
    }

    @Tag(name = "Barbeiros")
    @PostMapping("/barbeiros")
    @ResponseStatus(HttpStatus.CREATED)
    public BarbeiroDTO criarBarbeiro(@Valid @RequestBody BarbeiroRequest r) {
        return BarbeiroDTO.de(service.criarBarbeiro(r));
    }

    @Tag(name = "Barbeiros")
    @PutMapping("/barbeiros/{id}")
    public BarbeiroDTO atualizarBarbeiro(@PathVariable String id, @Valid @RequestBody BarbeiroRequest r) {
        return BarbeiroDTO.de(service.atualizarBarbeiro(id, r));
    }

    @Tag(name = "Barbeiros")
    @PatchMapping("/barbeiros/{id}/alternar-ativo")
    public BarbeiroDTO alternarBarbeiro(@PathVariable String id) {
        return BarbeiroDTO.de(service.alternarBarbeiro(id));
    }
}

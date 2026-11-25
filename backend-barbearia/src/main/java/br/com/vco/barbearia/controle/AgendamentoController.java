package br.com.vco.barbearia.controle;

import br.com.vco.barbearia.dominio.Enums.StatusAgendamento;
import br.com.vco.barbearia.dto.Requisicoes.CancelarRequest;
import br.com.vco.barbearia.dto.Requisicoes.ConcluirRequest;
import br.com.vco.barbearia.dto.Requisicoes.IdsRequest;
import br.com.vco.barbearia.dto.Requisicoes.NovoAgendamentoRequest;
import br.com.vco.barbearia.dto.Requisicoes.RemarcarRequest;
import br.com.vco.barbearia.dto.Respostas.AgendamentoDTO;
import br.com.vco.barbearia.dto.Respostas.SlotDTO;
import br.com.vco.barbearia.negocio.AgendamentoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
//REQUISICAO
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/agendamentos")
@Tag(name = "Agendamentos")
public class AgendamentoController {

    private final AgendamentoService service;

    public AgendamentoController(AgendamentoService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Lista agendamentos com filtros opcionais (datas no formato yyyy-MM-dd)")
    public List<AgendamentoDTO> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim,
            @RequestParam(required = false) String barbeiroId,
            @RequestParam(required = false) String clienteId,
            @RequestParam(required = false) List<StatusAgendamento> status) {
        return service.listar(new AgendamentoService.Filtro(data, inicio, fim, barbeiroId, clienteId, status));
    }

    @GetMapping("/{id}")
    public AgendamentoDTO obter(@PathVariable String id) {
        return service.obter(id);
    }

    @GetMapping("/horarios-disponiveis")
    @Operation(summary = "Horários livres para a duração informada (sem barbeiroId = qualquer barbeiro)")
    public List<SlotDTO> horarios(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data,
            @RequestParam int duracaoMin,
            @RequestParam(required = false) String barbeiroId,
            @RequestParam(required = false) String ignorarAgendamentoId) {
        return service.horariosDisponiveis(data, duracaoMin, barbeiroId, ignorarAgendamentoId);
    }

    @GetMapping("/nao-vistos/contagem")
    @Operation(summary = "Quantidade de agendamentos novos que o barbeiro ainda não viu")
    public long naoVistos(@RequestParam(required = false) String barbeiroId) {
        return service.contarNaoVistos(barbeiroId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Cria um agendamento (aplica o desconto de fidelidade automaticamente)")
    public AgendamentoDTO criar(@Valid @RequestBody NovoAgendamentoRequest r) {
        return service.criar(r);
    }

    @PostMapping("/{id}/confirmar")
    public AgendamentoDTO confirmar(@PathVariable String id) {
        return service.confirmar(id);
    }

    @PostMapping("/{id}/concluir")
    @Operation(summary = "Conclui; se for pagar na barbearia, informe o método (dinheiro, pix ou cartao)")
    public AgendamentoDTO concluir(@PathVariable String id, @RequestBody(required = false) ConcluirRequest r) {
        return service.concluir(id, r == null ? null : r.metodo());
    }

    @PostMapping("/{id}/remarcar")
    public AgendamentoDTO remarcar(@PathVariable String id, @Valid @RequestBody RemarcarRequest r) {
        return service.remarcar(id, r);
    }

    @PostMapping("/{id}/cancelar")
    public AgendamentoDTO cancelar(@PathVariable String id, @Valid @RequestBody CancelarRequest r) {
        return service.cancelar(id, r.por(), r.motivo());
    }

    @PostMapping("/{id}/nao-compareceu")
    public AgendamentoDTO naoCompareceu(@PathVariable String id) {
        return service.marcarNaoCompareceu(id);
    }

    @PostMapping("/vistos")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void marcarVistos(@Valid @RequestBody IdsRequest r) {
        service.marcarComoVistos(r.ids());
    }
}

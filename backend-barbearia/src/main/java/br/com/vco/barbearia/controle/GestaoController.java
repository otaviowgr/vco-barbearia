package br.com.vco.barbearia.controle;

import br.com.vco.barbearia.demo.DemoService;
import br.com.vco.barbearia.dominio.Enums.MetodoPagamento;
import br.com.vco.barbearia.dto.Requisicoes.AprovarPagamentoRequest;
import br.com.vco.barbearia.dto.Requisicoes.BloqueioRequest;
import br.com.vco.barbearia.dto.Requisicoes.ConfigRequest;
import br.com.vco.barbearia.dto.Requisicoes.DespesaRequest;
import br.com.vco.barbearia.dto.Requisicoes.PixRequest;
import br.com.vco.barbearia.dto.Respostas.BloqueioDTO;
import br.com.vco.barbearia.dto.Respostas.ConfigDTO;
import br.com.vco.barbearia.dto.Respostas.DespesaDTO;
import br.com.vco.barbearia.dto.Respostas.PagamentoAprovadoDTO;
import br.com.vco.barbearia.dto.Respostas.PixDTO;
import br.com.vco.barbearia.dto.Respostas.PontoSerieDTO;
import br.com.vco.barbearia.dto.Respostas.RankingBarbeiroDTO;
import br.com.vco.barbearia.dto.Respostas.ResumoComparativoDTO;
import br.com.vco.barbearia.negocio.AgendaExtrasService;
import br.com.vco.barbearia.negocio.ConfigService;
import br.com.vco.barbearia.negocio.FinanceiroService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

/** Bloqueios, despesas, financeiro, pagamento simulado, configurações e demonstração. */
@RestController
@RequestMapping("/api")
public class GestaoController {

    private final AgendaExtrasService extras;
    private final FinanceiroService financeiro;
    private final ConfigService config;
    private final DemoService demo;

    public GestaoController(AgendaExtrasService extras, FinanceiroService financeiro, ConfigService config, DemoService demo) {
        this.extras = extras;
        this.financeiro = financeiro;
        this.config = config;
        this.demo = demo;
    }

    // ---------- Bloqueios ----------

    @Tag(name = "Bloqueios")
    @GetMapping("/bloqueios")
    public List<BloqueioDTO> listarBloqueios(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim,
            @RequestParam(required = false) String barbeiroId) {
        return extras.listarBloqueios(inicio, fim, barbeiroId);
    }

    @Tag(name = "Bloqueios")
    @PostMapping("/bloqueios")
    @ResponseStatus(HttpStatus.CREATED)
    public BloqueioDTO criarBloqueio(@Valid @RequestBody BloqueioRequest r) {
        return extras.criarBloqueio(r);
    }

    @Tag(name = "Bloqueios")
    @DeleteMapping("/bloqueios/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removerBloqueio(@PathVariable String id) {
        extras.removerBloqueio(id);
    }

    // ---------- Despesas ----------

    @Tag(name = "Despesas")
    @GetMapping("/despesas")
    public List<DespesaDTO> listarDespesas(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        return extras.listarDespesas(inicio, fim).stream().map(DespesaDTO::de).toList();
    }

    @Tag(name = "Despesas")
    @PostMapping("/despesas")
    @ResponseStatus(HttpStatus.CREATED)
    public DespesaDTO criarDespesa(@Valid @RequestBody DespesaRequest r) {
        return DespesaDTO.de(extras.criarDespesa(r));
    }

    @Tag(name = "Despesas")
    @DeleteMapping("/despesas/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removerDespesa(@PathVariable String id) {
        extras.removerDespesa(id);
    }

    // ---------- Financeiro ----------

    @Tag(name = "Financeiro")
    @GetMapping("/financeiro/resumo")
    @Operation(summary = "Indicadores do período e do período anterior comparável")
    public ResumoComparativoDTO resumo(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim,
            @RequestParam(required = false) String barbeiroId,
            @RequestParam(required = false) MetodoPagamento metodo) {
        return financeiro.resumo(new FinanceiroService.Filtro(inicio, fim, barbeiroId, metodo));
    }

    @Tag(name = "Financeiro")
    @GetMapping("/financeiro/por-dia")
    @Operation(summary = "Faturamento por dia do mês (mes = yyyy-MM)")
    public List<PontoSerieDTO> porDia(@RequestParam String mes,
                                      @RequestParam(required = false) String barbeiroId,
                                      @RequestParam(required = false) MetodoPagamento metodo) {
        return financeiro.porDiaDoMes(YearMonth.parse(mes), barbeiroId, metodo);
    }

    @Tag(name = "Financeiro")
    @GetMapping("/financeiro/por-mes")
    @Operation(summary = "Faturamento por mês do ano")
    public List<PontoSerieDTO> porMes(@RequestParam int ano,
                                      @RequestParam(required = false) String barbeiroId,
                                      @RequestParam(required = false) MetodoPagamento metodo) {
        return financeiro.porMesDoAno(ano, barbeiroId, metodo);
    }

    @Tag(name = "Financeiro")
    @GetMapping("/financeiro/ranking")
    public List<RankingBarbeiroDTO> ranking(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim,
            @RequestParam(required = false) MetodoPagamento metodo) {
        return financeiro.ranking(new FinanceiroService.Filtro(inicio, fim, null, metodo));
    }

    // ---------- Pagamento simulado ----------

    @Tag(name = "Pagamentos (simulado)")
    @PostMapping("/pagamentos/pix")
    public PixDTO gerarPix(@Valid @RequestBody PixRequest r) {
        return extras.gerarPix(r.valor());
    }

    @Tag(name = "Pagamentos (simulado)")
    @PostMapping("/pagamentos/aprovar")
    public PagamentoAprovadoDTO aprovar(@Valid @RequestBody AprovarPagamentoRequest r) {
        return extras.aprovar(r.metodo(), r.valor());
    }

    // ---------- Configurações ----------

    @Tag(name = "Configurações")
    @GetMapping("/config")
    public ConfigDTO obterConfig() {
        return ConfigDTO.de(config.obter());
    }

    @Tag(name = "Configurações")
    @PutMapping("/config")
    public ConfigDTO salvarConfig(@Valid @RequestBody ConfigRequest r) {
        return ConfigDTO.de(config.salvar(r));
    }

    @Tag(name = "Configurações")
    @PostMapping("/demo/restaurar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Apaga tudo e recarrega os dados da demonstração (datas relativas a hoje)")
    public void restaurarDemo() {
        demo.restaurar();
    }
}

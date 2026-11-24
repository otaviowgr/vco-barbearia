package br.com.vco.barbearia.negocio;

import br.com.vco.barbearia.config.ApiException;
import br.com.vco.barbearia.dominio.Agendamento;
import br.com.vco.barbearia.dominio.Cliente;
import br.com.vco.barbearia.dominio.ConfigBarbearia;
import br.com.vco.barbearia.dominio.Enums.StatusAgendamento;
import br.com.vco.barbearia.dto.Requisicoes.AtualizarClienteRequest;
import br.com.vco.barbearia.dto.Requisicoes.ClienteRequest;
import br.com.vco.barbearia.dto.Respostas.AgendamentoDTO;
import br.com.vco.barbearia.dto.Respostas.ClienteResumoDTO;
import br.com.vco.barbearia.dto.Respostas.FichaClienteDTO;
import br.com.vco.barbearia.dto.Respostas.ProgressoFidelidadeDTO;
import br.com.vco.barbearia.repositorio.AgendamentoRepository;
import br.com.vco.barbearia.repositorio.ClienteRepository;
import br.com.vco.barbearia.util.Util;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ClienteService {

    private final ClienteRepository clientes;
    private final AgendamentoRepository agendamentos;
    private final FidelidadeService fidelidade;
    private final ConfigService configService;

    public ClienteService(ClienteRepository clientes, AgendamentoRepository agendamentos,
                          FidelidadeService fidelidade, ConfigService configService) {
        this.clientes = clientes;
        this.agendamentos = agendamentos;
        this.fidelidade = fidelidade;
        this.configService = configService;
    }

    @Transactional(readOnly = true)
    public List<Cliente> listarBasico() {
        return clientes.findAllByOrderByNomeAsc();
    }

    /** Lista com estatísticas, filtrando por nome, e-mail ou telefone. */
    @Transactional(readOnly = true)
    public List<ClienteResumoDTO> listar(String busca) {
        String termo = normalizar(busca == null ? "" : busca.trim());
        String digitos = busca == null ? "" : busca.replaceAll("\\D", "");
        Map<String, List<Agendamento>> porCliente = agendamentos.findAll().stream()
                .collect(Collectors.groupingBy(a -> a.getCliente().getId()));
        ConfigBarbearia config = configService.obter();

        return clientes.findAllByOrderByNomeAsc().stream()
                .filter(c -> termo.isEmpty()
                        || normalizar(c.getNome()).contains(termo)
                        || (c.getEmail() != null && c.getEmail().toLowerCase().contains(termo))
                        || (digitos.length() > 2 && c.getTelefone() != null
                        && c.getTelefone().replaceAll("\\D", "").contains(digitos)))
                .map(c -> {
                    FichaClienteDTO f = montarFicha(c, porCliente.getOrDefault(c.getId(), List.of()), config);
                    return new ClienteResumoDTO(f.id(), f.nome(), f.email(), f.telefone(), f.criadoEm(),
                            f.observacoes(), f.totalGasto(), f.atendimentos(), f.ultimaVisita(),
                            f.proximoAgendamento(), f.fidelidade());
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public FichaClienteDTO ficha(String id) {
        Cliente c = obter(id);
        return montarFicha(c, agendamentos.findByCliente_Id(id), configService.obter());
    }

    private FichaClienteDTO montarFicha(Cliente c, List<Agendamento> doCliente, ConfigBarbearia config) {
        Comparator<Agendamento> cronologico = Comparator.comparing(Agendamento::getData).thenComparing(Agendamento::getInicio);
        List<Agendamento> historico = doCliente.stream().sorted(cronologico.reversed()).toList();
        List<Agendamento> concluidos = historico.stream().filter(a -> a.getStatus() == StatusAgendamento.CONCLUIDO).toList();
        LocalDate hoje = Util.hoje();
        AgendamentoDTO proximo = doCliente.stream()
                .filter(a -> a.getStatus().emAberto() && !a.getData().isBefore(hoje))
                .min(cronologico)
                .map(AgendamentoDTO::de)
                .orElse(null);
        BigDecimal total = concluidos.stream().map(Agendamento::getValorFinal).reduce(BigDecimal.ZERO, BigDecimal::add);
        ProgressoFidelidadeDTO fid = fidelidade.calcular(doCliente, config);
        return new FichaClienteDTO(c.getId(), c.getNome(), c.getEmail(), c.getTelefone(), c.getCriadoEm(),
                c.getObservacoes(), total, concluidos.size(),
                concluidos.isEmpty() ? null : concluidos.get(0).getData(),
                proximo, fid,
                historico.stream().map(AgendamentoDTO::de).toList(),
                (int) historico.stream().filter(a -> a.getStatus() == StatusAgendamento.NAO_COMPARECEU).count(),
                (int) historico.stream().filter(a -> a.getStatus() == StatusAgendamento.CANCELADO).count());
    }

    @Transactional
    public Cliente criar(ClienteRequest r) {
        Cliente c = new Cliente(Util.gerarId("cli"), r.nome().trim(), r.email() == null ? "" : r.email().trim(),
                Telefone.formatar(r.telefone()), Instant.now());
        return clientes.save(c);
    }

    @Transactional
    public Cliente atualizar(String id, AtualizarClienteRequest r) {
        Cliente c = obter(id);
        if (r.nome() != null && !r.nome().isBlank()) c.setNome(r.nome().trim());
        if (r.telefone() != null) c.setTelefone(Telefone.formatar(r.telefone()));
        if (r.email() != null) c.setEmail(r.email().trim());
        if (r.observacoes() != null) c.setObservacoes(r.observacoes());
        return c;
    }

    public Cliente obter(String id) {
        return clientes.findById(id).orElseThrow(() -> ApiException.naoEncontrado("Cliente não encontrado."));
    }

    private static String normalizar(String s) {
        return Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase();
    }
}

package br.com.vco.barbearia.negocio;

import br.com.vco.barbearia.config.ApiException;
import br.com.vco.barbearia.dominio.Agendamento;
import br.com.vco.barbearia.dominio.Barbeiro;
import br.com.vco.barbearia.dominio.Bloqueio;
import br.com.vco.barbearia.dominio.Cliente;
import br.com.vco.barbearia.dominio.ConfigBarbearia;
import br.com.vco.barbearia.dominio.Enums.FormaPagamento;
import br.com.vco.barbearia.dominio.Enums.MetodoPagamento;
import br.com.vco.barbearia.dominio.Enums.Perfil;
import br.com.vco.barbearia.dominio.Enums.StatusAgendamento;
import br.com.vco.barbearia.dominio.Enums.StatusPagamento;
import br.com.vco.barbearia.dominio.Servico;
import br.com.vco.barbearia.dominio.ServicoAgendado;
import br.com.vco.barbearia.dto.Requisicoes.NovoAgendamentoRequest;
import br.com.vco.barbearia.dto.Requisicoes.RemarcarRequest;
import br.com.vco.barbearia.dto.Respostas.AgendamentoDTO;
import br.com.vco.barbearia.dto.Respostas.SimulacaoDescontoDTO;
import br.com.vco.barbearia.dto.Respostas.SlotDTO;
import br.com.vco.barbearia.repositorio.AgendamentoRepository;
import br.com.vco.barbearia.repositorio.BarbeiroRepository;
import br.com.vco.barbearia.repositorio.BloqueioRepository;
import br.com.vco.barbearia.repositorio.ClienteRepository;
import br.com.vco.barbearia.repositorio.ServicoRepository;
import br.com.vco.barbearia.util.Util;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AgendamentoService {

    private static final Set<StatusAgendamento> EM_ABERTO = EnumSet.of(StatusAgendamento.PENDENTE, StatusAgendamento.CONFIRMADO);

    private final AgendamentoRepository agendamentos;
    private final BloqueioRepository bloqueios;
    private final BarbeiroRepository barbeiros;
    private final ClienteRepository clientes;
    private final ServicoRepository servicos;
    private final ConfigService configService;
    private final FidelidadeService fidelidade;

    public AgendamentoService(AgendamentoRepository agendamentos, BloqueioRepository bloqueios,
                              BarbeiroRepository barbeiros, ClienteRepository clientes, ServicoRepository servicos,
                              ConfigService configService, FidelidadeService fidelidade) {
        this.agendamentos = agendamentos;
        this.bloqueios = bloqueios;
        this.barbeiros = barbeiros;
        this.clientes = clientes;
        this.servicos = servicos;
        this.configService = configService;
        this.fidelidade = fidelidade;
    }

    public record Filtro(LocalDate data, LocalDate inicio, LocalDate fim, String barbeiroId, String clienteId,
                         List<StatusAgendamento> status) {
    }

    // ================= Consultas =================

    @Transactional(readOnly = true)
    public List<AgendamentoDTO> listar(Filtro f) {
        Specification<Agendamento> spec = (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (f.data() != null) p.add(cb.equal(root.get("data"), f.data()));
            if (f.inicio() != null) p.add(cb.greaterThanOrEqualTo(root.get("data"), f.inicio()));
            if (f.fim() != null) p.add(cb.lessThanOrEqualTo(root.get("data"), f.fim()));
            if (f.barbeiroId() != null) p.add(cb.equal(root.get("barbeiro").get("id"), f.barbeiroId()));
            if (f.clienteId() != null) p.add(cb.equal(root.get("cliente").get("id"), f.clienteId()));
            if (f.status() != null && !f.status().isEmpty()) p.add(root.get("status").in(f.status()));
            return cb.and(p.toArray(Predicate[]::new));
        };
        return agendamentos.findAll(spec, Sort.by("data", "inicio")).stream().map(AgendamentoDTO::de).toList();
    }

    @Transactional(readOnly = true)
    public AgendamentoDTO obter(String id) {
        return AgendamentoDTO.de(buscar(id));
    }

    @Transactional(readOnly = true)
    public long contarNaoVistos(String barbeiroId) {
        return barbeiroId == null
                ? agendamentos.countByVistoPeloBarbeiroFalseAndStatusIn(EM_ABERTO)
                : agendamentos.countByVistoPeloBarbeiroFalseAndStatusInAndBarbeiro_Id(EM_ABERTO, barbeiroId);
    }

    /**
     * Horários livres para um serviço de `duracaoMin` minutos, considerando o horário
     * de funcionamento, os agendamentos e os bloqueios de cada barbeiro (sem sobreposição).
     */
    @Transactional(readOnly = true)
    public List<SlotDTO> horariosDisponiveis(LocalDate data, int duracaoMin, String barbeiroId, String ignorarId) {
        ConfigBarbearia config = configService.obter();
        var horario = config.horarioDoDia(Util.diaSemana(data));
        LocalDate hoje = Util.hoje();
        if (horario.isEmpty() || data.isBefore(hoje) || duracaoMin <= 0) return List.of();

        List<Barbeiro> candidatos = barbeiros.findByAtivoTrue().stream()
                .filter(b -> barbeiroId == null || b.getId().equals(barbeiroId))
                .sorted(Comparator.comparing(Barbeiro::getNome))
                .toList();
        List<Agendamento> doDia = agendamentos.findByData(data).stream()
                .filter(a -> a.getStatus().ocupaHorario() && !a.getId().equals(ignorarId))
                .toList();
        List<Bloqueio> bloqueiosDoDia = bloqueios.findByData(data);

        int abre = Util.minutos(horario.get().getAbre());
        int fecha = Util.minutos(horario.get().getFecha());
        int minimo = data.equals(hoje) ? Util.minutos(Util.agora()) + 15 : 0; // antecedência mínima

        List<SlotDTO> slots = new ArrayList<>();
        for (int t = abre; t + duracaoMin <= fecha; t += config.getIntervaloSlotsMin()) {
            if (t < minimo) continue;
            LocalTime ini = Util.hora(t);
            LocalTime fim = Util.hora(t + duracaoMin);
            List<String> livres = candidatos.stream()
                    .filter(b -> livre(b.getId(), ini, fim, doDia, bloqueiosDoDia))
                    .map(Barbeiro::getId)
                    .toList();
            if (!livres.isEmpty()) slots.add(new SlotDTO(ini, livres));
        }
        return slots;
    }

    private static boolean livre(String barbeiroId, LocalTime ini, LocalTime fim,
                                 List<Agendamento> doDia, List<Bloqueio> bloqueiosDoDia) {
        boolean conflitoAgendamento = doDia.stream().anyMatch(a ->
                a.getBarbeiro().getId().equals(barbeiroId) && Util.sobrepoe(ini, fim, a.getInicio(), a.getFim()));
        boolean conflitoBloqueio = bloqueiosDoDia.stream().anyMatch(b ->
                b.getBarbeiro().getId().equals(barbeiroId) && Util.sobrepoe(ini, fim, b.getInicio(), b.getFim()));
        return !conflitoAgendamento && !conflitoBloqueio;
    }

    // ================= Criação =================

    @Transactional
    public AgendamentoDTO criar(NovoAgendamentoRequest r) {
        if (r.data().isBefore(Util.hoje())) {
            throw ApiException.regra("Não é possível agendar em uma data que já passou.");
        }
        Cliente cliente = clientes.findById(r.clienteId())
                .orElseThrow(() -> ApiException.naoEncontrado("Cliente não encontrado."));

        Map<String, Servico> porId = servicos.findAllById(r.servicoIds()).stream()
                .collect(Collectors.toMap(Servico::getId, Function.identity()));
        List<ServicoAgendado> itens = r.servicoIds().stream().map(id -> {
            Servico s = porId.get(id);
            if (s == null || !s.isAtivo()) throw ApiException.regra("Serviço indisponível.");
            return ServicoAgendado.de(s);
        }).toList();
        int duracao = itens.stream().mapToInt(ServicoAgendado::getDuracaoMin).sum();

        SlotDTO slot = horariosDisponiveis(r.data(), duracao, r.barbeiroId(), null).stream()
                .filter(s -> s.hora().equals(r.inicio()))
                .findFirst()
                .orElseThrow(() -> ApiException.conflito("Esse horário acabou de ser ocupado. Escolha outro, por favor."));

        if (r.formaPagamento() == FormaPagamento.ONLINE && !r.pagamentoAprovado()) {
            throw new ApiException(HttpStatus.PAYMENT_REQUIRED, "Pagamento online não aprovado.");
        }

        String barbeiroId = r.barbeiroId() != null ? r.barbeiroId() : escolherBarbeiro(slot.barbeiroIds(), r.data());
        Barbeiro barbeiro = barbeiros.getReferenceById(barbeiroId);

        Agendamento a = new Agendamento(Util.gerarId("agd"), cliente, barbeiro, itens, r.data(), r.inicio());
        SimulacaoDescontoDTO desconto = fidelidade.simular(cliente.getId(), a.getValorOriginal());
        a.aplicarDesconto(desconto.desconto(), desconto.aplicado());
        a.setFormaPagamento(r.formaPagamento());
        if (r.formaPagamento() == FormaPagamento.ONLINE) {
            a.setMetodoPagamento(r.metodoPagamento());
            a.setStatusPagamento(StatusPagamento.PAGO);
        }
        boolean peloBarbeiro = r.criadoPor() == Perfil.BARBEIRO;
        a.setCriadoPor(r.criadoPor());
        a.setStatus(peloBarbeiro ? StatusAgendamento.CONFIRMADO : StatusAgendamento.PENDENTE);
        a.setVistoPeloBarbeiro(peloBarbeiro);
        a.setObservacao(r.observacao());
        return AgendamentoDTO.de(agendamentos.save(a));
    }

    /** "Qualquer barbeiro": escolhe quem tem menos atendimentos no dia. */
    private String escolherBarbeiro(List<String> ids, LocalDate data) {
        Map<String, Long> carga = agendamentos.findByData(data).stream()
                .filter(a -> a.getStatus().ocupaHorario())
                .collect(Collectors.groupingBy(a -> a.getBarbeiro().getId(), Collectors.counting()));
        return ids.stream().min(Comparator.comparingLong(id -> carga.getOrDefault(id, 0L))).orElseThrow();
    }

    // ================= Ações =================

    @Transactional
    public AgendamentoDTO confirmar(String id) {
        Agendamento a = buscar(id);
        exigirStatus(a, Set.of(StatusAgendamento.PENDENTE), "confirmar");
        a.setStatus(StatusAgendamento.CONFIRMADO);
        a.setVistoPeloBarbeiro(true);
        a.tocar();
        return AgendamentoDTO.de(a);
    }

    /** Conclui o atendimento. Se o pagamento era na barbearia, registra o método usado. */
    @Transactional
    public AgendamentoDTO concluir(String id, MetodoPagamento metodoNaBarbearia) {
        Agendamento a = buscar(id);
        exigirStatus(a, EM_ABERTO, "concluir");
        if (a.getStatusPagamento() != StatusPagamento.PAGO) {
            if (metodoNaBarbearia == null) {
                throw ApiException.regra("Informe como o cliente pagou (dinheiro, Pix ou cartão).");
            }
            a.setMetodoPagamento(metodoNaBarbearia);
        }
        a.setStatus(StatusAgendamento.CONCLUIDO);
        a.setStatusPagamento(StatusPagamento.PAGO);
        a.setVistoPeloBarbeiro(true);
        a.tocar();
        return AgendamentoDTO.de(a);
    }

    @Transactional
    public AgendamentoDTO remarcar(String id, RemarcarRequest r) {
        Agendamento a = buscar(id);
        exigirStatus(a, EM_ABERTO, "remarcar");
        String barbeiroId = r.barbeiroId() != null ? r.barbeiroId() : a.getBarbeiro().getId();
        boolean disponivel = horariosDisponiveis(r.data(), a.getDuracaoMin(), barbeiroId, a.getId()).stream()
                .anyMatch(s -> s.hora().equals(r.inicio()));
        if (!disponivel) throw ApiException.conflito("Horário indisponível para remarcação.");

        a.mover(r.data(), r.inicio(), barbeiros.getReferenceById(barbeiroId));
        boolean peloBarbeiro = r.por() == Perfil.BARBEIRO;
        a.setStatus(peloBarbeiro ? StatusAgendamento.CONFIRMADO : StatusAgendamento.PENDENTE);
        a.setVistoPeloBarbeiro(peloBarbeiro);
        a.tocar();
        return AgendamentoDTO.de(a);
    }

    @Transactional
    public AgendamentoDTO cancelar(String id, Perfil por, String motivo) {
        Agendamento a = buscar(id);
        exigirStatus(a, EM_ABERTO, "cancelar");
        a.setStatus(StatusAgendamento.CANCELADO);
        // pagamento online simulado é estornado automaticamente
        if (a.getStatusPagamento() == StatusPagamento.PAGO) a.setStatusPagamento(StatusPagamento.ESTORNADO);
        a.setVistoPeloBarbeiro(por == Perfil.BARBEIRO);
        if (motivo != null && !motivo.isBlank()) {
            a.setObservacao("Cancelado por " + por.json() + ": " + motivo.trim());
        }
        a.tocar();
        return AgendamentoDTO.de(a);
    }

    @Transactional
    public AgendamentoDTO marcarNaoCompareceu(String id) {
        Agendamento a = buscar(id);
        exigirStatus(a, EM_ABERTO, "marcar falta em");
        a.setStatus(StatusAgendamento.NAO_COMPARECEU);
        a.setVistoPeloBarbeiro(true);
        a.tocar();
        return AgendamentoDTO.de(a);
    }

    @Transactional
    public void marcarComoVistos(List<String> ids) {
        agendamentos.findAllById(ids).forEach(a -> a.setVistoPeloBarbeiro(true));
    }

    // ================= Auxiliares =================

    private Agendamento buscar(String id) {
        return agendamentos.findById(id).orElseThrow(() -> ApiException.naoEncontrado("Agendamento não encontrado."));
    }

    private static void exigirStatus(Agendamento a, Set<StatusAgendamento> permitidos, String acao) {
        if (!permitidos.contains(a.getStatus())) {
            throw ApiException.regra("Não é possível " + acao + " um agendamento com status \"" + a.getStatus().json() + "\".");
        }
    }
}

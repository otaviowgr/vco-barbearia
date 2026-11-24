package br.com.vco.barbearia.negocio;

import br.com.vco.barbearia.dominio.Agendamento;
import br.com.vco.barbearia.dominio.ConfigBarbearia;
import br.com.vco.barbearia.dominio.Enums.StatusAgendamento;
import br.com.vco.barbearia.dto.Respostas.ProgressoFidelidadeDTO;
import br.com.vco.barbearia.dto.Respostas.SimulacaoDescontoDTO;
import br.com.vco.barbearia.repositorio.AgendamentoRepository;
import br.com.vco.barbearia.util.Util;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Plano fidelidade: a cada `meta` atendimentos concluídos o cliente ganha
 * 1 desconto de `percentual`% no próximo agendamento. O desconto é "consumido"
 * quando um agendamento é criado com ele e devolvido se esse agendamento for
 * cancelado ou o cliente faltar.
 */
@Service
public class FidelidadeService {

    private final AgendamentoRepository agendamentos;
    private final ConfigService configService;

    public FidelidadeService(AgendamentoRepository agendamentos, ConfigService configService) {
        this.agendamentos = agendamentos;
        this.configService = configService;
    }

    @Transactional(readOnly = true)
    public ProgressoFidelidadeDTO progresso(String clienteId) {
        return calcular(agendamentos.findByCliente_Id(clienteId), configService.obter());
    }

    /** Calcula a partir de uma lista já carregada (evita consultas repetidas). */
    public ProgressoFidelidadeDTO calcular(List<Agendamento> doCliente, ConfigBarbearia config) {
        int meta = config.getFidelidadeMeta();
        int percentual = config.getFidelidadePercentual();
        int concluidos = (int) doCliente.stream().filter(a -> a.getStatus() == StatusAgendamento.CONCLUIDO).count();
        int usados = (int) doCliente.stream()
                .filter(a -> a.isDescontoFidelidade() && a.getStatus().ocupaHorario())
                .count();
        int conquistados = concluidos / meta;
        int ciclo = concluidos % meta;
        return new ProgressoFidelidadeDTO(meta, percentual, concluidos, ciclo, meta - ciclo, conquistados - usados > 0);
    }

    @Transactional(readOnly = true)
    public SimulacaoDescontoDTO simular(String clienteId, BigDecimal valor) {
        ProgressoFidelidadeDTO p = progresso(clienteId);
        BigDecimal desconto = p.descontoDisponivel()
                ? Util.r2(valor.multiply(BigDecimal.valueOf(p.percentual())).divide(BigDecimal.valueOf(100)))
                : BigDecimal.ZERO;
        return new SimulacaoDescontoDTO(desconto, p.descontoDisponivel(), p.percentual());
    }
}

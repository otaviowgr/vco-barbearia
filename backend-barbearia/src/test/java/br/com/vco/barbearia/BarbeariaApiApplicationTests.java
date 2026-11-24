package br.com.vco.barbearia;

import br.com.vco.barbearia.config.ApiException;
import br.com.vco.barbearia.dominio.Enums.FormaPagamento;
import br.com.vco.barbearia.dominio.Enums.MetodoPagamento;
import br.com.vco.barbearia.dominio.Enums.Perfil;
import br.com.vco.barbearia.dominio.Enums.StatusAgendamento;
import br.com.vco.barbearia.dominio.Enums.StatusPagamento;
import br.com.vco.barbearia.dto.Requisicoes.NovoAgendamentoRequest;
import br.com.vco.barbearia.dto.Respostas.AgendamentoDTO;
import br.com.vco.barbearia.dto.Respostas.SessaoDTO;
import br.com.vco.barbearia.dto.Respostas.SlotDTO;
import br.com.vco.barbearia.negocio.AgendamentoService;
import br.com.vco.barbearia.negocio.AuthService;
import br.com.vco.barbearia.negocio.FidelidadeService;
import br.com.vco.barbearia.negocio.FinanceiroService;
import br.com.vco.barbearia.util.Util;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Fluxo principal da demonstração, rodando contra o banco H2 com os dados de exemplo. */
@SpringBootTest
class BarbeariaApiApplicationTests {

    @Autowired AuthService auth;
    @Autowired AgendamentoService agendamentos;
    @Autowired FidelidadeService fidelidade;
    @Autowired FinanceiroService financeiro;

    @Test
    void fluxoCompleto_clienteAgenda_barbeiroConclui_fidelidadeEFinanceiroAtualizam() {
        SessaoDTO cliente = auth.loginDemo(Perfil.CLIENTE);
        assertThat(cliente.clienteId()).isEqualTo("cli-joao");
        assertThat(fidelidade.progresso("cli-joao").faltam()).isEqualTo(1);

        // escolhe o primeiro dia aberto a partir de amanhã que tenha horário livre
        LocalDate dia = Util.hoje().plusDays(1);
        List<SlotDTO> slots = agendamentos.horariosDisponiveis(dia, 60, null, null);
        while (slots.isEmpty()) {
            dia = dia.plusDays(1);
            slots = agendamentos.horariosDisponiveis(dia, 60, null, null);
        }

        AgendamentoDTO novo = agendamentos.criar(new NovoAgendamentoRequest("cli-joao", null, List.of("srv-combo"),
                dia, slots.get(0).hora(), FormaPagamento.ONLINE, MetodoPagamento.PIX, true, Perfil.CLIENTE, null));
        assertThat(novo.status()).isEqualTo(StatusAgendamento.PENDENTE);
        assertThat(novo.statusPagamento()).isEqualTo(StatusPagamento.PAGO);
        assertThat(novo.vistoPeloBarbeiro()).isFalse();
        assertThat(novo.valorFinal()).isEqualByComparingTo("70.00");

        // mesmo horário com o mesmo barbeiro não pode ser reservado de novo
        LocalDate diaFinal = dia;
        AgendamentoDTO criado = novo;
        assertThatThrownBy(() -> agendamentos.criar(new NovoAgendamentoRequest("cli-pedro", criado.barbeiroId(),
                List.of("srv-corte"), diaFinal, criado.inicio(), FormaPagamento.NA_BARBEARIA, null, false, Perfil.CLIENTE, null)))
                .isInstanceOf(ApiException.class);

        BigDecimal antes = financeiro.resumo(new FinanceiroService.Filtro(dia, dia, null, null)).atual().faturamento();
        agendamentos.confirmar(novo.id());
        agendamentos.concluir(novo.id(), null);
        BigDecimal depois = financeiro.resumo(new FinanceiroService.Filtro(dia, dia, null, null)).atual().faturamento();
        assertThat(depois.subtract(antes)).isEqualByComparingTo("70.00");

        // 10 concluídos → desconto de 20% liberado e aplicado no próximo agendamento
        assertThat(fidelidade.progresso("cli-joao").descontoDisponivel()).isTrue();
        List<SlotDTO> slots2 = agendamentos.horariosDisponiveis(dia.plusDays(1), 60, null, null);
        LocalDate dia2 = dia.plusDays(1);
        while (slots2.isEmpty()) {
            dia2 = dia2.plusDays(1);
            slots2 = agendamentos.horariosDisponiveis(dia2, 60, null, null);
        }
        AgendamentoDTO comDesconto = agendamentos.criar(new NovoAgendamentoRequest("cli-joao", null, List.of("srv-combo"),
                dia2, slots2.get(0).hora(), FormaPagamento.NA_BARBEARIA, null, false, Perfil.CLIENTE, null));
        assertThat(comDesconto.descontoFidelidade()).isTrue();
        assertThat(comDesconto.valorFinal()).isEqualByComparingTo("56.00");

        // cancelar devolve o desconto
        agendamentos.cancelar(comDesconto.id(), Perfil.CLIENTE, null);
        assertThat(fidelidade.progresso("cli-joao").descontoDisponivel()).isTrue();
    }

    @Test
    void loginComSenhaErrada_falha() {
        assertThatThrownBy(() -> auth.login("cliente@demo.com", "errada")).isInstanceOf(ApiException.class);
    }
}

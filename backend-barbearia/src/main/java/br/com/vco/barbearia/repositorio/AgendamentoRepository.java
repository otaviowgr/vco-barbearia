package br.com.vco.barbearia.repositorio;

import br.com.vco.barbearia.dominio.Agendamento;
import br.com.vco.barbearia.dominio.Enums.StatusAgendamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
//COMUNICAÇOES COM O BANCO
public interface AgendamentoRepository extends JpaRepository<Agendamento, String>, JpaSpecificationExecutor<Agendamento> {

    List<Agendamento> findByData(LocalDate data);

    List<Agendamento> findByDataBetween(LocalDate inicio, LocalDate fim);

    List<Agendamento> findByCliente_Id(String clienteId);

    long countByVistoPeloBarbeiroFalseAndStatusIn(Collection<StatusAgendamento> status);

    long countByVistoPeloBarbeiroFalseAndStatusInAndBarbeiro_Id(Collection<StatusAgendamento> status, String barbeiroId);

    boolean existsByBarbeiro_IdAndDataAndStatusIn(String barbeiroId, LocalDate data, Collection<StatusAgendamento> status);
}

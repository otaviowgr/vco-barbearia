package br.com.vco.barbearia.repositorio;

import br.com.vco.barbearia.dominio.Despesa;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface DespesaRepository extends JpaRepository<Despesa, String> {

    List<Despesa> findByDataBetweenOrderByDataDesc(LocalDate inicio, LocalDate fim);
}

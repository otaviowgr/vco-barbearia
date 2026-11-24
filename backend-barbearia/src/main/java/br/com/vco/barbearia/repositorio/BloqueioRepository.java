package br.com.vco.barbearia.repositorio;

import br.com.vco.barbearia.dominio.Bloqueio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface BloqueioRepository extends JpaRepository<Bloqueio, String> {

    List<Bloqueio> findByData(LocalDate data);

    List<Bloqueio> findByDataBetweenOrderByDataAscInicioAsc(LocalDate inicio, LocalDate fim);
}

package br.com.vco.barbearia.repositorio;

import br.com.vco.barbearia.dominio.Barbeiro;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BarbeiroRepository extends JpaRepository<Barbeiro, String> {

    List<Barbeiro> findByAtivoTrue();
}

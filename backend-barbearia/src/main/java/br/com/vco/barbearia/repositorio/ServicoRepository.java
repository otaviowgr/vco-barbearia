package br.com.vco.barbearia.repositorio;

import br.com.vco.barbearia.dominio.Servico;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServicoRepository extends JpaRepository<Servico, String> {

    List<Servico> findByAtivoTrue();
}

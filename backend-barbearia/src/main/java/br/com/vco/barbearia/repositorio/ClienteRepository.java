package br.com.vco.barbearia.repositorio;

import br.com.vco.barbearia.dominio.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClienteRepository extends JpaRepository<Cliente, String> {

    List<Cliente> findAllByOrderByNomeAsc();
}

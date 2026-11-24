package br.com.vco.barbearia.repositorio;

import br.com.vco.barbearia.dominio.ConfigBarbearia;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConfigRepository extends JpaRepository<ConfigBarbearia, Long> {
}

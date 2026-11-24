package br.com.vco.barbearia.demo;

import br.com.vco.barbearia.dominio.Barbeiro;
import br.com.vco.barbearia.dominio.Cliente;
import br.com.vco.barbearia.dominio.ConfigBarbearia;
import br.com.vco.barbearia.dominio.Enums.Perfil;
import br.com.vco.barbearia.dominio.Servico;
import br.com.vco.barbearia.dominio.Usuario;
import br.com.vco.barbearia.negocio.AuthService;
import br.com.vco.barbearia.repositorio.ConfigRepository;
import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Carrega os dados da demonstração quando o banco está vazio
 * e permite restaurá-los (botão "Restaurar dados da demonstração").
 */
@Service
public class DemoService implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoService.class);

    /** Ordem de exclusão respeitando as chaves estrangeiras. */
    private static final List<String> TABELAS = List.of(
            "agendamento_servico", "agendamento", "bloqueio", "despesa", "usuario",
            "cliente", "barbeiro", "servico", "config_horario", "config_barbearia");

    private final EntityManager em;
    private final ConfigRepository configRepo;
    private final PasswordEncoder encoder;
    private final boolean seedAoIniciar;

    public DemoService(EntityManager em, ConfigRepository configRepo, PasswordEncoder encoder,
                       @Value("${vco.seed.ao-iniciar:true}") boolean seedAoIniciar) {
        this.em = em;
        this.configRepo = configRepo;
        this.encoder = encoder;
        this.seedAoIniciar = seedAoIniciar;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (seedAoIniciar && configRepo.count() == 0) {
            log.info("Banco vazio: carregando dados da demonstração...");
            popular();
        }
    }

    @Transactional
    public void restaurar() {
        for (String tabela : TABELAS) {
            em.createNativeQuery("DELETE FROM " + tabela).executeUpdate();
        }
        em.clear();
        popular();
    }

    private void popular() {
        long inicio = System.currentTimeMillis();
        ConfigBarbearia config = CatalogoDemo.config();
        List<Servico> servicos = CatalogoDemo.servicos();
        List<Barbeiro> barbeiros = CatalogoDemo.barbeiros();
        List<Cliente> clientes = CatalogoDemo.clientes();

        em.persist(config);
        servicos.forEach(em::persist);
        barbeiros.forEach(em::persist);
        clientes.forEach(em::persist);

        Map<String, Cliente> cli = clientes.stream().collect(Collectors.toMap(Cliente::getId, Function.identity()));
        Map<String, Barbeiro> brb = barbeiros.stream().collect(Collectors.toMap(Barbeiro::getId, Function.identity()));
        String hash = encoder.encode(AuthService.SENHA_DEMO);
        em.persist(new Usuario("usr-cliente-demo", "João Silva", AuthService.EMAIL_CLIENTE_DEMO, hash,
                "(48) 99999-0000", Perfil.CLIENTE, cli.get(CatalogoDemo.CLIENTE_DEMO_ID), null, false));
        em.persist(new Usuario("usr-barbeiro-demo", "Carlos", AuthService.EMAIL_BARBEIRO_DEMO, hash,
                "(48) 99999-1234", Perfil.BARBEIRO, null, brb.get(CatalogoDemo.BARBEIRO_DEMO_ID), true));

        GeradorMovimento.Resultado mov = new GeradorMovimento(config, servicos, barbeiros, clientes).gerar();
        mov.bloqueios().forEach(em::persist);
        mov.despesas().forEach(em::persist);
        int i = 0;
        for (var a : mov.agendamentos()) {
            em.persist(a);
            if (++i % 500 == 0) em.flush(); // grava em lotes
        }
        em.flush();
        log.info("Demonstração carregada: {} agendamentos, {} despesas ({} ms)",
                mov.agendamentos().size(), mov.despesas().size(), System.currentTimeMillis() - inicio);
    }
}

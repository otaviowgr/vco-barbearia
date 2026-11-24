package br.com.vco.barbearia.controle;

import br.com.vco.barbearia.config.ApiException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;

/**
 * Desligamento seguro da API (usado pelo parar-sistema.bat).
 * Fecha o banco H2 corretamente, em vez de "matar" o processo.
 * Só aceita chamadas feitas no próprio computador.
 */
@RestController
@RequestMapping("/api/sistema")
@Tag(name = "Sistema")
public class SistemaController {

    private static final Set<String> LOCAL = Set.of("127.0.0.1", "0:0:0:0:0:0:0:1", "::1");

    private final ConfigurableApplicationContext contexto;

    public SistemaController(ConfigurableApplicationContext contexto) {
        this.contexto = contexto;
    }

    @PostMapping("/desligar")
    @ResponseStatus(HttpStatus.ACCEPTED)
    @Operation(summary = "Desliga a API com segurança (só a partir do próprio computador)")
    public void desligar(HttpServletRequest request) {
        if (!LOCAL.contains(request.getRemoteAddr())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Só é possível desligar a API pelo próprio computador.");
        }
        Thread t = new Thread(() -> {
            try {
                Thread.sleep(300); // deixa a resposta ser enviada antes
            } catch (InterruptedException ignorada) {
                Thread.currentThread().interrupt();
            }
            System.exit(SpringApplication.exit(contexto, () -> 0));
        }, "desligamento");
        t.setDaemon(false);
        t.start();
    }
}

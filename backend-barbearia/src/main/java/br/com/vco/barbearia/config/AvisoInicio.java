package br.com.vco.barbearia.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/** Mostra no terminal, quando a API termina de subir, os endereços úteis. */
@Component
public class AvisoInicio {

    private static final Logger log = LoggerFactory.getLogger(AvisoInicio.class);

    private final Environment env;

    public AvisoInicio(Environment env) {
        this.env = env;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void avisar() {
        String porta = env.getProperty("local.server.port", env.getProperty("server.port", "8080"));
        String url = env.getProperty("spring.datasource.url", "");
        StringBuilder msg = new StringBuilder("\n")
                .append("==================================================================\n")
                .append("  API da VCO Barbearia PRONTA em http://localhost:").append(porta).append("/api\n")
                .append("  Documentação (Swagger): http://localhost:").append(porta).append("/swagger-ui.html\n");
        if (url.startsWith("jdbc:h2:file:")) {
            String jdbc = url.substring(0, url.indexOf(';')) + ";AUTO_SERVER=TRUE";
            msg.append("  Console do banco H2:    http://localhost:").append(porta).append("/h2-console\n")
               .append("     JDBC URL: ").append(jdbc).append("\n")
               .append("     Usuário: sa   Senha: (deixe em branco)\n");
        }
        msg.append("  Agora rode o site:  cd frontend-barbearia  e  npm run dev:api\n")
           .append("==================================================================");
        log.info(msg.toString());
    }
}

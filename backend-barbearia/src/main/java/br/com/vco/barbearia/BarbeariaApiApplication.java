package br.com.vco.barbearia;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.nio.file.Files;
import java.nio.file.Path;

@SpringBootApplication
public class BarbeariaApiApplication {

    public static void main(String[] args) {
        definirPastaDeDados();
        SpringApplication.run(BarbeariaApiApplication.class, args);
    }

    /**
     * Garante que o banco H2 fique sempre em backend-barbearia/data, não importa
     * de qual pasta a API foi iniciada (terminal, botão Run do VS Code/IntelliJ...).
     * Pode ser trocado com a variável de ambiente VCO_DADOS.
     */
    private static void definirPastaDeDados() {
        if (System.getProperty("vco.dados") != null || System.getenv("VCO_DADOS") != null) return;
        try {
            // ao rodar pelo IDE ou pelo Maven, as classes ficam em backend-barbearia/target/classes
            Path classes = Path.of(BarbeariaApiApplication.class.getProtectionDomain().getCodeSource().getLocation().toURI());
            Path projeto = classes.getParent().getParent();
            if (Files.exists(projeto.resolve("pom.xml"))) {
                System.setProperty("vco.dados", projeto.resolve("data").toAbsolutePath().toString().replace('\\', '/'));
            }
        } catch (Exception ignorada) {
            // executando de um .jar: usa a pasta ./data de onde o comando foi rodado
        }
    }
}

package br.com.vco.barbearia.demo;

import br.com.vco.barbearia.dominio.Barbeiro;
import br.com.vco.barbearia.dominio.Cliente;
import br.com.vco.barbearia.dominio.ConfigBarbearia;
import br.com.vco.barbearia.dominio.Servico;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/** Dados fixos da demonstração (os mesmos do front-end). */
final class CatalogoDemo {

    static final String CLIENTE_DEMO_ID = "cli-joao";
    static final String BARBEIRO_DEMO_ID = "brb-carlos";

    private CatalogoDemo() {
    }

    private static String unsplash(String id, int w) {
        return "https://images.unsplash.com/" + id + "?auto=format&fit=crop&w=" + w + "&q=70";
    }

    static ConfigBarbearia config() {
        ConfigBarbearia c = new ConfigBarbearia();
        c.setNome("VCO Barbearia");
        c.setSlogan("Estilo, precisão e um bom papo.");
        c.setSobre("Desde 2018 cuidando do visual de quem não abre mão de estilo. Ambiente climatizado, café e cerveja "
                + "gelada por conta da casa, e uma equipe que entende de corte clássico e moderno.");
        c.setEndereco("Rua das Palmeiras, 123 – Centro");
        c.setCidade("Florianópolis – SC");
        c.setTelefone("(48) 99999-1234");
        c.setWhatsapp("5548999991234");
        c.setInstagram("@vcobarbearia");
        List<ConfigBarbearia.Horario> horarios = new ArrayList<>();
        for (int dia = 1; dia <= 5; dia++) horarios.add(new ConfigBarbearia.Horario(dia, LocalTime.of(9, 0), LocalTime.of(20, 0)));
        horarios.add(new ConfigBarbearia.Horario(6, LocalTime.of(8, 0), LocalTime.of(18, 0))); // sábado; domingo fechado
        c.setHorarios(horarios);
        c.setIntervaloSlotsMin(30);
        c.setFidelidadeMeta(5);
        c.setFidelidadePercentual(20);
        return c;
    }

    static List<Servico> servicos() {
        return List.of(
                new Servico("srv-corte", "Corte masculino",
                        "Corte na tesoura e/ou máquina, lavagem, finalização com pomada e acabamento na navalha.",
                        40, new BigDecimal("45.00"), unsplash("photo-1503951914875-452162b0f3f1", 800), true, true),
                new Servico("srv-barba", "Barba",
                        "Toalha quente, desenho com navalha, hidratação com óleo e balm pós-barba.",
                        30, new BigDecimal("35.00"), unsplash("photo-1621605815971-fbc98d665033", 800), true, true),
                new Servico("srv-combo", "Corte + Barba",
                        "O combo completo: corte, barba com toalha quente e finalização. Sai mais em conta!",
                        60, new BigDecimal("70.00"), unsplash("photo-1599351431202-1e0f0137899a", 800), true, true),
                new Servico("srv-degrade", "Degradê",
                        "Fade com transição suave (low, mid ou high), acabamento na navalha e risquinho opcional.",
                        45, new BigDecimal("50.00"), unsplash("photo-1622286342621-4bd786c2447c", 800), true, true),
                new Servico("srv-pigmentacao", "Pigmentação",
                        "Preenchimento de falhas na barba ou no cabelo com pigmento, para um visual mais uniforme.",
                        30, new BigDecimal("40.00"), unsplash("photo-1605497788044-5a32c7078486", 800), true, false),
                new Servico("srv-sobrancelha", "Sobrancelha",
                        "Limpeza e alinhamento da sobrancelha com navalha ou pinça, mantendo o aspecto natural.",
                        15, new BigDecimal("15.00"), unsplash("photo-1512690459411-b9245aed614b", 800), true, false),
                new Servico("srv-hidratacao", "Hidratação",
                        "Lavagem com shampoo específico, máscara hidratante e massagem capilar relaxante.",
                        30, new BigDecimal("30.00"), unsplash("photo-1517832606299-7ae9b720a186", 800), true, false));
    }

    static List<Barbeiro> barbeiros() {
        return List.of(
                new Barbeiro(BARBEIRO_DEMO_ID, "Carlos", "Cortes clássicos e barba",
                        "Fundador da VCO, 12 anos de navalha. Mestre na barba com toalha quente.",
                        unsplash("photo-1500648767791-00dcc994a43e", 400), "(48) 99999-1234", "#3b82f6", true, true),
                new Barbeiro("brb-rafael", "Rafael Souza", "Degradê e freestyle",
                        "Especialista em fade e desenhos. Se tem risquinho, é com ele.",
                        unsplash("photo-1507003211169-0a1dd7228f2d", 400), "(48) 98888-2222", "#94a3b8", true, false),
                new Barbeiro("brb-lucas", "Lucas Mendes", "Pigmentação e visagismo",
                        "Visagista: analisa o formato do rosto para indicar o corte ideal.",
                        unsplash("photo-1506794778202-cad84cf45f1d", 400), "(48) 97777-3333", "#e4e4e7", true, false));
    }

    static List<Cliente> clientes() {
        return List.of(
                cli(CLIENTE_DEMO_ID, "João Silva", "cliente@demo.com", "(48) 99999-0000", "2025-09-02"),
                cli("cli-pedro", "Pedro Henrique Costa", "pedro.costa@email.com", "(48) 99812-4471", "2025-08-11"),
                cli("cli-marcos", "Marcos Vinícius Rocha", "marcos.rocha@email.com", "(48) 99654-2208", "2025-08-15"),
                cli("cli-felipe", "Felipe Andrade", "felipe.andrade@email.com", "(48) 98431-7765", "2025-09-20"),
                cli("cli-gabriel", "Gabriel Martins", "gabriel.m@email.com", "(48) 99127-3390", "2025-10-03"),
                cli("cli-thiago", "Thiago Ramos", "thiago.ramos@email.com", "(48) 98822-6014", "2025-10-28"),
                cli("cli-bruno", "Bruno Carvalho", "bruno.carvalho@email.com", "(48) 99703-5582", "2025-11-09"),
                cli("cli-andre", "André Luiz Pereira", "andre.pereira@email.com", "(48) 98546-1127", "2026-01-14"),
                cli("cli-rodrigo", "Rodrigo Nunes", "rodrigo.nunes@email.com", "(48) 99288-9043", "2026-02-02"),
                cli("cli-matheus", "Matheus Lima", "matheus.lima@email.com", "(48) 98015-6630", "2026-03-19"),
                cli("cli-diego", "Diego Fernandes", "diego.f@email.com", "(48) 99476-8812", "2026-05-07"),
                cli("cli-vitor", "Vitor Hugo Alves", "vitor.alves@email.com", "(48) 98367-2451", "2026-07-22"));
    }

    private static Cliente cli(String id, String nome, String email, String tel, String desde) {
        return new Cliente(id, nome, email, tel, Instant.parse(desde + "T13:00:00Z"));
    }
}

package br.com.vco.barbearia.demo;

import br.com.vco.barbearia.dominio.Agendamento;
import br.com.vco.barbearia.dominio.Barbeiro;
import br.com.vco.barbearia.dominio.Bloqueio;
import br.com.vco.barbearia.dominio.Cliente;
import br.com.vco.barbearia.dominio.ConfigBarbearia;
import br.com.vco.barbearia.dominio.Despesa;
import br.com.vco.barbearia.dominio.Enums.CategoriaDespesa;
import br.com.vco.barbearia.dominio.Enums.FormaPagamento;
import br.com.vco.barbearia.dominio.Enums.MetodoPagamento;
import br.com.vco.barbearia.dominio.Enums.Perfil;
import br.com.vco.barbearia.dominio.Enums.StatusAgendamento;
import br.com.vco.barbearia.dominio.Enums.StatusPagamento;
import br.com.vco.barbearia.dominio.Servico;
import br.com.vco.barbearia.dominio.ServicoAgendado;
import br.com.vco.barbearia.util.Util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Gera o "movimento" fictício relativo a hoje: ~12 meses de histórico,
 * ~10 dias de agenda futura, despesas mensais e um bloqueio.
 * Usa um gerador pseudoaleatório com semente fixa (mesma ideia do front-end).
 */
final class GeradorMovimento {

    record Resultado(List<Agendamento> agendamentos, List<Despesa> despesas, List<Bloqueio> bloqueios) {
    }

    private record Combo(List<String> ids, int peso) {
    }

    private static final List<Combo> COMBOS = List.of(
            new Combo(List.of("srv-corte"), 30),
            new Combo(List.of("srv-combo"), 24),
            new Combo(List.of("srv-degrade"), 16),
            new Combo(List.of("srv-barba"), 10),
            new Combo(List.of("srv-corte", "srv-sobrancelha"), 5),
            new Combo(List.of("srv-degrade", "srv-barba"), 4),
            new Combo(List.of("srv-pigmentacao"), 4),
            new Combo(List.of("srv-hidratacao"), 3),
            new Combo(List.of("srv-combo", "srv-hidratacao"), 2),
            new Combo(List.of("srv-sobrancelha"), 2));

    private static final String[] CLIENTES = {"cli-pedro", "cli-marcos", "cli-felipe", "cli-gabriel", "cli-thiago",
            "cli-bruno", "cli-andre", "cli-rodrigo", "cli-matheus", "cli-diego", "cli-vitor"};
    private static final int[] PESOS_CLIENTES = {14, 12, 10, 10, 9, 8, 7, 7, 6, 5, 4};

    private int semente = 20261123;
    private final ConfigBarbearia config;
    private final Map<String, Servico> servicos;
    private final Map<String, Barbeiro> barbeiros;
    private final Map<String, Cliente> clientes;
    private final LocalDate hoje = Util.hoje();
    private final int agora = Util.minutos(Util.agora());
    private final Map<String, List<int[]>> ocupacao = new HashMap<>();
    private int contadorId;

    GeradorMovimento(ConfigBarbearia config, List<Servico> servicos, List<Barbeiro> barbeiros, List<Cliente> clientes) {
        this.config = config;
        this.servicos = servicos.stream().collect(Collectors.toMap(Servico::getId, Function.identity()));
        this.barbeiros = barbeiros.stream().collect(Collectors.toMap(Barbeiro::getId, Function.identity()));
        this.clientes = clientes.stream().collect(Collectors.toMap(Cliente::getId, Function.identity()));
    }

    // ---------- aleatoriedade reprodutível (mulberry32) ----------
    private double rnd() {
        semente += 0x6D2B79F5;
        int t = (semente ^ (semente >>> 15)) * (1 | semente);
        t = (t + ((t ^ (t >>> 7)) * (61 | t))) ^ t;
        return ((t ^ (t >>> 14)) & 0xFFFFFFFFL) / 4294967296.0;
    }

    private int entre(int a, int b) {
        return a + (int) Math.floor(rnd() * (b - a + 1));
    }

    private int escolherIndice(int[] pesos) {
        int total = 0;
        for (int p : pesos) total += p;
        double r = rnd() * total;
        for (int i = 0; i < pesos.length; i++) {
            if ((r -= pesos[i]) < 0) return i;
        }
        return pesos.length - 1;
    }

    private MetodoPagamento metodoBalcao() {
        int i = escolherIndice(new int[]{30, 45, 25});
        return i == 0 ? MetodoPagamento.DINHEIRO : i == 1 ? MetodoPagamento.PIX : MetodoPagamento.CARTAO;
    }

    // ---------- ocupação (evita sobreposição) ----------
    private void ocupar(String b, LocalDate d, int ini, int fim) {
        ocupacao.computeIfAbsent(b + "|" + d, k -> new ArrayList<>()).add(new int[]{ini, fim});
    }

    private boolean livre(String b, LocalDate d, int ini, int fim) {
        return ocupacao.getOrDefault(b + "|" + d, List.of()).stream().noneMatch(o -> ini < o[1] && o[0] < fim);
    }

    private LocalDate proxAberto(LocalDate d) {
        while (config.horarioDoDia(Util.diaSemana(d)).isEmpty()) d = d.plusDays(1);
        return d;
    }

    private Agendamento montar(String clienteId, String barbeiroId, List<String> servicoIds, LocalDate data, int inicioMin,
                               StatusAgendamento status, FormaPagamento forma, MetodoPagamento metodo, boolean pago) {
        List<ServicoAgendado> itens = servicoIds.stream().map(id -> ServicoAgendado.de(servicos.get(id))).toList();
        Agendamento a = new Agendamento("tmp-" + (++contadorId), clientes.get(clienteId), barbeiros.get(barbeiroId),
                itens, data, Util.hora(inicioMin));
        a.setStatus(status);
        a.setFormaPagamento(forma);
        a.setMetodoPagamento(metodo);
        a.setStatusPagamento(pago ? StatusPagamento.PAGO : StatusPagamento.PENDENTE);
        a.setCriadoPor(rnd() < 0.7 ? Perfil.CLIENTE : Perfil.BARBEIRO);
        a.setCriadoEm(data.minusDays(entre(0, 6)).atTime(entre(8, 21), entre(0, 59)).atZone(Util.FUSO).toInstant());
        a.setVistoPeloBarbeiro(true);
        return a;
    }

    Resultado gerar() {
        List<Agendamento> lista = new ArrayList<>();
        List<Bloqueio> bloqueios = new ArrayList<>();

        // ---------- bloqueio de exemplo ----------
        LocalDate diaBloq = proxAberto(hoje.plusDays(2));
        bloqueios.add(new Bloqueio("blq-1", barbeiros.get("brb-rafael"), diaBloq, LocalTime.of(14, 0), LocalTime.of(16, 0), "Consulta médica"));
        ocupar("brb-rafael", diaBloq, 14 * 60, 16 * 60);

        // ---------- histórico fixo do cliente demo (João): 9 concluídos → falta 1 ----------
        for (int k = 0; k < 9; k++) {
            LocalDate data = proxAberto(hoje.minusDays(305 - k * 33L));
            boolean comRafael = k % 3 == 2;
            List<String> servs = comRafael ? List.of("srv-degrade") : k % 2 == 0 ? List.of("srv-combo") : List.of("srv-corte");
            Agendamento a = k % 4 == 1
                    ? montar(CatalogoDemo.CLIENTE_DEMO_ID, comRafael ? "brb-rafael" : CatalogoDemo.BARBEIRO_DEMO_ID, servs, data, 600,
                    StatusAgendamento.CONCLUIDO, FormaPagamento.ONLINE, MetodoPagamento.PIX, true)
                    : montar(CatalogoDemo.CLIENTE_DEMO_ID, comRafael ? "brb-rafael" : CatalogoDemo.BARBEIRO_DEMO_ID, servs, data, 600,
                    StatusAgendamento.CONCLUIDO, FormaPagamento.NA_BARBEARIA, k % 2 == 1 ? MetodoPagamento.CARTAO : MetodoPagamento.PIX, true);
            lista.add(a);
            ocupar(a.getBarbeiro().getId(), data, 600, 600 + a.getDuracaoMin());
        }
        lista.add(montar(CatalogoDemo.CLIENTE_DEMO_ID, CatalogoDemo.BARBEIRO_DEMO_ID, List.of("srv-corte"),
                proxAberto(hoje.minusDays(18)), 18 * 60, StatusAgendamento.CANCELADO, FormaPagamento.NA_BARBEARIA, null, false));
        {
            LocalDate data = proxAberto(hoje.plusDays(3));
            Agendamento a = montar(CatalogoDemo.CLIENTE_DEMO_ID, CatalogoDemo.BARBEIRO_DEMO_ID, List.of("srv-combo"), data, 600,
                    StatusAgendamento.CONFIRMADO, FormaPagamento.NA_BARBEARIA, null, false);
            a.setCriadoPor(Perfil.CLIENTE);
            lista.add(a);
            ocupar(a.getBarbeiro().getId(), data, 600, 660);
        }

        // ---------- movimento geral ----------
        LocalDate inicioHist = YearMonth.from(hoje).minusMonths(12).atDay(1);
        LocalDate fimAgenda = hoje.plusDays(10);
        long totalDias = ChronoUnit.DAYS.between(inicioHist, fimAgenda);
        int passo = config.getIntervaloSlotsMin();
        List<Barbeiro> ativos = barbeiros.values().stream().filter(Barbeiro::isAtivo)
                .sorted(Comparator.comparing(Barbeiro::getId)).toList();
        int[] pesosCombos = COMBOS.stream().mapToInt(Combo::peso).toArray();

        for (long i = 0; i <= totalDias; i++) {
            LocalDate data = inicioHist.plusDays(i);
            int dow = Util.diaSemana(data);
            var horario = config.horarioDoDia(dow);
            if (horario.isEmpty()) continue;
            long diff = ChronoUnit.DAYS.between(hoje, data);
            int abre = Util.minutos(horario.get().getAbre());
            int fecha = Util.minutos(horario.get().getFecha());
            int mes = data.getMonthValue();

            double crescimento = 0.85 + ((double) i / totalDias) * 0.3;
            double sazonal = mes == 12 ? 1.3 : (mes == 1 || mes == 7) ? 0.85 : 1;
            double fatorDia = (dow == 6 ? 1.35 : dow == 5 ? 1.15 : 1) * crescimento * sazonal;

            for (Barbeiro b : ativos) {
                double fatorBarb = b.getId().equals(CatalogoDemo.BARBEIRO_DEMO_ID) ? 1.15 : b.getId().equals("brb-rafael") ? 1 : 0.85;
                int n = diff <= 0
                        ? (int) Math.round((1.6 + rnd() * 2) * fatorDia * fatorBarb)
                        : diff <= 3 ? entre(1, 4) : entre(0, 3);

                int cursor = abre + (rnd() < 0.5 ? 0 : passo);
                int colocados = 0;
                while (colocados < n) {
                    cursor += passo * (rnd() < 0.5 ? 0 : entre(1, 3));
                    List<String> combo = COMBOS.get(escolherIndice(pesosCombos)).ids();
                    int dur = combo.stream().mapToInt(id -> servicos.get(id).getDuracaoMin()).sum();
                    if (cursor + dur > fecha) break;
                    if (!livre(b.getId(), data, cursor, cursor + dur)) {
                        cursor += passo;
                        continue;
                    }
                    boolean jaPassou = diff < 0 || (diff == 0 && cursor + dur <= agora);
                    StatusAgendamento status;
                    FormaPagamento forma = FormaPagamento.NA_BARBEARIA;
                    MetodoPagamento metodo = null;
                    boolean pago = false;
                    if (jaPassou) {
                        double r = rnd();
                        status = r < 0.05 ? StatusAgendamento.NAO_COMPARECEU : r < 0.09 ? StatusAgendamento.CANCELADO : StatusAgendamento.CONCLUIDO;
                        if (status == StatusAgendamento.CONCLUIDO) {
                            pago = true;
                            if (rnd() < 0.25) {
                                forma = FormaPagamento.ONLINE;
                                metodo = rnd() < 0.6 ? MetodoPagamento.PIX : MetodoPagamento.CARTAO;
                            } else {
                                metodo = metodoBalcao();
                            }
                        }
                    } else {
                        status = rnd() < 0.65 ? StatusAgendamento.CONFIRMADO : StatusAgendamento.PENDENTE;
                        if (rnd() < 0.3) {
                            forma = FormaPagamento.ONLINE;
                            metodo = rnd() < 0.6 ? MetodoPagamento.PIX : MetodoPagamento.CARTAO;
                            pago = true;
                        }
                    }
                    String clienteId = CLIENTES[escolherIndice(PESOS_CLIENTES)];
                    lista.add(montar(clienteId, b.getId(), combo, data, cursor, status, forma, metodo, pago));
                    ocupar(b.getId(), data, cursor, cursor + dur);
                    cursor += (int) Math.ceil((double) dur / passo) * passo;
                    colocados++;
                }
            }
        }

        // ---------- ordem cronológica, ids definitivos e regra de fidelidade ----------
        lista.sort(Comparator.comparing(Agendamento::getData).thenComparing(Agendamento::getInicio));
        int meta = config.getFidelidadeMeta();
        BigDecimal pct = BigDecimal.valueOf(config.getFidelidadePercentual());
        Map<String, int[]> conta = new HashMap<>(); // [concluidos, usados]
        List<Agendamento> finais = new ArrayList<>();
        int idx = 0;
        for (Agendamento r : lista) {
            Agendamento a = comId(r, String.format("agd-%05d", ++idx));
            int[] c = conta.computeIfAbsent(a.getCliente().getId(), k -> new int[2]);
            if (a.getStatus().ocupaHorario() && c[0] / meta - c[1] > 0) {
                a.aplicarDesconto(a.getValorOriginal().multiply(pct).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP), true);
                c[1]++;
            }
            if (a.getStatus() == StatusAgendamento.CONCLUIDO) c[0]++;
            finais.add(a);
        }

        // um agendamento de amanhã chega como "Novo" para o barbeiro ver o destaque
        LocalDate amanha = proxAberto(hoje.plusDays(1));
        finais.stream()
                .filter(a -> a.getData().equals(amanha) && a.getBarbeiro().getId().equals(CatalogoDemo.BARBEIRO_DEMO_ID)
                        && !a.getCliente().getId().equals(CatalogoDemo.CLIENTE_DEMO_ID))
                .findFirst()
                .ifPresent(a -> {
                    a.setStatus(StatusAgendamento.PENDENTE);
                    a.setVistoPeloBarbeiro(false);
                    a.setCriadoPor(Perfil.CLIENTE);
                    a.setCriadoEm(Instant.now().minus(40, ChronoUnit.MINUTES));
                });

        return new Resultado(finais, gerarDespesas(inicioHist), bloqueios);
    }

    /** Recria o agendamento com o id definitivo (o id é imutável na entidade). */
    private static Agendamento comId(Agendamento r, String id) {
        Agendamento a = new Agendamento(id, r.getCliente(), r.getBarbeiro(), r.getServicos(), r.getData(), r.getInicio());
        a.setStatus(r.getStatus());
        a.setFormaPagamento(r.getFormaPagamento());
        a.setMetodoPagamento(r.getMetodoPagamento());
        a.setStatusPagamento(r.getStatusPagamento());
        a.setCriadoPor(r.getCriadoPor());
        a.setCriadoEm(r.getCriadoEm());
        a.setVistoPeloBarbeiro(r.isVistoPeloBarbeiro());
        return a;
    }

    private List<Despesa> gerarDespesas(LocalDate inicioHist) {
        List<Despesa> lista = new ArrayList<>();
        int[] id = {0};
        for (int m = 0; m <= 12; m++) {
            YearMonth mes = YearMonth.from(inicioHist).plusMonths(m);
            Adicionar add = (dia, desc, cat, valor) -> {
                LocalDate d = mes.atDay(dia);
                if (!d.isAfter(hoje)) lista.add(new Despesa("dsp-" + (++id[0]), desc, cat, Util.dinheiro(valor), d));
            };
            add.em(5, "Aluguel do salão", CategoriaDespesa.ALUGUEL, 2800);
            add.em(10, "Produtos (pomadas, óleos, lâminas)", CategoriaDespesa.PRODUTOS, 650 + rnd() * 450);
            add.em(15, "Conta de energia", CategoriaDespesa.CONTAS, 280 + rnd() * 120);
            add.em(15, "Conta de água", CategoriaDespesa.CONTAS, 90 + rnd() * 50);
            add.em(20, "Internet e telefone", CategoriaDespesa.CONTAS, 129.9);
            add.em(12, "Sistema e maquininha (taxas)", CategoriaDespesa.CONTAS, 180 + rnd() * 90);
            if (rnd() < 0.5) add.em(8, "Anúncios no Instagram", CategoriaDespesa.MARKETING, 200 + rnd() * 250);
            if (rnd() < 0.25) add.em(18, "Manutenção de máquinas", CategoriaDespesa.MANUTENCAO, 150 + rnd() * 300);
        }
        return lista;
    }

    @FunctionalInterface
    private interface Adicionar {
        void em(int dia, String descricao, CategoriaDespesa categoria, double valor);
    }
}

package br.com.vco.barbearia.negocio;

import br.com.vco.barbearia.dominio.Agendamento;
import br.com.vco.barbearia.dominio.Barbeiro;
import br.com.vco.barbearia.dominio.Despesa;
import br.com.vco.barbearia.dominio.Enums.MetodoPagamento;
import br.com.vco.barbearia.dominio.Enums.StatusAgendamento;
import br.com.vco.barbearia.dominio.Enums.StatusPagamento;
import br.com.vco.barbearia.dominio.ServicoAgendado;
import br.com.vco.barbearia.dto.Respostas.PeriodoDTO;
import br.com.vco.barbearia.dto.Respostas.PontoSerieDTO;
import br.com.vco.barbearia.dto.Respostas.RankingBarbeiroDTO;
import br.com.vco.barbearia.dto.Respostas.ResumoComparativoDTO;
import br.com.vco.barbearia.dto.Respostas.ResumoFinanceiroDTO;
import br.com.vco.barbearia.dto.Respostas.ServicoMaisVendidoDTO;
import br.com.vco.barbearia.repositorio.AgendamentoRepository;
import br.com.vco.barbearia.repositorio.BarbeiroRepository;
import br.com.vco.barbearia.repositorio.DespesaRepository;
import br.com.vco.barbearia.util.Util;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Faturamento considera apenas atendimentos CONCLUÍDOS e PAGOS,
 * pela data do atendimento.
 */
@Service
public class FinanceiroService {

    private static final String[] MESES = {"Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"};

    private final AgendamentoRepository agendamentos;
    private final DespesaRepository despesas;
    private final BarbeiroRepository barbeiros;

    public FinanceiroService(AgendamentoRepository agendamentos, DespesaRepository despesas, BarbeiroRepository barbeiros) {
        this.agendamentos = agendamentos;
        this.despesas = despesas;
        this.barbeiros = barbeiros;
    }

    public record Filtro(LocalDate inicio, LocalDate fim, String barbeiroId, MetodoPagamento metodo) {
        PeriodoDTO dto() {
            return new PeriodoDTO(inicio, fim, barbeiroId, metodo);
        }
    }

    private static boolean faturado(Agendamento a) {
        return a.getStatus() == StatusAgendamento.CONCLUIDO && a.getStatusPagamento() == StatusPagamento.PAGO;
    }

    private static boolean passa(Agendamento a, Filtro f) {
        return (f.barbeiroId() == null || a.getBarbeiro().getId().equals(f.barbeiroId()))
                && (f.metodo() == null || a.getMetodoPagamento() == f.metodo());
    }

    // ---------------- Resumo ----------------

    @Transactional(readOnly = true)
    public ResumoComparativoDTO resumo(Filtro f) {
        Filtro anterior = periodoComparavel(f);
        return new ResumoComparativoDTO(calcular(f), calcular(anterior), anterior.dto());
    }

    private ResumoFinanceiroDTO calcular(Filtro f) {
        List<Agendamento> doPeriodo = agendamentos.findByDataBetween(f.inicio(), f.fim()).stream()
                .filter(a -> f.barbeiroId() == null || a.getBarbeiro().getId().equals(f.barbeiroId()))
                .toList();
        List<Agendamento> pagos = doPeriodo.stream().filter(a -> faturado(a) && passa(a, f)).toList();
        BigDecimal faturamento = soma(pagos, Agendamento::getValorFinal);

        Map<String, Long> contagem = pagos.stream()
                .flatMap(a -> a.getServicos().stream())
                .collect(Collectors.groupingBy(ServicoAgendado::getNome, Collectors.counting()));
        ServicoMaisVendidoDTO top = contagem.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(e -> new ServicoMaisVendidoDTO(e.getKey(), e.getValue()))
                .orElse(null);

        long concluidos = doPeriodo.stream().filter(a -> a.getStatus() == StatusAgendamento.CONCLUIDO).count();
        long faltas = doPeriodo.stream().filter(a -> a.getStatus() == StatusAgendamento.NAO_COMPARECEU).count();

        BigDecimal totalDespesas = despesas.findByDataBetweenOrderByDataDesc(f.inicio(), f.fim()).stream()
                .map(Despesa::getValor).reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, BigDecimal> porMetodo = new LinkedHashMap<>();
        for (MetodoPagamento m : List.of(MetodoPagamento.DINHEIRO, MetodoPagamento.PIX, MetodoPagamento.CARTAO)) {
            porMetodo.put(m.json(), Util.r2(soma(pagos.stream().filter(a -> a.getMetodoPagamento() == m).toList(),
                    Agendamento::getValorFinal)));
        }

        return new ResumoFinanceiroDTO(
                Util.r2(faturamento),
                pagos.size(),
                pagos.isEmpty() ? Util.r2(BigDecimal.ZERO)
                        : faturamento.divide(BigDecimal.valueOf(pagos.size()), 2, RoundingMode.HALF_UP),
                Util.r2(soma(pagos, Agendamento::getDesconto)),
                Util.r2(totalDespesas),
                Util.r2(faturamento.subtract(totalDespesas)),
                concluidos + faltas == 0 ? 0 : (double) faltas / (concluidos + faltas),
                top,
                porMetodo);
    }

    /** Período anterior de mesmo tamanho (mês passado, ano passado, ou N dias antes). */
    static Filtro periodoAnterior(Filtro f) {
        LocalDate ini = f.inicio();
        LocalDate fim = f.fim();
        boolean anoCheio = ini.getDayOfYear() == 1 && fim.getMonthValue() == 12 && fim.getDayOfMonth() == 31
                && ini.getYear() == fim.getYear();
        boolean mesCheio = ini.getDayOfMonth() == 1 && fim.equals(YearMonth.from(ini).atEndOfMonth());
        if (anoCheio) return new Filtro(ini.minusYears(1), fim.minusYears(1), f.barbeiroId(), f.metodo());
        if (mesCheio) {
            YearMonth mes = YearMonth.from(ini).minusMonths(1);
            return new Filtro(mes.atDay(1), mes.atEndOfMonth(), f.barbeiroId(), f.metodo());
        }
        long dias = ChronoUnit.DAYS.between(ini, fim) + 1;
        return new Filtro(ini.minusDays(dias), fim.minusDays(dias), f.barbeiroId(), f.metodo());
    }

    /** Se o período ainda está em andamento, compara com o mesmo número de dias do anterior. */
    static Filtro periodoComparavel(Filtro f) {
        Filtro ant = periodoAnterior(f);
        LocalDate hoje = Util.hoje();
        if (!f.inicio().isAfter(hoje) && f.fim().isAfter(hoje)) {
            LocalDate limite = ant.inicio().plusDays(ChronoUnit.DAYS.between(f.inicio(), hoje));
            if (limite.isBefore(ant.fim())) return new Filtro(ant.inicio(), limite, f.barbeiroId(), f.metodo());
        }
        return ant;
    }

    // ---------------- Séries para gráficos ----------------

    /** Faturamento por dia de um mês, com o mesmo dia do mês anterior. */
    @Transactional(readOnly = true)
    public List<PontoSerieDTO> porDiaDoMes(YearMonth mes, String barbeiroId, MetodoPagamento metodo) {
        Map<Integer, BigDecimal> atual = somaPor(mes.atDay(1), mes.atEndOfMonth(), barbeiroId, metodo, a -> a.getData().getDayOfMonth());
        YearMonth antes = mes.minusMonths(1);
        Map<Integer, BigDecimal> anterior = somaPor(antes.atDay(1), antes.atEndOfMonth(), barbeiroId, metodo, a -> a.getData().getDayOfMonth());
        List<PontoSerieDTO> serie = new ArrayList<>();
        for (int d = 1; d <= mes.lengthOfMonth(); d++) {
            serie.add(new PontoSerieDTO(String.valueOf(d), Util.r2(atual.getOrDefault(d, BigDecimal.ZERO)),
                    Util.r2(anterior.getOrDefault(d, BigDecimal.ZERO))));
        }
        return serie;
    }

    /** Faturamento por mês de um ano; mês sem histórico no ano anterior fica null (sem linha). */
    @Transactional(readOnly = true)
    public List<PontoSerieDTO> porMesDoAno(int ano, String barbeiroId, MetodoPagamento metodo) {
        Map<Integer, BigDecimal> atual = somaPor(LocalDate.of(ano, 1, 1), LocalDate.of(ano, 12, 31), barbeiroId, metodo, a -> a.getData().getMonthValue());
        Map<Integer, BigDecimal> anterior = somaPor(LocalDate.of(ano - 1, 1, 1), LocalDate.of(ano - 1, 12, 31), barbeiroId, metodo, a -> a.getData().getMonthValue());
        List<PontoSerieDTO> serie = new ArrayList<>();
        for (int m = 1; m <= 12; m++) {
            BigDecimal ant = anterior.get(m);
            serie.add(new PontoSerieDTO(MESES[m - 1], Util.r2(atual.getOrDefault(m, BigDecimal.ZERO)),
                    ant == null ? null : Util.r2(ant)));
        }
        return serie;
    }

    private Map<Integer, BigDecimal> somaPor(LocalDate ini, LocalDate fim, String barbeiroId, MetodoPagamento metodo,
                                             Function<Agendamento, Integer> chave) {
        Filtro f = new Filtro(ini, fim, barbeiroId, metodo);
        Map<Integer, BigDecimal> mapa = new HashMap<>();
        for (Agendamento a : agendamentos.findByDataBetween(ini, fim)) {
            if (faturado(a) && passa(a, f)) mapa.merge(chave.apply(a), a.getValorFinal(), BigDecimal::add);
        }
        return mapa;
    }

    // ---------------- Ranking ----------------

    @Transactional(readOnly = true)
    public List<RankingBarbeiroDTO> ranking(Filtro f) {
        Filtro semBarbeiro = new Filtro(f.inicio(), f.fim(), null, f.metodo());
        Map<String, List<Agendamento>> porBarbeiro = agendamentos.findByDataBetween(f.inicio(), f.fim()).stream()
                .filter(a -> faturado(a) && passa(a, semBarbeiro))
                .collect(Collectors.groupingBy(a -> a.getBarbeiro().getId()));
        List<RankingBarbeiroDTO> ranking = new ArrayList<>();
        for (Barbeiro b : barbeiros.findAll()) {
            List<Agendamento> meus = porBarbeiro.getOrDefault(b.getId(), List.of());
            if (meus.isEmpty() && !b.isAtivo()) continue;
            ranking.add(new RankingBarbeiroDTO(b.getId(), b.getNome(), b.getCor(),
                    Util.r2(soma(meus, Agendamento::getValorFinal)), meus.size()));
        }
        ranking.sort(Comparator.comparing(RankingBarbeiroDTO::faturamento).reversed());
        return ranking;
    }

    private static BigDecimal soma(List<Agendamento> lista, Function<Agendamento, BigDecimal> campo) {
        return lista.stream().map(campo).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}

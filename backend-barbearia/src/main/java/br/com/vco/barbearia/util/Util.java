package br.com.vco.barbearia.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.concurrent.atomic.AtomicInteger;

/** Pequenos utilitários de data/hora, dinheiro e geração de ids. */
public final class Util {

    /** Fuso da barbearia: "hoje" e "agora" são calculados aqui. */
    public static final ZoneId FUSO = ZoneId.of("America/Sao_Paulo");

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final AtomicInteger CONTADOR = new AtomicInteger();

    private Util() {
    }

    public static LocalDate hoje() {
        return LocalDate.now(FUSO);
    }

    public static LocalTime agora() {
        return LocalTime.now(FUSO);
    }

    public static int minutos(LocalTime t) {
        return t.getHour() * 60 + t.getMinute();
    }

    public static LocalTime hora(int minutos) {
        return LocalTime.of(minutos / 60, minutos % 60);
    }

    /** Intervalos [aIni, aFim) e [bIni, bFim) se cruzam? */
    public static boolean sobrepoe(LocalTime aIni, LocalTime aFim, LocalTime bIni, LocalTime bFim) {
        return aIni.isBefore(bFim) && bIni.isBefore(aFim);
    }

    /** Dia da semana no padrão JavaScript: 0 = domingo ... 6 = sábado. */
    public static int diaSemana(LocalDate d) {
        return d.getDayOfWeek().getValue() % 7;
    }

    public static BigDecimal dinheiro(double v) {
        return BigDecimal.valueOf(v).setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal r2(BigDecimal v) {
        return v.setScale(2, RoundingMode.HALF_UP);
    }

    /** Id legível e único, ex.: "agd-mx3k9a1b2c". */
    public static String gerarId(String prefixo) {
        String tempo = Long.toString(System.currentTimeMillis(), 36);
        String seq = Integer.toString(CONTADOR.incrementAndGet() % 1296, 36);
        String aleatorio = Integer.toString(RANDOM.nextInt(1_679_616), 36);
        return prefixo + "-" + tempo + seq + aleatorio;
    }
}

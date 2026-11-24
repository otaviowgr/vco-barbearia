package br.com.vco.barbearia.negocio;

/** Formata telefones brasileiros como (48) 99999-0000. */
final class Telefone {

    private Telefone() {
    }

    static String formatar(String bruto) {
        if (bruto == null) return "";
        String d = bruto.replaceAll("\\D", "");
        if (d.startsWith("55") && (d.length() == 12 || d.length() == 13)) d = d.substring(2);
        if (d.length() > 11) d = d.substring(0, 11);
        if (d.length() < 10) return d;
        String ddd = d.substring(0, 2);
        String numero = d.substring(2);
        int corte = numero.length() - 4;
        return "(" + ddd + ") " + numero.substring(0, corte) + "-" + numero.substring(corte);
    }
}

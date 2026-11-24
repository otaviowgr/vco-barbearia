package br.com.vco.barbearia.dominio;

/**
 * Enumerações do domínio. No JSON elas aparecem em minúsculas
 * (ex.: "nao_compareceu"), igual ao front-end. No banco ficam
 * gravadas pelo nome da constante (ex.: NAO_COMPARECEU).
 */
public final class Enums {

    private Enums() {
    }

    /** Converte "nao_compareceu" ⇄ NAO_COMPARECEU. */
    public interface EnumJson {
        default String json() {
            return ((Enum<?>) this).name().toLowerCase();
        }
    }

    public enum Perfil implements EnumJson {
        CLIENTE, BARBEIRO;

        @com.fasterxml.jackson.annotation.JsonValue
        public String json() { return EnumJson.super.json(); }
    }

    public enum StatusAgendamento implements EnumJson {
        PENDENTE, CONFIRMADO, CONCLUIDO, CANCELADO, NAO_COMPARECEU;

        @com.fasterxml.jackson.annotation.JsonValue
        public String json() { return EnumJson.super.json(); }

        /** Ocupa a agenda (cancelado e falta liberam o horário). */
        public boolean ocupaHorario() {
            return this != CANCELADO && this != NAO_COMPARECEU;
        }

        public boolean emAberto() {
            return this == PENDENTE || this == CONFIRMADO;
        }
    }

    /** Quando o cliente paga: antecipado (online) ou no balcão. */
    public enum FormaPagamento implements EnumJson {
        ONLINE, NA_BARBEARIA;

        @com.fasterxml.jackson.annotation.JsonValue
        public String json() { return EnumJson.super.json(); }
    }

    public enum MetodoPagamento implements EnumJson {
        PIX, CARTAO, DINHEIRO;

        @com.fasterxml.jackson.annotation.JsonValue
        public String json() { return EnumJson.super.json(); }
    }

    public enum StatusPagamento implements EnumJson {
        PENDENTE, PAGO, ESTORNADO;

        @com.fasterxml.jackson.annotation.JsonValue
        public String json() { return EnumJson.super.json(); }
    }

    public enum CategoriaDespesa implements EnumJson {
        ALUGUEL, PRODUTOS, CONTAS, MARKETING, MANUTENCAO, OUTROS;

        @com.fasterxml.jackson.annotation.JsonValue
        public String json() { return EnumJson.super.json(); }
    }
}

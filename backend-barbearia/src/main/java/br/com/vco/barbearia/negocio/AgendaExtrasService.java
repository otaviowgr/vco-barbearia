package br.com.vco.barbearia.negocio;

import br.com.vco.barbearia.config.ApiException;
import br.com.vco.barbearia.dominio.Agendamento;
import br.com.vco.barbearia.dominio.Bloqueio;
import br.com.vco.barbearia.dominio.Despesa;
import br.com.vco.barbearia.dominio.Enums.MetodoPagamento;
import br.com.vco.barbearia.dto.Requisicoes.BloqueioRequest;
import br.com.vco.barbearia.dto.Requisicoes.DespesaRequest;
import br.com.vco.barbearia.dto.Respostas.BloqueioDTO;
import br.com.vco.barbearia.dto.Respostas.PagamentoAprovadoDTO;
import br.com.vco.barbearia.dto.Respostas.PixDTO;
import br.com.vco.barbearia.repositorio.AgendamentoRepository;
import br.com.vco.barbearia.repositorio.BarbeiroRepository;
import br.com.vco.barbearia.repositorio.BloqueioRepository;
import br.com.vco.barbearia.repositorio.DespesaRepository;
import br.com.vco.barbearia.util.Util;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/** Bloqueios de horário, despesas e pagamento online simulado. */
@Service
public class AgendaExtrasService {

    private final BloqueioRepository bloqueios;
    private final DespesaRepository despesas;
    private final BarbeiroRepository barbeiros;
    private final AgendamentoRepository agendamentos;

    public AgendaExtrasService(BloqueioRepository bloqueios, DespesaRepository despesas,
                               BarbeiroRepository barbeiros, AgendamentoRepository agendamentos) {
        this.bloqueios = bloqueios;
        this.despesas = despesas;
        this.barbeiros = barbeiros;
        this.agendamentos = agendamentos;
    }

    // ---------------- Bloqueios ----------------

    @Transactional(readOnly = true)
    public List<BloqueioDTO> listarBloqueios(LocalDate inicio, LocalDate fim, String barbeiroId) {
        LocalDate de = inicio != null ? inicio : LocalDate.of(2000, 1, 1);
        LocalDate ate = fim != null ? fim : LocalDate.of(2100, 1, 1);
        return bloqueios.findByDataBetweenOrderByDataAscInicioAsc(de, ate).stream()
                .filter(b -> barbeiroId == null || b.getBarbeiro().getId().equals(barbeiroId))
                .map(BloqueioDTO::de)
                .toList();
    }

    @Transactional
    public BloqueioDTO criarBloqueio(BloqueioRequest r) {
        if (!r.fim().isAfter(r.inicio())) throw ApiException.regra("O horário final precisa ser depois do inicial.");
        var barbeiro = barbeiros.findById(r.barbeiroId())
                .orElseThrow(() -> ApiException.naoEncontrado("Barbeiro não encontrado."));
        Agendamento conflito = agendamentos.findByData(r.data()).stream()
                .filter(a -> a.getBarbeiro().getId().equals(r.barbeiroId())
                        && a.getStatus().emAberto()
                        && Util.sobrepoe(r.inicio(), r.fim(), a.getInicio(), a.getFim()))
                .min(java.util.Comparator.comparing(Agendamento::getInicio)).orElse(null);
        if (conflito != null) {
            throw ApiException.conflito("Já existe um agendamento às " + conflito.getInicio()
                    + " nesse intervalo. Remarque-o antes de bloquear.");
        }
        String motivo = r.motivo() == null || r.motivo().isBlank() ? "Horário bloqueado" : r.motivo().trim();
        Bloqueio b = new Bloqueio(Util.gerarId("blq"), barbeiro, r.data(), r.inicio(), r.fim(), motivo);
        return BloqueioDTO.de(bloqueios.save(b));
    }

    @Transactional
    public void removerBloqueio(String id) {
        bloqueios.deleteById(id);
    }

    // ---------------- Despesas ----------------

    @Transactional(readOnly = true)
    public List<Despesa> listarDespesas(LocalDate inicio, LocalDate fim) {
        LocalDate de = inicio != null ? inicio : LocalDate.of(2000, 1, 1);
        LocalDate ate = fim != null ? fim : LocalDate.of(2100, 1, 1);
        return despesas.findByDataBetweenOrderByDataDesc(de, ate);
    }

    @Transactional
    public Despesa criarDespesa(DespesaRequest r) {
        return despesas.save(new Despesa(Util.gerarId("dsp"), r.descricao().trim(), r.categoria(), Util.r2(r.valor()), r.data()));
    }

    @Transactional
    public void removerDespesa(String id) {
        despesas.deleteById(id);
    }

    // ---------------- Pagamento simulado ----------------

    /** Gera um "Pix copia e cola" ilustrativo. Nenhum pagamento real acontece. */
    public PixDTO gerarPix(BigDecimal valor) {
        String txid = UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase(Locale.ROOT);
        String v = Util.r2(valor).toPlainString();
        String codigo = "00020126580014BR.GOV.BCB.PIX0136vco-barbearia-demo@pix.com.br520400005303986540"
                + v.length() + v + "5802BR5913VCO BARBEARIA6013FLORIANOPOLIS62140510" + txid + "6304DEMO";
        return new PixDTO(codigo, txid, 600);
    }

    public PagamentoAprovadoDTO aprovar(MetodoPagamento metodo, BigDecimal valor) {
        if (metodo == MetodoPagamento.DINHEIRO) throw ApiException.regra("Dinheiro só é aceito na barbearia.");
        return new PagamentoAprovadoDTO(true, metodo, Util.r2(valor),
                "TX-" + Long.toString(System.currentTimeMillis(), 36).toUpperCase(Locale.ROOT));
    }
}

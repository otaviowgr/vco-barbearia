package br.com.vco.barbearia.negocio;

import br.com.vco.barbearia.config.ApiException;
import br.com.vco.barbearia.dominio.Barbeiro;
import br.com.vco.barbearia.dominio.Servico;
import br.com.vco.barbearia.dto.Requisicoes.BarbeiroRequest;
import br.com.vco.barbearia.dto.Requisicoes.ServicoRequest;
import br.com.vco.barbearia.repositorio.BarbeiroRepository;
import br.com.vco.barbearia.repositorio.ServicoRepository;
import br.com.vco.barbearia.util.Util;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

/** Serviços oferecidos (cortes, barba...) e barbeiros da equipe. */
@Service
public class CatalogoService {

    private static final String FOTO_PADRAO =
            "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=70";

    private final ServicoRepository servicos;
    private final BarbeiroRepository barbeiros;

    public CatalogoService(ServicoRepository servicos, BarbeiroRepository barbeiros) {
        this.servicos = servicos;
        this.barbeiros = barbeiros;
    }

    // ---------------- Serviços ----------------

    @Transactional(readOnly = true)
    public List<Servico> listarServicos(boolean incluirInativos) {
        List<Servico> lista = incluirInativos ? servicos.findAll() : servicos.findByAtivoTrue();
        return lista.stream().sorted(Comparator.comparing(Servico::isDestaque).reversed()
                .thenComparing(Servico::getNome)).toList();
    }

    @Transactional
    public Servico criarServico(ServicoRequest r) {
        Servico s = new Servico(Util.gerarId("srv"), r.nome().trim(), r.descricao(), r.duracaoMin(),
                Util.r2(r.preco()), foto(r.foto()), r.ativo(), r.destaque());
        return servicos.save(s);
    }

    @Transactional
    public Servico atualizarServico(String id, ServicoRequest r) {
        Servico s = obterServico(id);
        s.setNome(r.nome().trim());
        s.setDescricao(r.descricao());
        s.setDuracaoMin(r.duracaoMin());
        s.setPreco(Util.r2(r.preco()));
        s.setFoto(foto(r.foto()));
        s.setAtivo(r.ativo());
        s.setDestaque(r.destaque());
        return s;
    }

    @Transactional
    public Servico alternarServico(String id) {
        Servico s = obterServico(id);
        s.setAtivo(!s.isAtivo());
        return s;
    }

    public Servico obterServico(String id) {
        return servicos.findById(id).orElseThrow(() -> ApiException.naoEncontrado("Serviço não encontrado."));
    }

    private static String foto(String url) {
        return url == null || url.isBlank() ? FOTO_PADRAO : url.trim();
    }

    // ---------------- Barbeiros ----------------

    @Transactional(readOnly = true)
    public List<Barbeiro> listarBarbeiros(boolean incluirInativos) {
        List<Barbeiro> lista = incluirInativos ? barbeiros.findAll() : barbeiros.findByAtivoTrue();
        // o dono (com login) aparece primeiro
        return lista.stream().sorted(Comparator.comparing(Barbeiro::isTemLogin).reversed()
                .thenComparing(Barbeiro::getNome)).toList();
    }

    @Transactional
    public Barbeiro criarBarbeiro(BarbeiroRequest r) {
        Barbeiro b = new Barbeiro(Util.gerarId("brb"), r.nome().trim(), r.especialidade(), r.bio(), r.foto(),
                r.telefone(), r.cor() == null ? "#3fb37f" : r.cor(), r.ativo(), false);
        return barbeiros.save(b);
    }

    @Transactional
    public Barbeiro atualizarBarbeiro(String id, BarbeiroRequest r) {
        Barbeiro b = obterBarbeiro(id);
        if (b.isTemLogin() && !r.ativo()) {
            throw ApiException.regra("O barbeiro administrador não pode ser desativado.");
        }
        b.setNome(r.nome().trim());
        b.setEspecialidade(r.especialidade());
        b.setBio(r.bio());
        b.setFoto(r.foto());
        b.setTelefone(r.telefone());
        if (r.cor() != null) b.setCor(r.cor());
        b.setAtivo(r.ativo());
        return b;
    }

    @Transactional
    public Barbeiro alternarBarbeiro(String id) {
        Barbeiro b = obterBarbeiro(id);
        if (b.isTemLogin() && b.isAtivo()) {
            throw ApiException.regra("O barbeiro administrador não pode ser desativado.");
        }
        b.setAtivo(!b.isAtivo());
        return b;
    }

    public Barbeiro obterBarbeiro(String id) {
        return barbeiros.findById(id).orElseThrow(() -> ApiException.naoEncontrado("Barbeiro não encontrado."));
    }
}

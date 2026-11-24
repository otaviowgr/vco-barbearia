package br.com.vco.barbearia.negocio;

import br.com.vco.barbearia.config.ApiException;
import br.com.vco.barbearia.dominio.ConfigBarbearia;
import br.com.vco.barbearia.dto.Requisicoes.ConfigRequest;
import br.com.vco.barbearia.dto.Requisicoes.HorarioDiaRequest;
import br.com.vco.barbearia.repositorio.ConfigRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class ConfigService {

    private final ConfigRepository repo;

    public ConfigService(ConfigRepository repo) {
        this.repo = repo;
    }

    @Transactional(readOnly = true)
    public ConfigBarbearia obter() {
        return repo.findById(ConfigBarbearia.ID_UNICO)
                .orElseThrow(() -> ApiException.naoEncontrado("Configuração da barbearia não encontrada."));
    }

    @Transactional
    public ConfigBarbearia salvar(ConfigRequest r) {
        ConfigBarbearia c = obter();
        c.setNome(r.nome().trim());
        c.setSlogan(r.slogan());
        c.setSobre(r.sobre());
        c.setEndereco(r.endereco());
        c.setCidade(r.cidade());
        c.setTelefone(r.telefone());
        c.setWhatsapp(r.whatsapp() == null ? null : r.whatsapp().replaceAll("\\D", ""));
        c.setInstagram(r.instagram());
        c.setIntervaloSlotsMin(r.intervaloSlotsMin());
        c.setFidelidadeMeta(r.fidelidade().meta());
        c.setFidelidadePercentual(r.fidelidade().percentual());

        List<ConfigBarbearia.Horario> horarios = new ArrayList<>();
        for (int dia = 0; dia < 7; dia++) {
            HorarioDiaRequest h = r.horarios().get(dia);
            if (h == null || h.abre() == null || h.fecha() == null) continue; // fechado
            if (!h.fecha().isAfter(h.abre())) {
                throw ApiException.regra("O horário de fechamento precisa ser depois da abertura.");
            }
            horarios.add(new ConfigBarbearia.Horario(dia, h.abre(), h.fecha()));
        }
        c.setHorarios(horarios);
        return repo.save(c);
    }
}

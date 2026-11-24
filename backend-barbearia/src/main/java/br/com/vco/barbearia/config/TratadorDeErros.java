package br.com.vco.barbearia.config;

import br.com.vco.barbearia.dto.Respostas.ErroDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/** Transforma exceções em respostas JSON: { status, erro, mensagem }. */
@RestControllerAdvice
public class TratadorDeErros {

    private static final Logger log = LoggerFactory.getLogger(TratadorDeErros.class);

    @ExceptionHandler(ApiException.class)
    ResponseEntity<ErroDTO> api(ApiException e) {
        return resposta(e.getStatus(), e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErroDTO> validacao(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(f -> f.getDefaultMessage() != null ? f.getDefaultMessage() : f.getField() + " inválido")
                .orElse("Dados inválidos.");
        return resposta(HttpStatus.BAD_REQUEST, msg);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    ResponseEntity<ErroDTO> formato(Exception e) {
        log.warn("Requisição com formato inválido: {}", e.getMessage());
        return resposta(HttpStatus.BAD_REQUEST, "Dados em formato inválido.");
    }

    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<ErroDTO> naoEncontrado(NoResourceFoundException e) {
        return resposta(HttpStatus.NOT_FOUND, "Endereço não encontrado.");
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ErroDTO> inesperado(Exception e) {
        log.error("Erro inesperado", e);
        return resposta(HttpStatus.INTERNAL_SERVER_ERROR, "Erro inesperado no servidor.");
    }

    private ResponseEntity<ErroDTO> resposta(HttpStatus status, String mensagem) {
        return ResponseEntity.status(status).body(new ErroDTO(status.value(), status.getReasonPhrase(), mensagem));
    }
}

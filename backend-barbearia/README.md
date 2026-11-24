# VCO Barbearia — API (Spring Boot + H2 / MySQL)

Back-end do sistema da VCO Barbearia. É uma API REST com as mesmas regras do protótipo:
- agenda sem horários sobrepostos;
- plano fidelidade;
- pagamento simulado;
- financeiro com comparação ao período anterior;
- dados de demonstração gerados a partir da data de hoje.

**Stack:** Java 21, Spring Boot 4.2, Spring Web MVC, Spring Data JPA (Hibernate), Bean Validation, **H2** (padrão, em arquivo) ou **MySQL 8** (opcional), BCrypt para senhas e Springdoc (Swagger UI).

---

## Como rodar

Pré-requisito: **JDK 21 ou superior**. O Maven **não** precisa estar instalado: o projeto usa o Maven Wrapper (`mvnw`).

### Padrão: banco H2 (não precisa instalar nem criar nada)

```bash
cd backend-barbearia
./mvnw spring-boot:run       # Linux/Mac
mvnw.cmd spring-boot:run     # Windows
```

- **Criação automática:** na primeira execução, o banco é criado no arquivo `backend-barbearia/data/vco-barbearia.mv.db`, com todas as tabelas e os dados da demonstração.
- **Persistência:** o que for feito pelo sistema (agendamentos, clientes, despesas...) **continua salvo** depois de reiniciar a API.
- **Recomeçar do zero:** use o botão "Restaurar dados da demonstração" no site, ou apague a pasta `data/` com a API desligada.

**Ver as tabelas (console web do H2):** com a API rodando, abra http://localhost:8080/h2-console e preencha:

| Campo | Valor |
|---|---|
| JDBC URL | `jdbc:h2:file:./data/vco-barbearia;AUTO_SERVER=TRUE` |
| User Name | `sa` |
| Password | *(vazio)* |

Depois é só clicar em **Connect** e rodar SQL normalmente, por exemplo:
`SELECT status, COUNT(*) FROM agendamento GROUP BY status;`

> O H2 roda em "modo MySQL", então o SQL é praticamente o mesmo do MySQL.

### Banco só em memória (perfil `dev`)

Para testar com tudo zerado a cada execução:

```bash
mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
```

### Opcional: usar MySQL (perfil `mysql`)

Também aqui **não é preciso criar nada no Workbench**: o banco `vco_barbearia` e as tabelas são criados automaticamente. Informe a conexão por variáveis de ambiente:

| Variável | Padrão | Descrição |
|---|---|---|
| `DB_HOST` | `localhost` | servidor MySQL |
| `DB_PORT` | `3306` | porta |
| `DB_NAME` | `vco_barbearia` | nome do banco |
| `DB_USER` | `root` | usuário |
| `DB_PASSWORD` | *(vazio)* | senha |

Windows (PowerShell):
```powershell
$env:DB_PORT="3307"; $env:DB_PASSWORD="sua_senha"
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=mysql"
```

Linux/Mac:
```bash
DB_PASSWORD=sua_senha ./mvnw spring-boot:run -Dspring-boot.run.profiles=mysql
```

Na primeira vez que sobe com o banco vazio, a API carrega os dados da demonstração:
- 3 barbeiros, 7 serviços e 12 clientes;
- cerca de 2.800 agendamentos em 12 meses;
- despesas mensais.

### Ligar o front-end na API

Com a API rodando, em outro terminal:

```bash
cd frontend-barbearia
npm run dev:api        # front-end usando http://localhost:8080/api
```

O comando `npm run dev` (sem `:api`) continua no **modo demonstração**, que usa o localStorage e não precisa da API.

### Testes

```bash
./mvnw test
```

Os testes usam H2. O teste de integração percorre o fluxo completo:
1. o cliente agenda;
2. o sistema recusa um segundo agendamento no mesmo horário;
3. o barbeiro conclui;
4. o faturamento sobe;
5. a fidelidade libera 20%, aplicados no próximo agendamento;
6. cancelar esse agendamento devolve o desconto.

---

## Documentação da API

Com a API rodando, a documentação interativa (dá para testar cada endpoint) fica em:
- **Swagger UI:** http://localhost:8080/swagger-ui.html
- **OpenAPI (JSON):** http://localhost:8080/v3/api-docs

Principais endpoints (todos com o prefixo `/api`):

| Recurso | Endpoints |
|---|---|
| Autenticação | `POST /auth/login` · `POST /auth/demo/{cliente\|barbeiro}` · `POST /auth/cadastro` |
| Agendamentos | `GET /agendamentos` (filtros: `data`, `inicio`, `fim`, `barbeiroId`, `clienteId`, `status`) · `GET /agendamentos/{id}` · `GET /agendamentos/horarios-disponiveis` · `GET /agendamentos/nao-vistos/contagem` · `POST /agendamentos` · `POST /agendamentos/{id}/confirmar` · `.../concluir` · `.../remarcar` · `.../cancelar` · `.../nao-compareceu` · `POST /agendamentos/vistos` |
| Serviços | `GET/POST /servicos` · `PUT /servicos/{id}` · `PATCH /servicos/{id}/alternar-ativo` |
| Barbeiros | `GET/POST /barbeiros` · `PUT /barbeiros/{id}` · `PATCH /barbeiros/{id}/alternar-ativo` |
| Clientes | `GET /clientes?busca=` · `GET /clientes/basico` · `GET /clientes/{id}/ficha` · `POST /clientes` · `PUT /clientes/{id}` |
| Fidelidade | `GET /fidelidade/{clienteId}` · `GET /fidelidade/{clienteId}/simular?valor=` |
| Financeiro | `GET /financeiro/resumo` · `GET /financeiro/por-dia?mes=yyyy-MM` · `GET /financeiro/por-mes?ano=` · `GET /financeiro/ranking` |
| Bloqueios / Despesas | `GET/POST /bloqueios` · `DELETE /bloqueios/{id}` · `GET/POST /despesas` · `DELETE /despesas/{id}` |
| Pagamento (simulado) | `POST /pagamentos/pix` · `POST /pagamentos/aprovar` |
| Configurações | `GET/PUT /config` · `POST /demo/restaurar` |

Os erros sempre vêm neste formato:
```json
{ "status": 409, "erro": "Conflict", "mensagem": "Esse horário acabou de ser ocupado. Escolha outro, por favor." }
```

---

## Estrutura

```
src/main/java/br/com/vco/barbearia/
├─ dominio/       entidades JPA (Agendamento, Servico, Barbeiro, Cliente, Usuario, Bloqueio, Despesa, ConfigBarbearia) e enums
├─ repositorio/   interfaces Spring Data JPA
├─ negocio/       regras de negócio (agenda, fidelidade, financeiro, clientes, autenticação...)
├─ controle/      controllers REST (/api/...)
├─ dto/           objetos de entrada (Requisicoes) e saída (Respostas), com validação
├─ demo/          dados da demonstração (catálogo + gerador de 12 meses de movimento)
├─ config/        CORS, tratamento de erros, BCrypt, conversão de enums
└─ util/          datas (fuso America/Sao_Paulo), dinheiro e geração de ids
```

### Modelo de dados (tabelas)

- `servico` · `barbeiro` · `cliente` · `usuario` (perfil cliente ou barbeiro, senha em BCrypt)
- `agendamento`: cliente, barbeiro, data, início e fim, valores, desconto, forma, método e status do pagamento, status do atendimento.
- `agendamento_servico`: cópia dos serviços no momento do agendamento. Se o preço mudar depois, o histórico continua correto.
- `bloqueio` · `despesa`
- `config_barbearia` + `config_horario`: dados da barbearia, horários e regra de fidelidade.

---

## Observações e próximos passos

- **Autenticação:** é simplificada. O login devolve os dados da sessão, mas as rotas ainda não são protegidas. Para produção, o próximo passo é Spring Security com JWT.
- **Pagamentos:** são **simulados**. Para produção, integrar com um gateway (Mercado Pago, Stripe, PagSeguro...).
- **Tabelas:** são criadas pelo Hibernate (`ddl-auto=update`). Em produção, o ideal é versionar o banco com Flyway ou Liquibase.

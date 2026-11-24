# VCO Barbearia — protótipo navegável

Protótipo funcional de um sistema de agendamento e gestão para barbearia, feito para **apresentação**.

- **Sem banco de dados e sem back-end:** todos os dados são fictícios e ficam salvos no navegador (localStorage).
- **Os dois perfis compartilham os dados:** o que o cliente faz aparece para o barbeiro, e o contrário também.
- **Mobile-first:** fica bem no celular e também no notebook ou projetor.

Stack: **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4**, com Recharts (gráficos), lucide-react (ícones) e qrcode.react (QR Code do Pix ilustrativo).

---

## Como instalar e rodar

Pré-requisito: **Node.js 20 ou superior**.

```bash
cd frontend-barbearia
npm install
npm run dev
```

Depois, abra **http://localhost:3000** no navegador.

Os dados iniciais são carregados automaticamente na primeira vez que o site abre.

### Abrir no celular (mesma rede Wi-Fi)

1. Rode `npm run dev` no computador.
2. Descubra o IP local do computador com `ipconfig` (Windows) ou `ifconfig` (Mac/Linux).
3. No celular, abra `http://SEU-IP:3000`, por exemplo `http://192.168.0.15:3000`.

> Cada navegador ou dispositivo tem o seu próprio localStorage. Para a demonstração "cliente → barbeiro" funcionar, use o **mesmo navegador**. Funciona até em duas abas lado a lado: uma atualiza sozinha quando a outra muda algo.

### Versão otimizada (opcional)

```bash
npm run build
npm start
```

---

## Logins de demonstração

| Perfil | Nome | E-mail | Senha |
|---|---|---|---|
| Cliente | João Silva — (48) 99999-0000 | `cliente@demo.com` | `123456` |
| Barbeiro (dono/admin) | Carlos | `barbeiro@demo.com` | `123456` |

Atalhos durante a apresentação:

- **Tela de login:** botões **"Entrar como Cliente (demo)"** e **"Entrar como Barbeiro (demo)"**.
- **Topo de qualquer tela:** botão **"Trocar perfil"**, que alterna entre cliente e barbeiro na hora.
- **Configurações** (menu do avatar → Configurações): botão **"Restaurar dados da demonstração"**. Ele apaga tudo e recria os dados iniciais, com as datas ajustadas para o dia de hoje.

Também é possível criar uma conta nova de cliente pela aba "Sou novo aqui". Ela fica salva no localStorage.

---

## Roteiro sugerido de apresentação (≈ 8 minutos)

> **Antes de começar:** entre como barbeiro, vá em Configurações e clique em **Restaurar dados da demonstração**. Assim tudo começa limpo e com datas atuais.
> **Dica:** o João começa com **9 atendimentos concluídos**, ou seja, falta 1 para ganhar 20% de desconto. O roteiro usa isso para mostrar o plano fidelidade funcionando.

### 1. Cliente: vitrine e agendamento

1. Na tela de login, clique em **Entrar como Cliente (demo)**.
2. Mostre a **vitrine**:
   - serviços com foto, descrição, duração e preço;
   - "Nossa equipe";
   - horário de funcionamento;
   - botão flutuante do WhatsApp;
   - card **Plano fidelidade** com o aviso "Falta só 1 corte para ganhar 20%".
3. Clique em **Agendar horário** e siga as etapas (a barra de progresso acompanha):
   1. Escolha **Corte + Barba** (pode somar Sobrancelha para mostrar preço e duração somando).
   2. Escolha **Qualquer barbeiro disponível**.
   3. Escolha **Hoje** (se ainda houver horário) ou **amanhã**.
   4. Escolha um horário. Só aparecem horários livres, calculados pela duração e pela agenda de cada barbeiro.
   5. Escolha **Pix**.
   6. No resumo, mostre valor original, desconto e total, e clique em **Pagar e confirmar**.
4. No Pix: mostre o QR Code, o botão **Copiar código** e clique em **Simular pagamento aprovado**.
5. A tela de confirmação aparece com animação. Clique em **Ver meus agendamentos**: o status está "Aguardando confirmação" e o pagamento aparece como "Pago".

### 2. Barbeiro: agenda e ações

1. Clique em **Trocar perfil** no topo. Você entra como **Carlos (barbeiro/admin)**.
2. A **Agenda** mostra:
   - o aviso **"novo agendamento pelo app"**;
   - o selo **Novo** piscando no bloco;
   - o contador no menu.
3. Mostre a visão **Dia** (uma coluna por barbeiro) e a visão **Semana**.
4. Clique no agendamento do João. No detalhe, mostre:
   - os serviços, o valor e a forma de pagamento;
   - os botões **WhatsApp** (abre o wa.me com uma mensagem pronta sobre o horário) e **Ligar**.
5. Clique em **Confirmar agendamento**.
6. Abra o agendamento de novo e clique em **Concluir atendimento**.
   - Se o pagamento ficou para a barbearia, aparece a escolha de **Dinheiro, Pix ou Cartão**.
7. Outras ações para mostrar, se houver tempo:
   - **Remarcar** (escolhendo outro barbeiro ou outra data);
   - **Não compareceu**;
   - **Cancelar**;
   - **Bloquear horário**;
   - **Novo agendamento** manual (também dá para clicar num espaço vazio da agenda).

### 3. Volta ao cliente: status atualizado

1. Clique em **Trocar perfil** de novo.
2. Em **Meus horários**, o atendimento aparece como **Concluído** no histórico.
3. Em **Fidelidade**, o card mostra **"Você ganhou 20% de desconto no próximo atendimento!"**.
4. *(Opcional)* Faça um novo agendamento: o resumo mostra o **desconto fidelidade aplicado automaticamente**.

### 4. Barbeiro: dashboard financeiro

1. Clique em **Trocar perfil** e abra **Financeiro**.
2. Mostre os indicadores:
   - faturamento do mês, já com o atendimento que acabou de ser concluído;
   - atendimentos e ticket médio;
   - lucro líquido em verde (lucro) ou vermelho (prejuízo);
   - serviço mais vendido;
   - taxa de faltas;
   - descontos de fidelidade.
3. Mostre os gráficos:
   - faturamento **por dia do mês** contra o mês anterior;
   - faturamento **por mês do ano** contra o ano anterior;
   - **ranking de barbeiros**;
   - divisão **por forma de pagamento**.
4. Troque entre **Diário, Mensal, Anual e Período**, e filtre por **barbeiro** e por **forma de pagamento**.
5. Lance uma **despesa** e mostre o lucro sendo recalculado.
6. *(Opcional)* Mostre também:
   - **Clientes:** busca e ficha completa com histórico, total gasto, fidelidade, WhatsApp e Ligar;
   - **Serviços** e **Equipe:** cadastrar, editar e desativar.

---

## Funcionalidades

**Cliente**

- Vitrine com serviços em destaque, equipe, informações da barbearia e WhatsApp flutuante.
- Agendamento em 6 etapas:
  - vários serviços somando preço e duração;
  - escolha de barbeiro ou "qualquer disponível";
  - calendário;
  - horários livres sem sobreposição;
  - pagamento simulado (Pix com QR Code ou cartão);
  - resumo com desconto de fidelidade e confirmação animada.
- Meus horários: próximos e histórico, com status do atendimento e do pagamento, remarcar, cancelar (com estorno simulado) e "agendar novamente".
- Plano fidelidade: a cada **5** atendimentos concluídos, **20%** de desconto no próximo, aplicado automaticamente. A regra pode ser mudada nas configurações do barbeiro.

**Barbeiro (dono/admin)**

- Agenda:
  - visões **Dia** (coluna por barbeiro) e **Semana**, em formato de timeline;
  - linha do horário atual;
  - destaque **Novo**.
- Ações sobre o agendamento: confirmar, concluir (registrando dinheiro, Pix ou cartão), remarcar, cancelar, não compareceu.
- Agendamento manual (inclusive cadastrando um cliente na hora) e bloqueio de horários.
- Clientes: busca e ficha com contato, histórico, total gasto, fidelidade, WhatsApp com mensagem pronta e Ligar.
- Serviços e equipe: cadastrar, editar e ativar ou desativar.
- Financeiro:
  - faturamento diário, mensal, anual e por período (só atendimentos **concluídos e pagos**);
  - filtros por barbeiro e por forma de pagamento;
  - gráficos com comparação ao período anterior;
  - ranking de barbeiros;
  - indicadores;
  - despesas e **lucro líquido**.
- Configurações: dados da barbearia, horário de funcionamento, regra de fidelidade e restaurar a demonstração.

---

## Estrutura do projeto

```
src/
├─ app/                      páginas (App Router)
│  ├─ login/                 login, cadastro e atalhos de demonstração
│  ├─ cliente/               vitrine, agendar, agendamentos, fidelidade, perfil
│  └─ barbeiro/              agenda, clientes, financeiro, servicos, equipe, configuracoes
├─ components/
│  ├─ ui/                    botão, modal, toast, skeleton, inputs...
│  ├─ layout/                barra superior, navegação inferior, proteção de rotas
│  ├─ agenda/                calendário, grade de horários, remarcar
│  ├─ cliente/               cards de serviço, agendamento, fidelidade, pagamento simulado
│  └─ barbeiro/              timeline, detalhe do agendamento, modais, gráficos
├─ services/                 "API" simulada (localStorage + atraso artificial)
├─ data/seed/                dados fictícios iniciais (gerados a partir da data de hoje)
├─ hooks/                    useApi (carrega dados e atualiza sozinho quando algo muda)
├─ lib/                      datas, formatadores, rótulos de status
└─ types/                    tipos do domínio (Agendamento, Servico, Barbeiro...)
```

### Trocar pelo back-end real (Spring Boot + MySQL)

As telas **nunca** acessam o localStorage diretamente. Elas só chamam as funções de `src/services`, que são `async` e imitam chamadas HTTP:

- `agendamentoService.criar()`;
- `financeiroService.resumo()`;
- e assim por diante.

Para ligar no back-end, basta reescrever o corpo dessas funções com `fetch()` para a API REST, mantendo os mesmos nomes, parâmetros e tipos de retorno. Os tipos em `src/types` servem de contrato para as entidades e DTOs do Spring Boot.

---

## Observações

- **Pagamentos:** são **100% simulados**. Nenhum dado de cartão ou Pix sai do navegador.
- **Imagens:** vêm do Unsplash (precisa de internet). Sem conexão, aparece um placeholder.
- **Conclusão antecipada:** para facilitar a demonstração, o barbeiro pode concluir um atendimento mesmo antes do horário marcado.

# VCO Barbearia

Sistema de agendamento e gestão para barbearia.

| Pasta | O que é | Detalhes |
|---|---|---|
| [`frontend-barbearia/`](frontend-barbearia/) | Interface web (Next.js + TypeScript + Tailwind) | [README](frontend-barbearia/README.md): logins de demonstração e roteiro de apresentação |
| [`backend-barbearia/`](backend-barbearia/) | API REST (Spring Boot 4 + banco H2, ou MySQL opcional) | [README](backend-barbearia/README.md): como rodar, endpoints e modelo de dados |

## Dois jeitos de rodar

### 1. Só o front-end (modo demonstração)

Os dados ficam no navegador. Não precisa de Java nem de banco de dados.

```bash
cd frontend-barbearia
npm install
npm run dev
# abra http://localhost:3000
```

### 2. Sistema completo (front-end + API + banco)

Os dados ficam no banco de dados (H2, que não precisa de instalação nem de criar nada no Workbench). Celular e computador veem as mesmas informações.

Terminal 1, a API:

```bash
cd backend-barbearia
mvnw.cmd spring-boot:run   # banco H2 criado sozinho em backend-barbearia/data (nada para instalar)
# opcional, com MySQL:  $env:DB_PASSWORD="sua_senha"; mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=mysql"
```

Terminal 2, o front-end:

```bash
cd frontend-barbearia
npm run dev:api
# abra http://localhost:3000
```

Logins de demonstração:

| Perfil | E-mail | Senha |
|---|---|---|
| Cliente | `cliente@demo.com` | `123456` |
| Barbeiro | `barbeiro@demo.com` | `123456` |

O roteiro da apresentação está em [`roteiro-apresentacao.txt`](roteiro-apresentacao.txt).

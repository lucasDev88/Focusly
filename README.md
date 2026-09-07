# Focusly

## Arquitetura Tecnológica — V1

### 1. Objetivo do projeto

O Focusly será uma plataforma de gerenciamento de estudos cujo objetivo é permitir que o usuário:

* crie e organize matérias;
* inicie sessões de estudo;
* cronometre o tempo efetivamente estudado;
* registre automaticamente seu histórico;
* acompanhe metas e estatísticas;
* ative um modo de foco no computador;
* bloqueie sites e aplicativos durante uma sessão de estudo.

Na V1, o bloqueio do celular será realizado manualmente pelo recurso nativo **Modo Estudo/Bem-estar digital do Android**. A integração automática com o celular ficará para uma versão futura.

---

# 2. Arquitetura geral

O sistema será dividido em três componentes principais:

```text
                    FOCUSLY
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
       WEB APP       BACKEND      DESKTOP
       Frontend       API          AGENT
          │            │            │
          └────────────┼────────────┘
                       │
                       ▼
                   DATABASE
```

### Web App

Interface utilizada pelo usuário para controlar sua rotina de estudos.

### Backend

Responsável pelas regras de negócio, autenticação, sessões, estatísticas e comunicação com o banco de dados.

### Desktop Agent

Aplicativo instalado no computador responsável pelo bloqueio de sites e aplicativos durante o modo de estudo.

### Database

Armazena usuários, matérias, sessões, metas e configurações.

---

# 3. Tecnologias

## 3.1 Frontend Web

### Next.js

**Finalidade:** construir a aplicação web do Focusly.

Será responsável por:

* dashboard;
* página de estudos;
* histórico;
* matérias;
* metas;
* configurações;
* autenticação;
* navegação da aplicação.

O Next.js será utilizado como framework principal da interface.

---

### React

**Finalidade:** construção dos componentes da interface.

Exemplos:

* cronômetro;
* cards de estatísticas;
* gráficos;
* lista de sessões;
* seleção de matéria;
* controles de estudo.

---

### TypeScript

**Finalidade:** tipagem e segurança do código.

Será utilizado tanto quanto possível na aplicação web e no backend.

Exemplo:

```text
StudySession
├── id: string
├── subjectId: string
├── startedAt: Date
├── endedAt: Date
└── status: SessionStatus
```

Isso reduz erros causados por dados incorretos durante o desenvolvimento.

---

### Tailwind CSS

**Finalidade:** estilização da interface.

Será utilizado para:

* layout;
* responsividade;
* componentes;
* espaçamento;
* tipografia;
* estados visuais;
* tema da aplicação.

A V1 não terá uma biblioteca visual pesada. Os componentes serão construídos sobre Tailwind para manter controle sobre o design.

---

# 4. Backend

## Node.js

**Finalidade:** executar o servidor do Focusly.

O Node.js será responsável pela API e pela lógica de negócio.

---

## TypeScript

O backend também utilizará TypeScript.

Isso permite compartilhar conceitos e tipos entre as diferentes partes do sistema.

---

## API REST

**Finalidade:** comunicação entre:

```text
Web App
   ↓
REST API
   ↓
Backend
   ↓
Database
```

Também será utilizada pelo Desktop Agent.

Exemplos:

```text
POST /sessions/start
POST /sessions/:id/pause
POST /sessions/:id/resume
POST /sessions/:id/finish

GET /sessions
GET /sessions/today
GET /sessions/stats

GET /subjects
POST /subjects
```

---

# 5. Banco de dados

## PostgreSQL

**Finalidade:** armazenamento permanente dos dados da plataforma.

Será utilizado para armazenar:

* usuários;
* matérias;
* sessões;
* metas;
* configurações;
* regras de bloqueio.

O PostgreSQL será o banco principal da aplicação.

---

## Prisma ORM

**Finalidade:** comunicação entre o backend e o PostgreSQL.

O Prisma permitirá trabalhar com o banco através de TypeScript em vez de escrever SQL manualmente para todas as operações.

Também será utilizado para:

* criação do schema;
* migrations;
* relacionamentos;
* consultas;
* tipagem dos dados.

Estrutura conceitual:

```text
User
 │
 ├── Subjects
 │
 ├── StudySessions
 │
 ├── Goals
 │
 └── BlockRules
```

---

# 6. Autenticação

## Sistema de sessão/autenticação

A plataforma terá autenticação própria.

Responsabilidades:

* cadastro;
* login;
* logout;
* identificação do usuário;
* proteção das rotas;
* associação das sessões ao usuário correto.

A autenticação será baseada em tokens/sessões seguras, com armazenamento adequado das credenciais.

As senhas nunca serão armazenadas em texto puro.

---

# 7. Desktop Agent

## Python

**Finalidade:** criar o aplicativo responsável pelo controle do computador.

O Agent será um programa separado do site.

```text
Focusly Web
     │
     │ API
     ▼
Focusly Backend
     │
     │ API
     ▼
Focusly Agent
     │
     ├── Website Blocker
     ├── Application Blocker
     └── Session Monitor
```

---

## Responsabilidades do Desktop Agent

### Session Monitor

Verifica se existe uma sessão de estudo ativa.

```text
API
 ↓
Sessão ativa?
 ↓
SIM
 ↓
Modo foco ativo
```

---

### Website Blocker

Responsável por bloquear sites configurados pelo usuário.

Exemplos:

```text
youtube.com
instagram.com
tiktok.com
reddit.com
```

A primeira implementação poderá utilizar mecanismos do próprio Windows, como o arquivo `hosts`, mas a arquitetura deverá permitir uma implementação de bloqueio mais robusta posteriormente.

---

### Application Blocker

Responsável por impedir ou encerrar aplicativos configurados como distrações.

Exemplos:

```text
Discord
Steam
Jogos
Outros aplicativos definidos pelo usuário
```

---

### Config Manager

Responsável por armazenar localmente as configurações necessárias do Agent.

Exemplos:

* identificador do dispositivo;
* configurações de conexão;
* preferências do bloqueador;
* logs locais.

Informações sensíveis não deverão ser armazenadas de forma insegura.

---

### Logger

Responsável por registrar eventos importantes:

```text
Agent iniciado
Sessão detectada
Bloqueio ativado
Aplicativo bloqueado
Sessão encerrada
Erro de comunicação
```

Isso será importante para diagnóstico e manutenção.

---

# 8. Comunicação entre Agent e Backend

Na V1 será utilizada:

## REST + Polling

O Agent consultará periodicamente o backend.

Exemplo:

```text
Agent
  │
  │ "Existe uma sessão ativa?"
  ▼
Backend
  │
  │ "Sim, sessão #182"
  ▼
Agent
  │
  ▼
Ativa bloqueio
```

Não será utilizado WebSocket inicialmente.

### Motivo

O polling é mais simples de implementar, testar e manter.

Posteriormente, poderemos substituir ou complementar essa comunicação com:

```text
WebSocket
```

para permitir comandos praticamente instantâneos.

---

# 9. Cronômetro

O cronômetro será baseado no horário registrado pelo backend.

Não dependeremos exclusivamente de:

```javascript
setInterval()
```

no navegador.

Quando uma sessão começar:

```text
startedAt = timestamp do servidor
```

O frontend calcula o tempo transcorrido com base nesse horário.

Isso permite que:

* a página seja recarregada;
* o navegador seja fechado;
* o computador perca temporariamente a conexão;

sem perder necessariamente a informação da sessão.

---

# 10. Sistema de sessões

A entidade principal do sistema será:

```text
StudySession
```

Ela terá, conceitualmente:

```text
id
userId
subjectId
startedAt
endedAt
duration
status
```

Estados possíveis:

```text
ACTIVE
PAUSED
COMPLETED
CANCELLED
```

Fluxo:

```text
START
  ↓
ACTIVE
  ↓
PAUSE
  ↓
PAUSED
  ↓
RESUME
  ↓
ACTIVE
  ↓
FINISH
  ↓
COMPLETED
```

---

# 11. Sistema de matérias

Cada usuário poderá cadastrar suas próprias matérias.

Exemplos:

```text
Matemática
Física
Programação
Português
Geografia
```

Cada sessão estará vinculada a uma matéria.

Isso permitirá calcular:

```text
Matemática → 12h30
Programação → 18h42
Física → 07h15
```

---

# 12. Sistema de metas

A V1 terá metas básicas de estudo.

Exemplo:

```text
Meta diária: 4 horas

Estudado:
3h20

Progresso:
83%
```

Posteriormente poderão existir:

* metas semanais;
* metas mensais;
* metas por matéria;
* streak;
* objetivos personalizados.

---

# 13. Estatísticas

A plataforma deverá calcular:

### Tempo total

```text
Hoje
Semana
Mês
Total
```

### Tempo por matéria

```text
Matemática
Programação
Física
```

### Histórico

Registro de todas as sessões concluídas.

### Progresso das metas

Comparação entre:

```text
tempo estudado
        vs.
tempo planejado
```

---

# 14. Celular — V1

O celular **não terá integração automática na V1**.

O usuário utilizará manualmente o recurso nativo do Android:

```text
Modo Estudo
```

Durante o início de uma sessão, a plataforma poderá informar:

```text
Antes de começar:

📱 Ative o Modo Estudo no celular.

🖥️ Verifique se o Focusly Agent está conectado.

[ Estou pronto ]
```

A integração automática Android será considerada uma funcionalidade futura.

---

# 15. Estrutura de dados inicial

As entidades principais serão:

```text
User
 ├── Subject
 │
 ├── StudySession
 │
 ├── Goal
 │
 └── BlockRule
```

### User

Representa o usuário.

### Subject

Representa uma matéria.

### StudySession

Representa uma sessão de estudo.

### Goal

Representa uma meta.

### BlockRule

Representa algo que deverá ser bloqueado durante o estudo.

Pode representar:

```text
Website
Application
```

---

# 16. Infraestrutura

Na fase inicial, o projeto deverá ser desenvolvido localmente.

```text
Windows
│
├── Web App
├── Backend
├── PostgreSQL
└── Desktop Agent
```

Após a estabilização da V1, será definida a infraestrutura de produção.

A escolha definitiva de hospedagem não será feita antes de termos o MVP funcionando.

---

# 17. Controle de versões

## Git

Será utilizado para controle de versão.

## GitHub

Será utilizado para:

* hospedagem do código;
* histórico de alterações;
* branches;
* issues;
* documentação;
* colaboração.

Estratégia inicial:

```text
main
 │
 ├── development
 │
 ├── feature/auth
 ├── feature/study-session
 ├── feature/dashboard
 └── feature/desktop-agent
```

---

# 18. Ferramentas de desenvolvimento

### VS Code

Editor principal.

### Git

Controle de versão.

### GitHub

Repositório e colaboração.

### Postman ou Insomnia

Testes da API REST.

### Prisma Studio

Visualização e inspeção do banco durante o desenvolvimento.

---

# 19. Stack definitiva da V1

```text
┌─────────────────────────────────────┐
│              FRONTEND               │
│                                     │
│ Next.js                             │
│ React                               │
│ TypeScript                          │
│ Tailwind CSS                        │
└─────────────────┬───────────────────┘
                  │
                  │ REST
                  ▼
┌─────────────────────────────────────┐
│              BACKEND                │
│                                     │
│ Node.js                             │
│ TypeScript                          │
│ REST API                            │
│ Authentication                      │
└─────────────────┬───────────────────┘
                  │
               Prisma
                  │
                  ▼
┌─────────────────────────────────────┐
│             DATABASE                │
│                                     │
│ PostgreSQL                          │
└─────────────────────────────────────┘


┌─────────────────────────────────────┐
│          DESKTOP AGENT              │
│                                     │
│ Python                              │
│ ├── Session Monitor                 │
│ ├── Website Blocker                 │
│ ├── Application Blocker             │
│ ├── Config Manager                  │
│ └── Logger                          │
└─────────────────────────────────────┘


┌─────────────────────────────────────┐
│              MOBILE                │
│                                     │
│ Android                             │
│ Modo Estudo manual                  │
└─────────────────────────────────────┘
```

# 20. O que NÃO estará na V1

Para evitar escopo desnecessário:

* ❌ aplicativo Android próprio;
* ❌ aplicativo iOS;
* ❌ integração com Phone Link;
* ❌ sincronização automática com celular;
* ❌ WebSocket;
* ❌ inteligência artificial;
* ❌ sistema social;
* ❌ ranking entre usuários;
* ❌ gamificação complexa;
* ❌ aplicativo mobile próprio;
* ❌ funcionalidades avançadas de administração.

Essas funcionalidades poderão existir futuramente, mas **não fazem parte da fundação da V1**.

---

# 21. Princípio da V1

A V1 deverá responder a apenas uma pergunta:

> **"Quanto eu estudei e consegui manter meu computador longe das distrações durante esse período?"**

Tudo que não contribui diretamente para isso fica fora da primeira versão.

A prioridade será:

```text
FUNCIONAR
   ↓
SER CONFIÁVEL
   ↓
SER ORGANIZADO
   ↓
SER BONITO
   ↓
SER EXPANSÍVEL
```

O objetivo não é construir um sistema gigante de uma vez.

É construir uma **base sólida que possa crescer sem precisar ser reescrita**.
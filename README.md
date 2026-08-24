# PrazoCerto

Plataforma web de gestão comercial para pequenos comerciantes e trabalhadores autônomos brasileiros: cadastro de clientes, vendas a prazo, cobrança via WhatsApp e gestão de estoque em um único sistema.

Projeto de Portfólio — Engenharia de Software, Católica SC.

## Stack

- **Backend:** Node.js + Express, Prisma ORM, PostgreSQL
- **Frontend:** React + TypeScript + Vite, Tailwind CSS (em desenvolvimento)
- **Infraestrutura:** Docker Compose, Nginx, GitHub Actions
- **Qualidade:** Jest/Supertest (backend), Vitest (frontend), SonarCloud
- **Observabilidade:** Prometheus + Grafana

## Estrutura do projeto

```
PrazoCerto/
├── backend/          API REST (Node.js + Express + Prisma)
│   ├── prisma/       Schema do banco e migrations
│   └── src/          Código-fonte da API (em construção)
├── frontend/         Aplicação React (em construção)
└── docs/             Documentação complementar do projeto
```

## Como rodar o backend

```bash
cd backend
npm install
cp .env.example .env      # preencha DATABASE_URL com sua conexão PostgreSQL
npx prisma migrate dev    # cria as tabelas no banco
npx prisma studio         # (opcional) explorar o banco pelo navegador
```

## Modelo de dados

O schema (`backend/prisma/schema.prisma`) implementa o modelo de dados do RFC do projeto, dividido em dois módulos:

- **Comercial:** usuários, clientes, vendas, parcelas, histórico de cobranças
- **Estoque:** categorias, fornecedores, produtos, movimentações de estoque, inventários

Isolamento multi-tenant: todos os dados de um negócio ficam associados ao usuário Dono que os criou.

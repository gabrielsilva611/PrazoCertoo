# PrazoCerto

Plataforma web de gestão comercial para pequenos comerciantes e trabalhadores autônomos brasileiros: cadastro de clientes, vendas a prazo, cobrança via WhatsApp e gestão de estoque em um único sistema.

Projeto de Portfólio — Engenharia de Software, Católica SC.

## Stack

- **Backend:** Node.js + Express, Prisma ORM, PostgreSQL
- **Frontend:** React + TypeScript + Vite, Tailwind CSS
- **Infraestrutura:** Docker Compose, Nginx, GitHub Actions
- **Qualidade:** Jest/Supertest (backend), Vitest (frontend), SonarCloud
- **Observabilidade:** Prometheus + Grafana

## Estrutura do projeto

```
PrazoCerto/
├── backend/          API REST (Node.js + Express + Prisma)
│   ├── prisma/       Schema do banco e migrations
│   └── src/          Código-fonte da API
├── frontend/         Aplicação React (Vite + Tailwind)
└── docs/             Documentação complementar do projeto
```

## Como rodar

```bash
# Backend
cd backend
npm install
cp .env.example .env      # preencha DATABASE_URL com sua conexão PostgreSQL
npx prisma migrate dev    # cria as tabelas no banco
npm run dev                # sobe a API em http://localhost:3000

# Frontend (em outro terminal)
cd frontend
npm install
npm run dev                # sobe em http://localhost:5173, com proxy para a API
```

## Modelo de dados

O schema (`backend/prisma/schema.prisma`) implementa o modelo de dados do RFC do projeto, dividido em dois módulos:

- **Comercial:** usuários, clientes, vendas, parcelas, histórico de cobranças
- **Estoque:** categorias, fornecedores, produtos, movimentações de estoque, inventários

Isolamento multi-tenant: todos os dados de um negócio ficam associados ao usuário Dono que os criou.

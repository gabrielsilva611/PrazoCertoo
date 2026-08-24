# PrazoCerto — Frontend

Interface web (React + TypeScript + Vite + Tailwind CSS) do PrazoCerto.

## Como rodar

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`. As chamadas para `/api/*` são redirecionadas para o backend em `http://localhost:3000` (configurado em `vite.config.ts`) — rode o backend também (veja `../backend/README.md`, se existir, ou o README principal do projeto).

## Estrutura

```
src/
├── pages/       telas da aplicação
├── components/  componentes reutilizáveis
├── context/     estado global (autenticação)
├── lib/         cliente de API
└── types.ts     tipos compartilhados com o backend
```

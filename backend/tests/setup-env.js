// Carrega .env.test em vez do .env normal — os testes de integração nunca
// devem tocar no banco de desenvolvimento.
//
// override:true é necessário: por padrão o dotenv NUNCA sobrescreve uma
// variável que já exista em process.env (ex: DATABASE_URL definida no
// sistema operacional ou herdada de uma CI) — sem isso, o .env.test seria
// ignorado silenciosamente bem no cenário que ele existe pra evitar.
const resultado = require('dotenv').config({ path: '.env.test', override: true });

if (resultado.error) {
  throw new Error(
    'Não foi possível carregar backend/.env.test — copie .env.test.example e preencha com ' +
      'a connection string do banco de TESTE antes de rodar a suíte.',
  );
}

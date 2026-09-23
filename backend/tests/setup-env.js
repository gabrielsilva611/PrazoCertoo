// Carrega .env.test em vez do .env normal — os testes de integração nunca
// devem tocar no banco de desenvolvimento.
require('dotenv').config({ path: '.env.test' });

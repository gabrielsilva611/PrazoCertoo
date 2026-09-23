module.exports = {
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],
  testPathIgnorePatterns: ['/node_modules/', '/generated/'],
  // O Neon (banco de dev/teste) fica nos EUA — round-trip de ~300-500ms por
  // consulta é normal aqui, então o timeout padrão de 5s do Jest é curto demais
  // para testes de integração que fazem várias chamadas em sequência.
  testTimeout: 20000,
};

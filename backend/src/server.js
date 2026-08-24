require('dotenv/config');
const app = require('./app');

const PORTA = process.env.PORT || 3000;

app.listen(PORTA, () => {
  console.log(`PrazoCerto API rodando em http://localhost:${PORTA}`);
});

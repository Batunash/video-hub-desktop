const { PORT } = require('./src/config/config');
const app = require('./src/app');

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API http://0.0.0.0:${PORT} üzerinde çalışıyor`);
});

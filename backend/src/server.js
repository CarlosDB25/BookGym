const app = require('./app');
const { PORT } = require('./shared/config');
const { iniciarNoShowScheduler } = require('./scheduler/noshow.scheduler');

app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});

iniciarNoShowScheduler();

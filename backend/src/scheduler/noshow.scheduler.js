const cron = require('node-cron');

function iniciarNoShowScheduler() {
  // Placeholder del cierre de turnos para fases posteriores.
  cron.schedule('0 0 * * *', () => {
    // En el prototipo no se procesa no-show real.
  });
}

module.exports = { iniciarNoShowScheduler };

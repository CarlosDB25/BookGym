const TZ = 'America/Bogota';

function getPartsInBogota(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));

  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour,
    minute: map.minute,
    second: map.second,
  };
}

export function getBogotaTodayYMD() {
  const p = getPartsInBogota();
  return `${p.year}-${p.month}-${p.day}`;
}

export function getBogotaNowMillis() {
  const p = getPartsInBogota();
  return Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}-05:00`);
}

export function mondayFromYMD(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const day = date.getUTCDay();
  const adjust = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + adjust);

  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');

  return `${yy}-${mm}-${dd}`;
}

export function slotMillisBogota(dateISO, hour) {
  const ymd = dateISO.split('T')[0];
  return Date.parse(`${ymd}T${hour}:00-05:00`);
}

export function formatDateBogota(dateISO) {
  const ymd = dateISO.split('T')[0];
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));

  return new Intl.DateTimeFormat('es-CO', {
    timeZone: TZ,
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}

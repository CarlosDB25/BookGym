import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import 'dayjs/locale/es'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('es')

const TZ = 'America/Bogota'
dayjs.tz.setDefault(TZ)

export function now() {
  return dayjs().tz(TZ)
}

export function todayYMD() {
  return now().format('YYYY-MM-DD')
}

export function nowMillis() {
  return now().valueOf()
}

export function parseSlotMillis(dateISO, hour) {
  if (!dateISO) return NaN
  const ymd = dateISO.split('T')[0]
  return dayjs.tz(`${ymd} ${hour}`, 'YYYY-MM-DD HH:mm', TZ).valueOf()
}

export function mondayFromYMD(ymd) {
  if (!ymd) return ''
  const d = dayjs.tz(ymd, 'YYYY-MM-DD', TZ)
  const day = d.day()
  const diff = day === 0 ? -6 : 1 - day
  return d.add(diff, 'day').format('YYYY-MM-DD')
}

export function formatDate(iso) {
  if (!iso) return ''
  const ymd = iso.split('T')[0]
  return dayjs.tz(ymd, 'YYYY-MM-DD', TZ).format('dddd D MMM')
}

export function formatDayHeader(iso) {
  if (!iso) return ''
  const ymd = iso.split('T')[0]
  return dayjs.tz(ymd, 'YYYY-MM-DD', TZ).format('ddd D/M')
}

export function weekdayIndex(dayName) {
  const map = {
    lunes: 0, martes: 1, miercoles: 2, jueves: 3,
    viernes: 4, sabado: 5, domingo: 6,
  }
  return map[dayName] ?? 0
}

export function currentWeekdayIndex() {
  return now().day()
}

export function isWithinWindow(eventStartMillis, windowMinutes) {
  return nowMillis() < eventStartMillis - windowMinutes * 60 * 1000
}

export function minutesUntil(eventStartMillis) {
  return Math.round((eventStartMillis - nowMillis()) / 60000)
}

export function formatTimeAgo(millis) {
  return dayjs(millis).format('HH:mm:ss')
}

export function formatClock() {
  return now().format('HH:mm:ss')
}

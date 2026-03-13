import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'

dayjs.extend(customParseFormat)

export function getDateStr() {
  return dayjs().format('YYYY-MM-DD')
}
export function getDateTimeStr() {
  return dayjs().format('YYYY-MM-DD HH:mm:ss')
}

export function getYesterdayDateStr() {
  return dayjs().subtract(1, 'day').format('YYYY-MM-DD')
}

export function getStartOfDayStr() {
  return dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss')
}

export function getDateTime(str?: string) {
  if (str) {
    return dayjs(str, 'YYYY-MM-DD HH:mm:ss').valueOf()
  }
  return dayjs().valueOf()
}

export function getStartOfDay() {
  return dayjs().startOf('day').valueOf()
}

export function isDailyDateStr(str: string) {
  return dayjs(str, 'YYYY-MM-DD', true).isValid()
}

export function isMonthlyDateStr(str: string) {
  return dayjs(str, 'YYYY-MM', true).isValid()
}

export function getMonthRange(str: string) {
  return [
    dayjs(str).startOf('month').format('YYYY-MM-DD'),
    dayjs(str).endOf('month').format('YYYY-MM-DD')
  ]
}

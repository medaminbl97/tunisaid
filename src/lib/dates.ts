// CMS editors enter times in Central European time; a fixed zone keeps server and browser output identical.
const CONTENT_TIME_ZONE = 'Europe/Berlin'

function dateFormat(language: string) {
  return new Intl.DateTimeFormat(language, {
    dateStyle: 'medium',
    timeZone: CONTENT_TIME_ZONE,
  })
}

export function formatContentDate(value: string, language: string) {
  return dateFormat(language).format(new Date(value))
}

export function formatContentDateRange(
  start: string,
  end: string,
  language: string,
) {
  return dateFormat(language).formatRange(new Date(start), new Date(end))
}

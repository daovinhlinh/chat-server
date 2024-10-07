import moment from 'moment'

export const createDateAddDaysFromNow = (days: number) => {
  const date = new Date()

  date.setDate(date.getDate() + days)

  return date
}

export const createDateNow = () => {
  const date = new Date()

  return date
}

// convert date from string to Date object
// params: date string, date format string
// return: Date object
export const convertStringToDate = (
  date: string | null,
  currentFormat: string
): Date | null => {
  if (!date) {
    return null
  }
  return moment(date, currentFormat).toDate()
}

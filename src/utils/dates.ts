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

export const isValidSpecicalDay = (dateStr: string) => {
  // Check if the date is in "YYYY-MM-DD" format
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateStr)) {
    return false
  }

  // Parse the date to check if it is a valid calendar date
  const date = new Date(dateStr)
  const [year, month, day] = dateStr.split('-').map(Number)

  // Check that the parsed date parts match the input
  return (
    date.getFullYear() === year &&
    date.getMonth() + 1 === month && // Months are 0-indexed
    date.getDate() === day
  )
}

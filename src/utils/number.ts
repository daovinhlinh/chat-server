export const randomNumberInRange = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min)) + min
}

export const isValidNumberString = (value: string): boolean => {
  if (!value) {
    return false
  }

  const numberValue = Number(value)
  return !isNaN(numberValue)
}

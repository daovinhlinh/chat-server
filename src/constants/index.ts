export enum ExpiresInDays {
  Verification = 7,
  ResetPassword = 7
}

export enum Mimetype {
  Jpeg = 'image/jpeg',
  Png = 'image/png'
}

export enum ImageSizeInMb {
  Ten = 10
}

export enum MediaRefType {
  User = 'User'
}

export enum RollResultType {
  Over = 0,
  Under = 1
}

export const CustomReasonPhrases = {
  PASSWORD_NOT_MATCH: 'Password not match',
  WRONG_USERNAME_PASSWORD: 'Wrong username or password',
  ALREADY_CHECKED_IN: 'User already checked in',
  DAY_IS_EXISTED: 'Day is existed',
  USER_NOT_FOUND: 'User not found',
  WRONG_OTP: 'Wrong OTP',
  ACCOUNT_NOT_VERIFIED: 'Account not verified',
  REFRESH_TOKEN_MISSING: 'Refresh token missing'
}

import { Router } from 'express'
import { userController } from '~/controllers'
import { authGuard } from '~/guards'
import { userValidation } from '~/validations/userValidation'

export const user = (router: Router): void => {
  router.get('/me', authGuard.isAuth, userController.me)

  router.post(
    '/user/update',
    authGuard.isAuth,
    userValidation.updateProfile,
    userController.updateProfile
  )

  router.post(
    '/user/update/password',
    authGuard.isAuth,
    userValidation.updatePassword,
    userController.updatePassword
  )

  //#region Admin
  // Delete user profile
  router.post(
    '/user/delete',
    authGuard.isAdmin,
    userValidation.deleteProfile,
    userController.deleteProfile
  )

  // Get all users
  router.get('/user/all', authGuard.isAdmin, userController.getAllUsers)

  // Get user by id
  router.get('/user/:id', authGuard.isAdmin, userController.getUserById)

  //#endregion
}

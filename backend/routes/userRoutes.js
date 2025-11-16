import express from 'express'
import {
  followUnFollowUser,
  getUserProfile,
  loginUser,
  logoutUser,
  signupUser,
  updateUser,
  getSuggestedUsers,
  freezeAccount,
  blockUser,
  unblockUser,
  searchUsers,
  verifyEmail,
  forgotPassword,
  resetPassword,
} from '../controllers/userController.js'
import protectRoute from '../middlewares/protectRoute.js'

const router = express.Router()

router.get('/profile/:query', getUserProfile)
router.get('/suggested', protectRoute, getSuggestedUsers)
router.get('/search', searchUsers)
router.post('/signup', signupUser)
router.post('/login', loginUser)
router.post('/logout', logoutUser)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password/:token', resetPassword)
router.post('/follow/:id', protectRoute, followUnFollowUser)
router.post('/block/:id', protectRoute, blockUser)
router.post('/unblock/:id', protectRoute, unblockUser)
router.put('/update/:id', protectRoute, updateUser)
router.put('/freeze', protectRoute, freezeAccount)
router.put('/verify-email/:token', verifyEmail)

export default router

import express from 'express'
import protectRoute from '../middlewares/protectRoute.js'
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} from '../controllers/notificationController.js'

const router = express.Router()

router.get('/', protectRoute, getNotifications)
router.get('/unread-count', protectRoute, getUnreadCount)
router.put('/read/:id', protectRoute, markAsRead)
router.put('/read-all', protectRoute, markAllAsRead)
router.delete('/:id', protectRoute, deleteNotification)

export default router

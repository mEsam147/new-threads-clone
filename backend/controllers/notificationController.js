import Notification from '../models/notificationModel.js'
import { getRecipientSocketId, io } from '../socket/socket.js'

const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id

    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'username profilePic name')
      .populate('post')
      .sort({ createdAt: -1 })
      .limit(50)

    res.status(200).json(notifications)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params

    const notification = await Notification.findById(id)

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    notification.isRead = true
    await notification.save()

    res.status(200).json({ message: 'Notification marked as read' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    )

    res.status(200).json({ message: 'All notifications marked as read' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params

    const notification = await Notification.findById(id)

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    await Notification.findByIdAndDelete(id)

    res.status(200).json({ message: 'Notification deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    })

    res.status(200).json({ count })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export { getNotifications, markAsRead, markAllAsRead, deleteNotification, getUnreadCount }

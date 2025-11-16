import { Box, Flex, Text, Avatar, Button } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import useShowToast from '../hooks/useShowToast'

import { Link } from 'react-router-dom'

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const showToast = useShowToast()
  // const currentUser = useRecoilValue(userAtom)

  useEffect(() => {
    const getNotifications = async () => {
      try {
        const res = await fetch('/api/notifications')
        const data = await res.json()
        if (data.error) {
          showToast('Error', data.error, 'error')
          return
        }
        setNotifications(data)
      } catch (error) {
        showToast('Error', error.message, 'error')
      } finally {
        setLoading(false)
      }
    }

    getNotifications()
  }, [showToast])

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'PUT',
      })
      const data = await res.json()
      if (data.error) {
        showToast('Error', data.error, 'error')
        return
      }
      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })))
      showToast('Success', 'All notifications marked as read', 'success')
    } catch (error) {
      showToast('Error', error.message, 'error')
    }
  }

  if (loading) {
    return <Text>Loading notifications...</Text>
  }

  return (
    <Box maxW="600px" mx="auto" p={4}>
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Text fontSize="2xl" fontWeight="bold">
          Notifications
        </Text>
        {notifications.some((notif) => !notif.isRead) && (
          <Button size="sm" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </Flex>

      {notifications.length === 0 ? (
        <Text textAlign="center" color="gray.500" mt={10}>
          No notifications yet
        </Text>
      ) : (
        notifications.map((notification) => (
          <NotificationItem key={notification._id} notification={notification} />
        ))
      )}
    </Box>
  )
}

const NotificationItem = ({ notification }) => {
  const getNotificationMessage = () => {
    switch (notification.type) {
      case 'like':
        return 'liked your post'
      case 'reply':
        return 'replied to your post'
      case 'follow':
        return 'started following you'
      case 'mention':
        return 'mentioned you in a post'
      case 'share':
        return 'shared your post'
      default:
        return 'sent you a notification'
    }
  }

  return (
    <Flex
      p={3}
      bg={notification.isRead ? 'transparent' : 'blue.50'}
      borderRadius="md"
      mb={2}
      alignItems="center"
    >
      <Avatar src={notification.sender?.profilePic} size="sm" mr={3} />
      <Box flex={1}>
        <Text fontSize="sm">
          <Link to={`/${notification.sender?.username}`}>
            <Text as="span" fontWeight="bold">
              {notification.sender?.username}
            </Text>
          </Link>{' '}
          {getNotificationMessage()}
        </Text>
        <Text fontSize="xs" color="gray.500">
          {new Date(notification.createdAt).toLocaleDateString()}
        </Text>
      </Box>
      {notification.post && (
        <Link to={`/post/${notification.post._id}`}>
          <Button size="sm" variant="outline">
            View
          </Button>
        </Link>
      )}
    </Flex>
  )
}

export default NotificationsPage

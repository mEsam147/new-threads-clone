import { BellIcon } from '@chakra-ui/icons'
import {
  Box,
  Text,
  Popover,
  PopoverTrigger,
  PopoverContent,
  VStack,
  Flex,
  Avatar,
  Skeleton,
} from '@chakra-ui/react'
import { useEffect, useState, useRef } from 'react'
import useShowToast from '../hooks/useShowToast'
import { Link } from 'react-router-dom'
import { useRecoilValue } from 'recoil'
import userAtom from '../atoms/userAtom'
import { useSocket } from '../context/SocketContext'

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const showToast = useShowToast()
  const user = useRecoilValue(userAtom)
  const { socket } = useSocket()
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    if (!user || !socket) return

    // Get initial count
    getUnreadCount()

    // Listen for real-time notification updates
    socket.on('unreadCount', (count) => {
      setUnreadCount(count)
    })

    socket.on('unreadCountIncrement', () => {
      setUnreadCount((prev) => prev + 1)
    })

    socket.on('newNotification', (notification) => {
      setNotifications((prev) => [notification, ...prev])
      setUnreadCount((prev) => prev + 1)
    })

    // Request initial count from server
    socket.emit('getUnreadCount', user._id)

    return () => {
      socket.off('unreadCount')
      socket.off('unreadCountIncrement')
      socket.off('newNotification')
    }
  }, [user, socket])

  const getUnreadCount = async () => {
    try {
      const res = await fetch('/api/notifications/unread-count')
      const data = await res.json()
      if (data.error) {
        showToast('Error', data.error, 'error')
        return
      }
      setUnreadCount(data.count)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const getNotifications = async () => {
    if (loading || hasFetchedRef.current) return

    setLoading(true)
    hasFetchedRef.current = true

    try {
      const res = await fetch('/api/notifications?limit=5')
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

  const handlePopoverOpen = () => {
    getNotifications()
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      await fetch(`/api/notifications/read/${notificationId}`, {
        method: 'PUT',
      })

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => (notif._id === notificationId ? { ...notif, isRead: true } : notif))
      )

      if (unreadCount > 0) {
        setUnreadCount((prev) => prev - 1)
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  return (
    <Popover onOpen={handlePopoverOpen} placement="bottom-end" closeOnBlur={true}>
      <PopoverTrigger>
        <Box
          position="relative"
          cursor="pointer"
          p={2}
          borderRadius="md"
          _hover={{ bg: 'gray.100' }}
          transition="background-color 0.2s"
        >
          <BellIcon boxSize={5} />
          {unreadCount > 0 && (
            <Box
              position="absolute"
              top="4px"
              right="4px"
              bg="red.500"
              color="white"
              borderRadius="full"
              w="5"
              h="5"
              fontSize="10px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontWeight="bold"
              border="2px solid white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Box>
          )}
        </Box>
      </PopoverTrigger>
      <PopoverContent w="400px" maxH="500px" overflow="hidden" boxShadow="lg">
        <Box borderBottom="1px" borderColor="gray.200" p={3}>
          <Text fontWeight="bold" fontSize="lg">
            Notifications
          </Text>
        </Box>
        <VStack spacing={0} maxH="400px" overflowY="auto">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Flex key={index} p={3} alignItems="center" w="full">
                <Skeleton borderRadius="full" width="40px" height="40px" mr={3} />
                <Box flex={1}>
                  <Skeleton height="16px" width="80%" mb={2} />
                  <Skeleton height="12px" width="60%" />
                </Box>
              </Flex>
            ))
          ) : notifications.length === 0 ? (
            <Text p={4} color="gray.500" textAlign="center">
              No notifications yet
            </Text>
          ) : (
            notifications.map((notification) => (
              <NotificationPreview
                key={notification._id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))
          )}
          {notifications.length > 0 && (
            <Box p={3} borderTop="1px" borderColor="gray.200" w="full">
              <Link to="/notifications">
                <Text textAlign="center" color="blue.500" fontWeight="medium" fontSize="sm">
                  View all notifications
                </Text>
              </Link>
            </Box>
          )}
        </VStack>
      </PopoverContent>
    </Popover>
  )
}

const NotificationPreview = ({ notification, onMarkAsRead }) => {
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

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'like':
        return '❤️'
      case 'reply':
        return '💬'
      case 'follow':
        return '👤'
      case 'mention':
        return '📝'
      case 'share':
        return '🔄'
      default:
        return '🔔'
    }
  }

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification._id)
    }
  }

  return (
    <Link
      to={
        notification.post ? `/post/${notification.post._id}` : `/${notification.sender?.username}`
      }
      style={{ width: '100%' }}
      onClick={handleClick}
    >
      <Flex
        p={3}
        borderBottom="1px"
        borderColor="gray.100"
        _hover={{ bg: 'gray.50' }}
        alignItems="flex-start"
        bg={notification.isRead ? 'transparent' : 'blue.50'}
        transition="background-color 0.2s"
      >
        <Box mr={3} fontSize="lg" mt={1}>
          {getNotificationIcon()}
        </Box>
        <Avatar src={notification.sender?.profilePic} size="sm" mr={3} />
        <Box flex={1}>
          <Text fontSize="sm" noOfLines={2}>
            <Text as="span" fontWeight="bold">
              {notification.sender?.username}
            </Text>{' '}
            {getNotificationMessage()}
          </Text>
          <Text fontSize="xs" color="gray.500" mt={1}>
            {new Date(notification.createdAt).toLocaleDateString()} •{' '}
            {new Date(notification.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </Box>
        {!notification.isRead && <Box w="2" h="2" bg="blue.500" borderRadius="full" mt={2} />}
      </Flex>
    </Link>
  )
}

export default NotificationBell

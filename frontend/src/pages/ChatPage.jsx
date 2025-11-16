import { SearchIcon } from '@chakra-ui/icons'
import {
  Box,
  Button,
  Flex,
  Input,
  Skeleton,
  SkeletonCircle,
  Text,
  useColorModeValue,
  VStack,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react'
import Conversation from '../components/Conversation'
import { GiConversation } from 'react-icons/gi'
import MessageContainer from '../components/MessageContainer'
import { useEffect, useState } from 'react'
import useShowToast from '../hooks/useShowToast'
import { useRecoilState, useRecoilValue } from 'recoil'
import { conversationsAtom, selectedConversationAtom } from '../atoms/messagesAtom'
import userAtom from '../atoms/userAtom'
import { useSocket } from '../context/SocketContext'
import {useLocation} from "react-router-dom"

const ChatPage = () => {
  const [searchingUser, setSearchingUser] = useState(false)
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom)
  const [conversations, setConversations] = useRecoilState(conversationsAtom)
  const currentUser = useRecoilValue(userAtom)
  const showToast = useShowToast()
  const { socket, onlineUsers } = useSocket()
    const location = useLocation()


    useEffect(() => {
      // Handle navigation from user profile with pre-selected user
      if (location.state?.startConversationWith) {
        const { startConversationWith } = location.state
        handleStartConversation(startConversationWith)

        // Clear the navigation state
        window.history.replaceState({}, document.title)
      }
    }, [location.state])

  useEffect(() => {
    socket?.on('messagesSeen', ({ conversationId }) => {
      setConversations((prev) => {
        const updatedConversations = prev.map((conversation) => {
          if (conversation._id === conversationId) {
            return {
              ...conversation,
              lastMessage: {
                ...conversation.lastMessage,
                seen: true,
              },
            }
          }
          return conversation
        })
        return updatedConversations
      })
    })
  }, [socket, setConversations])

  useEffect(() => {
    const getConversations = async () => {
      try {
        const res = await fetch('/api/messages/conversations')
        const data = await res.json()
        if (data.error) {
          showToast('Error', data.error, 'error')
          return
        }
        setConversations(data)
      } catch (error) {
        showToast('Error', error.message, 'error')
      } finally {
        setLoadingConversations(false)
      }
    }

    getConversations()
  }, [showToast, setConversations])

  // Enhanced user search with debouncing
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchText.trim()) {
        setSearchResults([])
        return
      }

      setSearchingUser(true)
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchText)}`)
        const searchedUsers = await res.json()

        // Filter out current user and users already in conversations
        const filteredUsers = searchedUsers.filter(
          (user) =>
            user._id !== currentUser._id &&
            !conversations.find((conv) => conv.participants[0]._id === user._id)
        )

        setSearchResults(filteredUsers)
      } catch (error) {
        showToast('Error', error.message, 'error')
      } finally {
        setSearchingUser(false)
      }
    }

    const timeoutId = setTimeout(searchUsers, 300)
    return () => clearTimeout(timeoutId)
  }, [searchText, currentUser._id, conversations, showToast])

  const handleStartConversation = async (user) => {
    setSearchingUser(true)
    try {
      // Check if conversation already exists
      const existingConversation = conversations.find(
        (conversation) => conversation.participants[0]._id === user._id
      )

      if (existingConversation) {
        setSelectedConversation({
          _id: existingConversation._id,
          userId: user._id,
          username: user.username,
          userProfilePic: user.profilePic,
        })
        setSearchText('')
        setSearchResults([])
        return
      }

      // Create a mock conversation for immediate UI update
      const mockConversation = {
        mock: true,
        lastMessage: {
          text: 'Say hello! 👋',
          sender: currentUser._id,
          seen: false,
        },
        _id: `mock-${Date.now()}`,
        participants: [
          {
            _id: user._id,
            username: user.username,
            profilePic: user.profilePic,
          },
        ],
      }

      setConversations((prev) => [mockConversation, ...prev])
      setSelectedConversation({
        _id: mockConversation._id,
        userId: user._id,
        username: user.username,
        userProfilePic: user.profilePic,
        mock: true,
      })

      setSearchText('')
      setSearchResults([])

      showToast('Success', `Started conversation with ${user.username}`, 'success')
    } catch (error) {
      showToast('Error', error.message, 'error')
    } finally {
      setSearchingUser(false)
    }
  }

  return (
    <Box
      position={'absolute'}
      left={'50%'}
      w={{ base: '100%', md: '80%', lg: '750px' }}
      p={4}
      transform={'translateX(-50%)'}
    >
      <Flex
        gap={4}
        flexDirection={{ base: 'column', md: 'row' }}
        maxW={{
          sm: '400px',
          md: 'full',
        }}
        mx={'auto'}
      >
        <Flex
          flex={30}
          gap={2}
          flexDirection={'column'}
          maxW={{ sm: '250px', md: 'full' }}
          mx={'auto'}
        >
          <Text fontWeight={700} color={useColorModeValue('gray.600', 'gray.400')}>
            Your Conversations
          </Text>

          {/* Search Input */}
          <Box position="relative">
            <Input
              placeholder="Search users to chat..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              mb={2}
            />

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <Box
                position="absolute"
                top="100%"
                left={0}
                right={0}
                bg={useColorModeValue('white', 'gray.700')}
                border="1px"
                borderColor={useColorModeValue('gray.200', 'gray.600')}
                borderRadius="md"
                boxShadow="lg"
                zIndex={10}
                maxH="300px"
                overflowY="auto"
              >
                <VStack spacing={0} align="stretch">
                  <Text
                    px={3}
                    py={2}
                    fontSize="sm"
                    fontWeight="bold"
                    color="gray.500"
                    borderBottom="1px"
                    borderColor="gray.200"
                  >
                    Start conversation with:
                  </Text>
                  {searchResults.map((user) => (
                    <Flex
                      key={user._id}
                      p={3}
                      _hover={{ bg: useColorModeValue('gray.50', 'gray.600') }}
                      cursor="pointer"
                      alignItems="center"
                      onClick={() => handleStartConversation(user)}
                    >
                      <Avatar src={user.profilePic} size="sm" mr={3} />
                      <Box flex={1}>
                        <Text fontWeight="bold" fontSize="sm">
                          {user.username}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {user.name}
                        </Text>
                      </Box>
                      <Button size="xs" colorScheme="blue" variant="ghost">
                        Chat
                      </Button>
                    </Flex>
                  ))}
                </VStack>
              </Box>
            )}
          </Box>

          {searchingUser && (
            <Flex alignItems="center" p={2}>
              <SkeletonCircle size="8" mr={3} />
              <Box flex={1}>
                <Skeleton height="3" width="70%" mb={2} />
                <Skeleton height="2" width="50%" />
              </Box>
            </Flex>
          )}

          {loadingConversations &&
            [0, 1, 2, 3, 4].map((_, i) => (
              <Flex key={i} gap={4} alignItems={'center'} p={'1'} borderRadius={'md'}>
                <Box>
                  <SkeletonCircle size={'10'} />
                </Box>
                <Flex w={'full'} flexDirection={'column'} gap={3}>
                  <Skeleton h={'10px'} w={'80px'} />
                  <Skeleton h={'8px'} w={'90%'} />
                </Flex>
              </Flex>
            ))}

          {!loadingConversations &&
            conversations.map((conversation) => (
              <Conversation
                key={conversation._id}
                isOnline={onlineUsers.includes(conversation.participants[0]._id)}
                conversation={conversation}
              />
            ))}
        </Flex>

        {!selectedConversation._id && (
          <Flex
            flex={70}
            borderRadius={'md'}
            p={2}
            flexDir={'column'}
            alignItems={'center'}
            justifyContent={'center'}
            height={'400px'}
            bg={useColorModeValue('gray.50', 'gray.700')}
          >
            <GiConversation size={100} color={useColorModeValue('#666', '#999')} />
            <Text fontSize={20} color={useColorModeValue('gray.600', 'gray.400')} mt={4}>
              Select a conversation to start messaging
            </Text>
            <Text fontSize={14} color={useColorModeValue('gray.500', 'gray.500')} mt={2}>
              Or search for users above to start a new conversation
            </Text>
          </Flex>
        )}

        {selectedConversation._id && <MessageContainer />}
      </Flex>
    </Box>
  )
}

export default ChatPage

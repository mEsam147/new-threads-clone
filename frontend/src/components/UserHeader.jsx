import { Avatar } from '@chakra-ui/avatar'
import { Box, Flex, Link, Text, VStack } from '@chakra-ui/layout'
import { Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/menu'
import { Portal } from '@chakra-ui/portal'
import { Button, useToast, HStack, IconButton } from '@chakra-ui/react'
import { BsInstagram } from 'react-icons/bs'
import { CgMoreO } from 'react-icons/cg'
import { useRecoilValue } from 'recoil'
import userAtom from '../atoms/userAtom'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import useFollowUnfollow from '../hooks/useFollowUnfollow'
import { useState, useEffect } from 'react'
import useShowToast from '../hooks/useShowToast'
import Post from '../components/Post'
import { ChatIcon } from '@chakra-ui/icons'

const UserHeader = ({ user }) => {
  const toast = useToast()
  const currentUser = useRecoilValue(userAtom)
  const navigate = useNavigate()
  const { handleFollowUnfollow, following, updating } = useFollowUnfollow(user)
  const [activeTab, setActiveTab] = useState('threads')
  const [userReplies, setUserReplies] = useState([])
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [hasConversation, setHasConversation] = useState(false)
  const showToast = useShowToast()

  useEffect(() => {
    if (activeTab === 'replies') {
      fetchUserReplies()
    }
  }, [activeTab, user._id])

  useEffect(() => {
    // Check if conversation exists with this user
    const checkConversation = async () => {
      if (!currentUser || currentUser._id === user._id) return

      try {
        const res = await fetch('/api/messages/conversations')
        const conversations = await res.json()
        const existingConv = conversations.find((conv) => conv.participants[0]._id === user._id)
        setHasConversation(!!existingConv)
      } catch (error) {
        console.error('Error checking conversation:', error)
      }
    }

    checkConversation()
  }, [currentUser, user._id])

  const fetchUserReplies = async () => {
    setLoadingReplies(true)
    try {
      const res = await fetch(`/api/posts/user/${user.username}/replies`)
      const data = await res.json()
      if (data.error) {
        showToast('Error', data.error, 'error')
        return
      }
      setUserReplies(data)
    } catch (error) {
      showToast('Error', error.message, 'error')
    } finally {
      setLoadingReplies(false)
    }
  }

  const copyURL = () => {
    const currentURL = window.location.href
    navigator.clipboard.writeText(currentURL).then(() => {
      toast({
        title: 'Success.',
        status: 'success',
        description: 'Profile link copied.',
        duration: 3000,
        isClosable: true,
      })
    })
  }

  const handleMessageUser = async () => {
    if (!currentUser) {
      showToast('Error', 'Please login to message users', 'error')
      return
    }

    if (currentUser._id === user._id) {
      showToast('Error', 'You cannot message yourself', 'error')
      return
    }

    try {
      // Navigate to chat page and trigger conversation creation
      navigate('/chat', {
        state: {
          startConversationWith: {
            _id: user._id,
            username: user.username,
            profilePic: user.profilePic,
          },
        },
      })
    } catch (error) {
      showToast('Error', 'Failed to start conversation', 'error')
    }
  }

  return (
    <VStack gap={4} alignItems={'start'} w="full">
      <Flex justifyContent={'space-between'} w={'full'}>
        <Box>
          <Text fontSize={'2xl'} fontWeight={'bold'}>
            {user.name}
          </Text>
          <Flex gap={2} alignItems={'center'}>
            <Text fontSize={'sm'}>{user.username}</Text>
            <Text fontSize={'xs'} bg={'gray.dark'} color={'gray.light'} p={1} borderRadius={'full'}>
              threads.net
            </Text>
          </Flex>
        </Box>
        <Box>
          {user.profilePic && (
            <Avatar
              name={user.name}
              src={user.profilePic}
              size={{
                base: 'md',
                md: 'xl',
              }}
            />
          )}
          {!user.profilePic && (
            <Avatar
              name={user.name}
              src="https://bit.ly/broken-link"
              size={{
                base: 'md',
                md: 'xl',
              }}
            />
          )}
        </Box>
      </Flex>

      <Text>{user.bio}</Text>

      {/* Action Buttons */}
      <HStack spacing={3}>
        {currentUser?._id === user._id && (
          <Link as={RouterLink} to="/update">
            <Button size={'sm'}>Update Profile</Button>
          </Link>
        )}

        {currentUser?._id !== user._id && (
          <>
            <Button
              size={'sm'}
              onClick={handleFollowUnfollow}
              isLoading={updating}
              colorScheme={following ? 'gray' : 'blue'}
            >
              {following ? 'Unfollow' : 'Follow'}
            </Button>

            <IconButton
              size={'sm'}
              icon={<ChatIcon />}
              onClick={handleMessageUser}
              colorScheme="green"
              aria-label="Message user"
              title={hasConversation ? 'Continue conversation' : 'Start conversation'}
            />
          </>
        )}
      </HStack>

      <Flex w={'full'} justifyContent={'space-between'}>
        <Flex gap={2} alignItems={'center'}>
          <Text color={'gray.light'}>{user.followers.length} followers</Text>
          <Box w="1" h="1" bg={'gray.light'} borderRadius={'full'}></Box>
          <Text color={'gray.light'}>{user.following.length} following</Text>
        </Flex>
        <Flex>
          <Box className="icon-container">
            <BsInstagram size={24} cursor={'pointer'} />
          </Box>
          <Box className="icon-container">
            <Menu>
              <MenuButton>
                <CgMoreO size={24} cursor={'pointer'} />
              </MenuButton>
              <Portal>
                <MenuList bg={'gray.dark'}>
                  <MenuItem bg={'gray.dark'} onClick={copyURL}>
                    Copy link
                  </MenuItem>
                  {currentUser?._id !== user._id && (
                    <MenuItem bg={'gray.dark'} onClick={handleMessageUser}>
                      Message user
                    </MenuItem>
                  )}
                </MenuList>
              </Portal>
            </Menu>
          </Box>
        </Flex>
      </Flex>

      {/* Tabs Section */}
      <Box w="full">
        <Flex w={'full'} borderBottom="1px solid" borderColor="gray.600">
          <Flex
            flex={1}
            justifyContent={'center'}
            pb="3"
            cursor={'pointer'}
            borderBottom={activeTab === 'threads' ? '2px solid white' : 'none'}
            onClick={() => setActiveTab('threads')}
          >
            <Text fontWeight={'bold'} color={activeTab === 'threads' ? 'white' : 'gray.light'}>
              Threads
            </Text>
          </Flex>
          <Flex
            flex={1}
            justifyContent={'center'}
            pb="3"
            cursor={'pointer'}
            borderBottom={activeTab === 'replies' ? '2px solid white' : 'none'}
            onClick={() => setActiveTab('replies')}
          >
            <Text fontWeight={'bold'} color={activeTab === 'replies' ? 'white' : 'gray.light'}>
              Replies
            </Text>
          </Flex>
        </Flex>

        {/* Replies Content */}
        {activeTab === 'replies' && (
          <Box mt={4}>
            {loadingReplies ? (
              <Text textAlign="center" color="gray.500">
                Loading replies...
              </Text>
            ) : userReplies.length === 0 ? (
              <Text textAlign="center" color="gray.500">
                {currentUser?._id === user._id ? "You haven't" : "This user hasn't"} replied to any
                posts yet.
              </Text>
            ) : (
              <VStack spacing={4} align="stretch">
                {userReplies.map((post) => (
                  <Post key={post._id} post={post} postedBy={post.postedBy} />
                ))}
              </VStack>
            )}
          </Box>
        )}
      </Box>
    </VStack>
  )
}

export default UserHeader

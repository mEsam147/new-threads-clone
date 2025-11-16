import { useState, useRef, useEffect } from 'react'
import {
  Box,
  Input,
  Flex,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  VStack,
  Avatar,
  Text,
  Image,
  InputGroup,
  InputLeftElement,
  Spinner,
  Badge,
} from '@chakra-ui/react'
import { SearchIcon } from '@chakra-ui/icons'
import { Link } from 'react-router-dom'
import useShowToast from '../hooks/useShowToast'

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const showToast = useShowToast()
  const debounceRef = useRef()

  useEffect(() => {
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Set new timeout for debounced search
    debounceRef.current = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery)
      } else {
        setUsers([])
        setPosts([])
      }
    }, 300) // 300ms debounce

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [searchQuery])

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setUsers([])
      setPosts([])
      return
    }

    setLoading(true)
    try {
      // Search users
      const usersRes = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
      const usersData = await usersRes.json()
      setUsers(usersData)

      // Search posts
      const postsRes = await fetch(`/api/posts/search?q=${encodeURIComponent(query)}`)
      const postsData = await postsRes.json()
      setPosts(postsData)
    } catch (error) {
      showToast('Error', error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box maxW="600px" mx="auto" p={4}>
      <InputGroup size="lg" mb={6}>
        <InputLeftElement pointerEvents="none">
          <SearchIcon color="gray.400" />
        </InputLeftElement>
        <Input
          placeholder="Search users and posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="filled"
        />
      </InputGroup>

      {loading && (
        <Flex justify="center" mb={4}>
          <Spinner size="lg" />
        </Flex>
      )}

      {searchQuery && !loading && (
        <Tabs isFitted variant="enclosed" index={activeTab} onChange={setActiveTab}>
          <TabList mb="1em">
            <Tab>
              Users
              <Badge ml={2} colorScheme="blue">
                {users.length}
              </Badge>
            </Tab>
            <Tab>
              Posts
              <Badge ml={2} colorScheme="green">
                {posts.length}
              </Badge>
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel px={0}>
              <UserResults users={users} searchQuery={searchQuery} />
            </TabPanel>
            <TabPanel px={0}>
              <PostResults posts={posts} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}

      {!searchQuery && (
        <Text textAlign="center" color="gray.500" mt={10}>
          Start typing to search for users and posts
        </Text>
      )}
    </Box>
  )
}

const UserResults = ({ users, searchQuery }) => {
  if (users.length === 0)
    return (
      <Text textAlign="center" color="gray.500" py={10}>
        No users found for "{searchQuery}"
      </Text>
    )

  return (
    <VStack spacing={3} align="stretch">
      {users.map((user) => (
        <UserResultItem key={user._id} user={user} searchQuery={searchQuery} />
      ))}
    </VStack>
  )
}

const UserResultItem = ({ user, searchQuery }) => {
  const highlightMatch = (text, query) => {
    if (!text || !query) return text

    const lowerText = text.toLowerCase()
    const lowerQuery = query.toLowerCase()
    const index = lowerText.indexOf(lowerQuery)

    if (index === -1) return text

    const before = text.substring(0, index)
    const match = text.substring(index, index + query.length)
    const after = text.substring(index + query.length)

    return (
      <>
        {before}
        <Text as="span" bg="yellow.100" fontWeight="bold">
          {match}
        </Text>
        {after}
      </>
    )
  }

  return (
    <Link to={`/${user.username}`}>
      <Flex
        p={4}
        _hover={{ bg: 'gray.50', transform: 'translateY(-2px)' }}
        borderRadius="lg"
        alignItems="center"
        transition="all 0.2s"
        border="1px"
        borderColor="gray.200"
      >
        <Avatar src={user.profilePic} mr={4} size="lg" />
        <Box flex={1}>
          <Flex alignItems="center" mb={1}>
            <Text fontWeight="bold" fontSize="lg" mr={2}>
              {highlightMatch(user.username, searchQuery)}
            </Text>
            {user.isVerified && <Image src="/verified.png" w={4} h={4} />}
            {user.matchScore > 80 && (
              <Badge ml={2} colorScheme="green" size="sm">
                Best Match
              </Badge>
            )}
          </Flex>
          <Text color="gray.600" fontSize="md" mb={1}>
            {highlightMatch(user.name, searchQuery)}
          </Text>
          {user.bio && (
            <Text color="gray.500" fontSize="sm" noOfLines={2} mb={2}>
              {user.bio}
            </Text>
          )}
          <Flex gap={4}>
            <Text color="gray.500" fontSize="xs">
              {user.followersCount} followers
            </Text>
            <Text color="gray.500" fontSize="xs">
              {user.followingCount} following
            </Text>
          </Flex>
        </Box>
      </Flex>
    </Link>
  )
}

const PostResults = ({ posts }) => {
  if (posts.length === 0)
    return (
      <Text textAlign="center" color="gray.500" py={10}>
        No posts found
      </Text>
    )

  return (
    <VStack spacing={4} align="stretch">
      {posts.map((post) => (
        <Link key={post._id} to={`/${post.postedBy.username}/post/${post._id}`}>
          <Box
            p={4}
            border="1px"
            borderColor="gray.200"
            borderRadius="lg"
            _hover={{ bg: 'gray.50', transform: 'translateY(-2px)' }}
            transition="all 0.2s"
          >
            <Flex alignItems="center" mb={3}>
              <Avatar src={post.postedBy.profilePic} size="sm" mr={3} />
              <Box>
                <Text fontWeight="bold">{post.postedBy.username}</Text>
                <Text fontSize="sm" color="gray.500">
                  {new Date(post.createdAt).toLocaleDateString()}
                </Text>
              </Box>
            </Flex>
            <Text mb={3} fontSize="lg">
              {post.text}
            </Text>
            {post.img && (
              <Image src={post.img} borderRadius="md" maxH="300px" objectFit="cover" w="full" />
            )}
            <Flex mt={3} gap={4} color="gray.500" fontSize="sm">
              <Text>❤️ {post.likes?.length || 0} likes</Text>
              <Text>💬 {post.replies?.length || 0} replies</Text>
              <Text>🔄 {post.shareCount || 0} shares</Text>
            </Flex>
          </Box>
        </Link>
      ))}
    </VStack>
  )
}

export default SearchPage

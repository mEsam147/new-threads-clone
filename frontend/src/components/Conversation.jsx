import {
  Avatar,
  AvatarBadge,
  Box,
  Flex,
  Image,
  Stack,
  Text,
  WrapItem,
  useColorMode,
  useColorModeValue,
  Badge,
} from '@chakra-ui/react'
import { useRecoilState, useRecoilValue } from 'recoil'
import userAtom from '../atoms/userAtom'
import { BsCheck2All, BsFillImageFill } from 'react-icons/bs'
import { selectedConversationAtom } from '../atoms/messagesAtom'

const Conversation = ({ conversation, isOnline }) => {
  const user = conversation.participants[0]
  const currentUser = useRecoilValue(userAtom)
  const lastMessage = conversation.lastMessage
  const [selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom)
  const colorMode = useColorMode()

  const isSelected = selectedConversation?._id === conversation._id
  const isMockConversation = conversation.mock

  return (
    <Flex
      gap={4}
      alignItems={'center'}
      p={'3'}
      _hover={{
        cursor: 'pointer',
        bg: useColorModeValue('gray.100', 'gray.600'),
      }}
      onClick={() =>
        setSelectedConversation({
          _id: conversation._id,
          userId: user._id,
          userProfilePic: user.profilePic,
          username: user.username,
          mock: conversation.mock,
        })
      }
      bg={isSelected ? useColorModeValue('gray.200', 'gray.700') : ''}
      borderRadius={'md'}
      transition="all 0.2s"
      border={isMockConversation ? '2px dashed' : 'none'}
      borderColor={isMockConversation ? 'blue.300' : 'transparent'}
    >
      <WrapItem>
        <Avatar
          size={{
            base: 'sm',
            sm: 'md',
          }}
          src={user.profilePic}
        >
          {isOnline ? <AvatarBadge boxSize="1em" bg="green.500" /> : ''}
        </Avatar>
      </WrapItem>

      <Stack direction={'column'} fontSize={'sm'} flex={1}>
        <Flex alignItems="center" gap={2}>
          <Text fontWeight="700" display={'flex'} alignItems={'center'}>
            {user.username}
          </Text>
          {isMockConversation && (
            <Badge colorScheme="blue" size="sm" fontSize="xs">
              New
            </Badge>
          )}
          <Image src="/verified.png" w={4} h={4} ml={1} />
        </Flex>
        <Text fontSize={'xs'} display={'flex'} alignItems={'center'} gap={1}>
          {currentUser._id === lastMessage.sender ? (
            <Box color={lastMessage.seen ? 'blue.400' : ''}>
              <BsCheck2All size={16} />
            </Box>
          ) : (
            ''
          )}
          {lastMessage.text ? (
            lastMessage.text.length > 25 ? (
              lastMessage.text.substring(0, 25) + '...'
            ) : (
              lastMessage.text
            )
          ) : (
            <Flex alignItems="center" gap={1}>
              <BsFillImageFill size={12} />
              <Text fontSize="xs">Image</Text>
            </Flex>
          )}
        </Text>
      </Stack>

      {isMockConversation && (
        <Badge colorScheme="green" variant="subtle" fontSize="xs">
          Start chatting
        </Badge>
      )}
    </Flex>
  )
}

export default Conversation

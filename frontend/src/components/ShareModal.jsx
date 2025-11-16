import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Textarea,
  Flex,
  Avatar,
  Text,
  useToast,
  VStack,
  Box,
  Image,
} from '@chakra-ui/react'
import { useState } from 'react'
import useShowToast from '../hooks/useShowToast'
import { useRecoilValue } from 'recoil'
import userAtom from '../atoms/userAtom'

const ShareModal = ({ isOpen, onClose, post }) => {
  const [shareText, setShareText] = useState('')
  const [loading, setLoading] = useState(false)
  const showToast = useShowToast()
  const toast = useToast()
  const currentUser = useRecoilValue(userAtom)

  const handleShare = async () => {
    if (!shareText.trim() && !post.text) {
      showToast('Error', 'Please add some text to share', 'error')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/posts/${post._id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: shareText }),
      })

      const data = await res.json()
      if (data.error) {
        showToast('Error', data.error, 'error')
        return
      }

      showToast('Success', 'Post shared successfully', 'success')
      onClose()
      setShareText('')
    } catch (error) {
      showToast('Error', error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    const postUrl = `${window.location.origin}/${post.postedBy.username}/post/${post._id}`
    navigator.clipboard.writeText(postUrl)
    toast({
      title: 'Link copied!',
      status: 'success',
      duration: 2000,
    })
  }

  const shareToTwitter = () => {
    const text = encodeURIComponent(
      `Check out this post by ${post.postedBy.username} on Threads Clone`
    )
    const url = encodeURIComponent(
      `${window.location.origin}/${post.postedBy.username}/post/${post._id}`
    )
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Share Post</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Textarea
            placeholder="Add your thoughts..."
            value={shareText}
            onChange={(e) => setShareText(e.target.value)}
            mb={4}
            resize="vertical"
            minH="100px"
          />

          {/* Original post preview */}
          <Box p={3} border="1px" borderColor="gray.200" borderRadius="md" mb={4}>
            <Flex alignItems="center" mb={2}>
              <Avatar src={post.postedBy.profilePic} size="sm" mr={3} />
              <Box>
                <Text fontWeight="bold">{post.postedBy.username}</Text>
                <Text fontSize="sm" color="gray.500">
                  {new Date(post.createdAt).toLocaleDateString()}
                </Text>
              </Box>
            </Flex>
            <Text fontSize="sm" mb={2}>
              {post.text}
            </Text>
            {post.img && (
              <Image src={post.img} borderRadius="md" maxH="150px" objectFit="cover" w="full" />
            )}
          </Box>

          {/* Share options */}
          <VStack spacing={2} align="stretch">
            <Text fontWeight="bold" fontSize="sm">
              Share via:
            </Text>
            <Flex gap={2}>
              <Button size="sm" flex={1} onClick={copyLink}>
                Copy Link
              </Button>
              <Button size="sm" flex={1} onClick={shareToTwitter} colorScheme="twitter">
                Twitter
              </Button>
            </Flex>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleShare} isLoading={loading}>
            Share Post
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default ShareModal

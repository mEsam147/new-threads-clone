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
  Box,
  Image,
  Text, // ← add this line
} from '@chakra-ui/react'

import { useState } from 'react'
import useShowToast from '../hooks/useShowToast'

const MAX_CHAR = 500

const EditPostModal = ({ isOpen, onClose, post, onPostUpdate }) => {
  const [text, setText] = useState(post.text)
  const [remainingChar, setRemainingChar] = useState(MAX_CHAR - post.text.length)
  const [loading, setLoading] = useState(false)
  const showToast = useShowToast()

  const handleTextChange = (e) => {
    const inputText = e.target.value
    if (inputText.length > MAX_CHAR) {
      const truncatedText = inputText.slice(0, MAX_CHAR)
      setText(truncatedText)
      setRemainingChar(0)
    } else {
      setText(inputText)
      setRemainingChar(MAX_CHAR - inputText.length)
    }
  }

  const handleSave = async () => {
    if (!text.trim()) {
      showToast('Error', 'Post cannot be empty', 'error')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/posts/${post._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })

      const data = await res.json()
      if (data.error) {
        showToast('Error', data.error, 'error')
        return
      }

      onPostUpdate(data)
      showToast('Success', 'Post updated successfully', 'success')
      onClose()
    } catch (error) {
      showToast('Error', error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Post</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Textarea
            value={text}
            onChange={handleTextChange}
            placeholder="What's happening?"
            size="lg"
            minH="200px"
            resize="vertical"
          />
          <Text fontSize="xs" color="gray.500" textAlign="right" mt={2}>
            {remainingChar}/{MAX_CHAR}
          </Text>

          {post.img && (
            <Box mt={4} position="relative" display="inline-block">
              <Image src={post.img} alt="Post image" borderRadius="md" maxH="200px" />
            </Box>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSave} isLoading={loading}>
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default EditPostModal

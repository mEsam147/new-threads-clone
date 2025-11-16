import { AddIcon} from '@chakra-ui/icons'
import {
  Button,
  CloseButton,
  Flex,
  FormControl,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
  useColorModeValue,
  useDisclosure,

  SimpleGrid,
  Box,
} from '@chakra-ui/react'
import { useRef, useState } from 'react'
import usePreviewImg from '../hooks/usePreviewImg'
import { BsFillImageFill } from 'react-icons/bs'
import { useRecoilState, useRecoilValue } from 'recoil'
import userAtom from '../atoms/userAtom'
import useShowToast from '../hooks/useShowToast'
import postsAtom from '../atoms/postsAtom'
import { useParams } from 'react-router-dom'

const MAX_CHAR = 500
const MAX_IMAGES = 4

const CreatePost = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [postText, setPostText] = useState('')
  const {  imgUrl, setImgUrl } = usePreviewImg()
  const [imageUrls, setImageUrls] = useState([])
  const imageRef = useRef(null)
  const [remainingChar, setRemainingChar] = useState(MAX_CHAR)
  const user = useRecoilValue(userAtom)
  const showToast = useShowToast()
  const [loading, setLoading] = useState(false)
  const [posts, setPosts] = useRecoilState(postsAtom)
  const { username } = useParams()

  const handleTextChange = (e) => {
    const inputText = e.target.value
    if (inputText.length > MAX_CHAR) {
      const truncatedText = inputText.slice(0, MAX_CHAR)
      setPostText(truncatedText)
      setRemainingChar(0)
    } else {
      setPostText(inputText)
      setRemainingChar(MAX_CHAR - inputText.length)
    }
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)

    if (imageUrls.length + files.length > MAX_IMAGES) {
      showToast('Error', `Maximum ${MAX_IMAGES} images allowed`, 'error')
      return
    }

    const newImageUrls = []

    files.forEach((file) => {
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          newImageUrls.push(reader.result)
          if (newImageUrls.length === files.length) {
            setImageUrls((prev) => [...prev, ...newImageUrls])
          }
        }
        reader.readAsDataURL(file)
      } else {
        showToast('Invalid file type', 'Please select image files only', 'error')
      }
    })
  }

  const removeImage = (index) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCreatePost = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/posts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postedBy: user._id,
          text: postText,
          img: imgUrl,
          imgs: imageUrls,
        }),
      })

      const data = await res.json()
      if (data.error) {
        showToast('Error', data.error, 'error')
        return
      }
      showToast('Success', 'Post created successfully', 'success')
      if (username === user.username) {
        setPosts([data, ...posts])
      }
      onClose()
      setPostText('')
      setImgUrl('')
      setImageUrls([])
    } catch (error) {
      showToast('Error', error, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        position={'fixed'}
        bottom={10}
        right={5}
        bg={useColorModeValue('gray.300', 'gray.dark')}
        onClick={onOpen}
        size={{ base: 'sm', sm: 'md' }}
        zIndex={1000}
      >
        <AddIcon />
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Post</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <Textarea
                placeholder="Share your thoughts..."
                onChange={handleTextChange}
                value={postText}
                resize="vertical"
                minH="120px"
              />
              <Text fontSize="xs" fontWeight="bold" textAlign={'right'} m={'1'} color={'gray.800'}>
                {remainingChar}/{MAX_CHAR}
              </Text>

              <Input
                type="file"
                hidden
                ref={imageRef}
                onChange={handleImageUpload}
                multiple
                accept="image/*"
              />

              <Flex alignItems="center" gap={2} mt={2}>
                <BsFillImageFill
                  style={{ cursor: 'pointer' }}
                  size={20}
                  onClick={() => imageRef.current.click()}
                />
                <Text fontSize="sm" color="gray.500">
                  {imageUrls.length}/{MAX_IMAGES} images
                </Text>
              </Flex>
            </FormControl>

            {/* Multiple images preview */}
            {imageUrls.length > 0 && (
              <Box mt={4}>
                <SimpleGrid columns={2} spacing={2}>
                  {imageUrls.map((url, index) => (
                    <Box key={index} position="relative">
                      <Image
                        src={url}
                        alt={`Preview ${index + 1}`}
                        borderRadius="md"
                        objectFit="cover"
                        h="150px"
                        w="full"
                      />
                      <CloseButton
                        size="sm"
                        bg="red.500"
                        color="white"
                        position="absolute"
                        top={1}
                        right={1}
                        onClick={() => removeImage(index)}
                      />
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>
            )}

            {/* Single image preview */}
            {imgUrl && (
              <Flex mt={5} w={'full'} position={'relative'}>
                <Image src={imgUrl} alt="Selected img" borderRadius="md" />
                <CloseButton
                  onClick={() => setImgUrl('')}
                  bg={'gray.800'}
                  position={'absolute'}
                  top={2}
                  right={2}
                />
              </Flex>
            )}
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={handleCreatePost}
              isLoading={loading}
              isDisabled={!postText.trim() && !imgUrl && imageUrls.length === 0}
            >
              Post
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default CreatePost

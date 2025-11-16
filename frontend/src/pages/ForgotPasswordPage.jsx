import { useState } from 'react'
import {
  Box,
  Container,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  Text,
  Alert,
  AlertIcon,

} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import useShowToast from '../hooks/useShowToast'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const showToast = useShowToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()
      if (data.error) {
        showToast('Error', data.error, 'error')
      } else {
        setEmailSent(true)
        showToast('Success', 'Password reset email sent!', 'success')
      }
    } catch (error) {
      showToast('Error', 'Failed to send reset email', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxW="md" py={10}>
      <VStack spacing={6}>
        <Heading size="lg">Reset Your Password</Heading>

        {emailSent ? (
          <Alert status="success" borderRadius="md">
            <AlertIcon />
            Check your email for a password reset link.
          </Alert>
        ) : (
          <>
            <Text textAlign="center" color="gray.600">
              Enter your email address and we'll send you a link to reset your password.
            </Text>

            <Box as="form" onSubmit={handleSubmit} w="full">
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Email Address</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your-email@example.com"
                  />
                </FormControl>

                <Button type="submit" colorScheme="blue" w="full" isLoading={loading}>
                  Send Reset Link
                </Button>
              </VStack>
            </Box>
          </>
        )}

        <Button as={RouterLink} to="/auth" variant="link">
          Back to Login
        </Button>
      </VStack>
    </Container>
  )
}

export default ForgotPasswordPage

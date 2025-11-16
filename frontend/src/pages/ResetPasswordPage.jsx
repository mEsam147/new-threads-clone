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
  InputGroup,
  InputRightElement,

} from '@chakra-ui/react'
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import useShowToast from '../hooks/useShowToast'

const ResetPasswordPage = () => {
  const { token } = useParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const showToast = useShowToast()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      showToast('Error', 'Passwords do not match', 'error')
      return
    }

    if (password.length < 6) {
      showToast('Error', 'Password must be at least 6 characters', 'error')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/users/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()
      if (data.error) {
        showToast('Error', data.error, 'error')
      } else {
        showToast('Success', 'Password reset successfully!', 'success')
        navigate('/auth')
      }
    } catch (error) {
      showToast('Error', 'Failed to reset password', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxW="md" py={10}>
      <VStack spacing={6}>
        <Heading size="lg">Set New Password</Heading>

        <Box as="form" onSubmit={handleSubmit} w="full">
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>New Password</FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <InputRightElement>
                  <Button variant="ghost" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Confirm Password</FormLabel>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </FormControl>

            <Button type="submit" colorScheme="blue" w="full" isLoading={loading}>
              Reset Password
            </Button>
          </VStack>
        </Box>

        <Button as={RouterLink} to="/auth" variant="link">
          Back to Login
        </Button>
      </VStack>
    </Container>
  )
}

export default ResetPasswordPage

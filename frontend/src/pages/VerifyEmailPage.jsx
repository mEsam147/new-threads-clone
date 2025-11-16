import {  Container, Heading, Text, Button, VStack } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import useShowToast from '../hooks/useShowToast'

const VerifyEmailPage = () => {
  const { token } = useParams()
  const [verifying, setVerifying] = useState(true)
  const [verified, setVerified] = useState(false)
  const showToast = useShowToast()

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await fetch(`/api/users/verify-email/${token}`, {
          method: 'PUT',
        })
        const data = await res.json()

        if (data.error) {
          showToast('Error', data.error, 'error')
        } else {
          setVerified(true)
          showToast('Success', 'Email verified successfully!', 'success')
        }
      } catch (error) {
        showToast('Error', 'Verification failed', 'error')
      } finally {
        setVerifying(false)
      }
    }

    if (token) {
      verifyEmail()
    }
  }, [token, showToast])

  return (
    <Container maxW="md" py={10}>
      <VStack spacing={6} textAlign="center">
        <Heading>Email Verification</Heading>

        {verifying && <Text>Verifying your email address...</Text>}

        {verified && (
          <>
            <Text color="green.500" fontSize="lg">
              ✅ Your email has been successfully verified!
            </Text>
            <Button as={RouterLink} to="/" colorScheme="blue">
              Go to Home
            </Button>
          </>
        )}

        {!verifying && !verified && (
          <>
            <Text color="red.500">
              Email verification failed. The link may be invalid or expired.
            </Text>
            <Button as={RouterLink} to="/" colorScheme="blue">
              Go to Home
            </Button>
          </>
        )}
      </VStack>
    </Container>
  )
}

export default VerifyEmailPage

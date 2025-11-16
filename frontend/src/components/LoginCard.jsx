import {
  Flex,
  Box,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  Button,
  Heading,
  Text,
  useColorModeValue,
  Link,
} from '@chakra-ui/react'
import { useState } from 'react'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import { useSetRecoilState } from 'recoil'
import authScreenAtom from '../atoms/authAtom'
import useShowToast from '../hooks/useShowToast'
import userAtom from '../atoms/userAtom'
import { Link as RouterLink } from 'react-router-dom'

export default function LoginCard() {
  const [showPassword, setShowPassword] = useState(false)
  const setAuthScreen = useSetRecoilState(authScreenAtom)
  const setUser = useSetRecoilState(userAtom)
  const [loading, setLoading] = useState(false)

  const [inputs, setInputs] = useState({
    username: '',
    password: '',
  })
  const showToast = useShowToast()

  const handleLogin = async () => {
    // Validation
    if (!inputs.username.trim() || !inputs.password.trim()) {
      showToast('Error', 'Please fill in all fields', 'error')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputs),
      })
      const data = await res.json()

      if (data.error) {
        showToast('Error', data.error, 'error')
        return
      }

      // Store user data and update state
      localStorage.setItem('user-threads', JSON.stringify(data))
      setUser(data)

      // Show success message
      showToast('Success', `Welcome back, ${data.username}!`, 'success')
    } catch (error) {
      console.error('Login error:', error)
      showToast('Error', error.message || 'Something went wrong', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin()
    }
  }

  return (
    <Flex align={'center'} justify={'center'} minH={'100vh'} py={8}>
      <Stack spacing={8} mx={'auto'} maxW={'lg'} w={'full'} px={6}>
        <Stack align={'center'}>
          <Heading fontSize={'4xl'} textAlign={'center'}>
            Login
          </Heading>
          <Text fontSize={'lg'} color={'gray.600'} textAlign={'center'}>
            Welcome back to Threads Clone ✅
          </Text>
        </Stack>
        <Box
          rounded={'lg'}
          bg={useColorModeValue('white', 'gray.dark')}
          boxShadow={'lg'}
          p={8}
          w={'full'}
          maxW={'400px'}
          mx={'auto'}
        >
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Username or Email</FormLabel>
              <Input
                type="text"
                value={inputs.username}
                onChange={(e) => setInputs((inputs) => ({ ...inputs, username: e.target.value }))}
                onKeyPress={handleKeyPress}
                placeholder="Enter your username or email"
                autoFocus
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={inputs.password}
                  onChange={(e) => setInputs((inputs) => ({ ...inputs, password: e.target.value }))}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your password"
                />
                <InputRightElement h={'full'}>
                  <Button
                    variant={'ghost'}
                    onClick={() => setShowPassword((showPassword) => !showPassword)}
                    size="sm"
                  >
                    {showPassword ? <ViewIcon /> : <ViewOffIcon />}
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>

            {/* Forgot Password Link */}
            <Box textAlign="right">
              <Link
                as={RouterLink}
                to="/forgot-password"
                color={'blue.400'}
                fontSize="sm"
                _hover={{ textDecoration: 'underline' }}
              >
                Forgot password?
              </Link>
            </Box>

            <Stack spacing={6} pt={2}>
              <Button
                loadingText="Logging in..."
                size="lg"
                bg={useColorModeValue('gray.600', 'blue.500')}
                color={'white'}
                _hover={{
                  bg: useColorModeValue('gray.700', 'blue.600'),
                  transform: 'translateY(-1px)',
                  boxShadow: 'lg',
                }}
                _active={{
                  bg: useColorModeValue('gray.800', 'blue.700'),
                  transform: 'translateY(0)',
                }}
                onClick={handleLogin}
                isLoading={loading}
                loadingText="Signing in..."
                transition="all 0.2s"
              >
                Sign in
              </Button>
            </Stack>

            <Stack pt={4}>
              <Text align={'center'} fontSize="sm" color="gray.600">
                Don&apos;t have an account?{' '}
                <Link
                 color={'blue.400'}
                 onClick={() => setAuthScreen('signup')}
                  fontWeight="semibold"
                  _hover={{ textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Sign up
                </Link>
              </Text>
            </Stack>


          </Stack>
        </Box>
      </Stack>
    </Flex>
  )
}


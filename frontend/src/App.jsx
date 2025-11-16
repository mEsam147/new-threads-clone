import { Box, Container } from '@chakra-ui/react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import UserPage from './pages/UserPage'
import PostPage from './pages/PostPage'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import { useRecoilValue } from 'recoil'
import userAtom from './atoms/userAtom'
import UpdateProfilePage from './pages/UpdateProfilePage'
import CreatePost from './components/CreatePost'
import ChatPage from './pages/ChatPage'
import { SettingsPage } from './pages/SettingsPage'
import NotificationsPage from './pages/NotificationsPage'
import SearchPage from './pages/SearchPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

function App() {
  const user = useRecoilValue(userAtom)
  const { pathname } = useLocation()

  return (
    <Box position={'relative'} w="full">
      <Container maxW={pathname === '/' ? { base: '620px', md: '900px' } : '620px'}>
        <Header />
        <Routes>
          <Route path="/" element={user ? <HomePage /> : <Navigate to="/auth" />} />
          <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/" />} />
          <Route path="/update" element={user ? <UpdateProfilePage /> : <Navigate to="/auth" />} />
          <Route
            path="/notifications"
            element={user ? <NotificationsPage /> : <Navigate to="/auth" />}
          />
          <Route path="/search" element={user ? <SearchPage /> : <Navigate to="/auth" />} />
          <Route path="/chat" element={user ? <ChatPage /> : <Navigate to={'/auth'} />} />
          <Route path="/settings" element={user ? <SettingsPage /> : <Navigate to={'/auth'} />} />

          {/* Auth related routes */}
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          <Route
            path="/:username"
            element={
              user ? (
                <>
                  <UserPage />
                  <CreatePost />
                </>
              ) : (
                <UserPage />
              )
            }
          />
          <Route path="/:username/post/:pid" element={<PostPage />} />
        </Routes>
      </Container>
    </Box>
  )
}

export default App

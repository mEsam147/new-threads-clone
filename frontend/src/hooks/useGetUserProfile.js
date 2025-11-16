import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import useShowToast from './useShowToast'

const useGetUserProfile = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const { username } = useParams()
  const showToast = useShowToast()

  useEffect(() => {
    const getUser = async () => {
      try {
        // Ensure username is properly encoded and is a string
        if (!username || typeof username !== 'string') {
          showToast('Error', 'Invalid username', 'error')
          setLoading(false)
          return
        }

        const res = await fetch(`/api/users/profile/${encodeURIComponent(username)}`)
        const data = await res.json()

        if (data.error) {
          showToast('Error', data.error, 'error')
          return
        }

        if (data.isFrozen) {
          setUser(null)
          return
        }
        setUser(data)
      } catch (error) {
        showToast('Error', error.message, 'error')
      } finally {
        setLoading(false)
      }
    }
    getUser()
  }, [username, showToast])

  return { loading, user }
}

export default useGetUserProfile

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import { getCurrentUser } from '../api/authApi'
import type { UserProfile } from '../types/auth'

interface UserContextType {
  currentUser: UserProfile | null
  setCurrentUser: React.Dispatch<
    React.SetStateAction<UserProfile | null>
  >
  isUserLoading: boolean
}

const UserContext = createContext<UserContextType | undefined>(
  undefined,
)

export function UserProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [currentUser, setCurrentUser] =
    useState<UserProfile | null>(null)

  const [isUserLoading, setIsUserLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token')

      if (!token) {
        setIsUserLoading(false)
        return
      }

      try {
        const user = await getCurrentUser()
        setCurrentUser(user)
      } catch {
        setCurrentUser(null)
      } finally {
        setIsUserLoading(false)
      }
    }

    loadUser()
  }, [])

  return (
    <UserContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isUserLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)

  if (!context) {
    throw new Error(
      'useUser must be used inside UserProvider',
    )
  }

  return context
}
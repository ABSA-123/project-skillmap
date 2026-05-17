"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"

import {
  changePassword,
  deleteAccount,
  getCurrentUser,
  login,
  logout,
  signup,
  updateProfile,
  type ProfileUpdate,
  type SignupInput,
} from "@/lib/auth"
import type { PublicUser } from "@/lib/types"

interface AuthContextType {
  user: PublicUser | null
  isLoading: boolean
  login: typeof login
  signup: typeof signup
  logout: () => void
  updateProfile: (update: ProfileUpdate) => void
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  deleteAccount: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    setUser(getCurrentUser())
    setIsLoading(false)
  }, [])

  const handleLogin = useCallback(
    async (email: string, pass: string) => {
      const u = await login(email, pass)
      setUser(u)
      return u
    },
    []
  )

  const handleSignup = useCallback(
    async (input: SignupInput) => {
      const u = await signup(input)
      setUser(u)
      return u
    },
    []
  )

  const handleLogout = useCallback(() => {
    logout()
    setUser(null)
    router.replace("/login")
  }, [router])

  const handleUpdateProfile = useCallback(
    (update: ProfileUpdate) => {
      if (!user) return
      const next = updateProfile(user.id, update)
      setUser(next)
    },
    [user]
  )

  const handleChangePassword = useCallback(
    async (curr: string, next: string) => {
      if (!user) return
      await changePassword(user.id, curr, next)
    },
    [user]
  )

  const handleDeleteAccount = useCallback(() => {
    if (!user) return
    deleteAccount(user.id)
    setUser(null)
  }, [user])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login: handleLogin,
        signup: handleSignup,
        logout: handleLogout,
        updateProfile: handleUpdateProfile,
        changePassword: handleChangePassword,
        deleteAccount: handleDeleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

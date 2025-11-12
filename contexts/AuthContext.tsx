'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

type UserRole = 'super_admin' | 'admin' | 'moderator' | 'viewer'

interface AdminUser {
  uid: string
  email: string
  name: string
  role: UserRole
}

interface AuthContextType {
  user: AdminUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Role permissions
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: ['*'], // All permissions
  admin: [
    'barbers.create',
    'barbers.edit',
    'barbers.delete',
    'users.view',
    'users.block',
    'users.delete',
    'logs.view',
    'marketing.view',
    'appointments.view',
    'notifications.view',
    'notifications.send',
  ],
  moderator: [
    'barbers.view',
    'users.view',
    'users.block',
    'logs.view',
    'marketing.view',
    'appointments.view',
  ],
  viewer: [
    'barbers.view',
    'users.view',
    'logs.view',
    'marketing.view',
    'appointments.view',
  ],
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Check if user is admin
          const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid))

          if (adminDoc.exists()) {
            const adminData = adminDoc.data()
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: adminData.name || 'Admin',
              role: adminData.role || 'viewer',
            })

            // Set auth token in cookie for middleware
            const token = await firebaseUser.getIdToken()
            document.cookie = `firebase-auth-token=${token}; path=/; max-age=3600; SameSite=Lax`
          } else {
            // Not an admin user
            await auth.signOut()
            setUser(null)
            // Clear auth cookie
            document.cookie = 'firebase-auth-token=; path=/; max-age=0'
          }
        } catch (error) {
          console.error('Error fetching admin data:', error)
          setUser(null)
          // Clear auth cookie
          document.cookie = 'firebase-auth-token=; path=/; max-age=0'
        }
      } else {
        setUser(null)
        // Clear auth cookie
        document.cookie = 'firebase-auth-token=; path=/; max-age=0'
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signInUser = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const adminDoc = await getDoc(doc(db, 'admins', userCredential.user.uid))

    if (!adminDoc.exists()) {
      await auth.signOut()
      throw new Error('Bu hesap admin yetkisine sahip değil!')
    }
  }

  const signOutUser = async () => {
    await signOut(auth)
    setUser(null)
    // Clear auth cookie
    document.cookie = 'firebase-auth-token=; path=/; max-age=0'
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false

    const permissions = ROLE_PERMISSIONS[user.role]

    // Super admin has all permissions
    if (permissions.includes('*')) return true

    return permissions.includes(permission)
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn: signInUser,
      signOut: signOutUser,
      hasPermission,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

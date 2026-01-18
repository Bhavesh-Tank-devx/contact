"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface AuthWrapperProps {
  children: React.ReactNode
}

/**
 * PublicRoute wrapper for login and signup pages
 * Redirects to home page if user is already authenticated
 */
export function PublicRoute({ children }: AuthWrapperProps) {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Check if JWT token exists in localStorage
    const token = localStorage.getItem("jwt")
    
    if (token) {
      // User is authenticated, redirect to home page
      router.push("/")
    } else {
      // User is not authenticated, allow access to public route
      setIsChecking(false)
    }
  }, [router])

  // Show loading state while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    )
  }

  return <>{children}</>
}

/**
 * ProtectedRoute wrapper for pages that require authentication
 * Redirects to login page if user is not authenticated
 */
export function ProtectedRoute({ children }: AuthWrapperProps) {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Check if JWT token exists in localStorage
    const token = localStorage.getItem("jwt")
    
    if (!token) {
      // User is not authenticated, redirect to login page
      router.push("/login")
    } else {
      // User is authenticated, allow access to protected route
      setIsChecking(false)
    }
  }, [router])

  // Show loading state while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    )
  }

  return <>{children}</>
}

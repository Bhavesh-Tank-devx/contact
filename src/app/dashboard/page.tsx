"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, User, ArrowLeft, Users, Contact, TrendingUp, Phone, Mail, Calendar } from "lucide-react"
import axios from "axios"
import { ProtectedRoute } from "@/components/auth-wrappers"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { UserProfileDialog } from "@/components/user-profile-dialog"

interface DashboardStats {
  totalUsers: number
  totalContacts: number
  userAnalytics: {
    _id: string
    username: string
    email: string
    contactCount: number
  }[]
}

interface UserData {
  _id: string
  username: string
  email: string
  contactCount?: number
}

interface Contact {
    _id: string
    name: string
    email?: string
    phone: string
    age?: number
    profileImage?: string
    createdAt: string
}

function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<{ username: string; email: string; role?: string; profileImage?: string} | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)

  // Active user contact modal state
  const [activeUser, setActiveUser] = useState<UserData | null>(null)
  const [userContacts, setUserContacts] = useState<Contact[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeUserLoading, setActiveUserLoading] = useState(false)

  useEffect(() => {
    // Check local storage for user info
    const userStr = localStorage.getItem("user")
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr)
        setCurrentUser(parsedUser)
        
        // Client-side role check
        if (parsedUser.role !== 'superadmin') {
             setUnauthorized(true)
             setLoading(false)
             return
        }
      } catch (e) {
        console.error("Failed to parse user info", e)
      }
    }
    
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const jwt = localStorage.getItem("jwt")
      const response = await axios.get("/api/dashboard", {
        headers: { Authorization: `Bearer ${jwt}` },
      })
      setStats(response.data.data)
    } catch (error: any) {
      console.error("Failed to fetch dashboard stats:", error)
      
      if (error.response?.status === 403) {
          setUnauthorized(true)
          return
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to load dashboard statistics",
      })
      
      if (error.response?.status === 401) {
         router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUserClick = async (user: UserData) => {
      setActiveUser(user)
      setIsModalOpen(true)
      setActiveUserLoading(true)
      setUserContacts([]) // Reset previous contacts

      try {
          const jwt = localStorage.getItem("jwt")
          const response = await axios.get(`/api/users/${user._id}/contacts`, {
              headers: { Authorization: `Bearer ${jwt}` },
          })
          setUserContacts(response.data.data || [])
      } catch (error) {
          console.error("Failed to fetch user contacts:", error)
          toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to load user contacts",
          })
      } finally {
          setActiveUserLoading(false)
      }
  }

  const handleLogout = () => {
    localStorage.removeItem("jwt")
    localStorage.removeItem("user")
    router.push("/login")
  }

  const handleUserUpdated = (updatedUser: any) => {
    setCurrentUser(updatedUser)
    localStorage.setItem("user", JSON.stringify(updatedUser))
  }



  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/')} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Home
            </Button>
            <div className="font-bold text-xl text-primary">Admin Dashboard</div>
         </div>
         
         <div className="flex items-center gap-4">
           <UserProfileDialog user={currentUser} onUserUpdated={handleUserUpdated} />
          
          <Button 
            onClick={handleLogout}
            variant="destructive"
            size="sm"
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </nav>

      <main className="container mx-auto p-8">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">System Overview</h1>
            <p className="text-gray-500 mt-1">Analytics and user activity monitoring.</p>
        </div>

        {unauthorized ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-lg shadow-sm">
                <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
                    <LogOut className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
                <p className="text-gray-500 text-lg">You are not allowed to view this page.</p>
                <Button onClick={() => router.push('/')} variant="outline" className="mt-4">
                    Return to Home
                </Button>
            </div>
        ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium">Loading analytics...</p>
            </div>
        ) : stats ? (
            <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-gray-500">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalUsers}</div>
                            <p className="text-xs text-gray-400 mt-1">Registered accounts</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-gray-500">Total Contacts</CardTitle>
                            <Contact className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalContacts}</div>
                            <p className="text-xs text-gray-400 mt-1">Across all users</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-gray-500">Avg. Contacts/User</CardTitle>
                            <TrendingUp className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.totalUsers > 0 
                                    ? (stats.totalContacts / stats.totalUsers).toFixed(1) 
                                    : 0}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Engagement metric</p>
                        </CardContent>
                    </Card>
                </div>

                {/* User Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>User Activity</CardTitle>
                        <CardDescription>Breakdown of contacts created by each user.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 font-medium text-gray-500">Username</th>
                                        <th className="px-6 py-3 font-medium text-gray-500">Email</th>
                                        <th className="px-6 py-3 font-medium text-gray-500 text-right">Contacts Created</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {stats.userAnalytics.map((user) => (
                                        <tr 
                                            key={user._id} 
                                            className="bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                                            onClick={() => handleUserClick(user)}
                                        >
                                            <td className="px-6 py-4 font-medium text-gray-900">{user.username}</td>
                                            <td className="px-6 py-4 text-gray-500">{user.email}</td>
                                            <td className="px-6 py-4 text-gray-900 text-right font-semibold">{user.contactCount}</td>
                                        </tr>
                                    ))}
                                    {stats.userAnalytics.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                                No users found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* User Contacts Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Contacts for {activeUser?.username}</DialogTitle>
                            <DialogDescription>
                                View all contacts created by this user.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="mt-4">
                            {activeUserLoading ? (
                                <div className="flex flex-col items-center justify-center py-10 gap-2">
                                     <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                     <p className="text-gray-500 text-sm">Loading contacts...</p>
                                </div>
                            ) : userContacts.length === 0 ? (
                                <div className="text-center py-10 border rounded-lg bg-gray-50">
                                    <p className="text-gray-500">No contacts found for this user.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {userContacts.map((contact) => {
                                        const gradients = [
                                            "from-pink-400 to-rose-500",
                                            "from-orange-400 to-amber-500",
                                            "from-green-400 to-emerald-500",
                                            "from-blue-400 to-indigo-500",
                                            "from-purple-400 to-violet-500",
                                            "from-teal-400 to-cyan-500"
                                        ]
                                        const gradientIndex = contact.name.length % gradients.length
                                        const gradientClass = gradients[gradientIndex]
        
                                        return (
                                        <div key={contact._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                {/* Contact Avatar */}
                                                {contact.profileImage ? (
                                                    <img 
                                                        src={contact.profileImage} 
                                                        alt={contact.name}
                                                        className="w-12 h-12 rounded-full object-cover border border-gray-200"
                                                    />
                                                ) : (
                                                    <div className={`w-12 h-12 rounded-full bg-linear-to-br ${gradientClass} flex items-center justify-center text-white font-bold text-lg shadow-sm border border-gray-100`}>
                                                        {contact.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-gray-900 truncate">{contact.name}</h4>
                                                    
                                                    <div className="mt-1 space-y-1">
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Phone className="h-3 w-3" />
                                                            <span className="truncate">{contact.phone}</span>
                                                        </div>
                                                        
                                                        {contact.email && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <Mail className="h-3 w-3" />
                                                                <span className="truncate">{contact.email}</span>
                                                            </div>
                                                        )}
                                                        
                                                        {contact.age && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <Calendar className="h-3 w-3" />
                                                                <span>{contact.age} years old</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )})}
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        ) : (
            <div className="text-center text-red-500">Failed to load data.</div>
        )}

      </main>
    </div>
  )
}

export default function WrappedDashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  )
}

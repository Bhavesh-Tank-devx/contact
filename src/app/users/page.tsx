"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, User, ArrowLeft, Phone, Mail, Calendar } from "lucide-react"
import axios from "axios"
import { ProtectedRoute } from "@/components/auth-wrappers"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import {
  Card,
  CardContent,
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

interface UserData {
  _id: string
  username: string
  email: string
  role: string
  createdAt: string
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

function UsersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<{ username: string; email: string; role?: string } | null>(null)
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)

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
           router.push('/')
           return
        }
      } catch (e) {
        console.error("Failed to parse user info", e)
      }
    }
    
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const jwt = localStorage.getItem("jwt")
      const response = await axios.get("/api/users", {
        headers: { Authorization: `Bearer ${jwt}` },
      })
      setUsers(response.data.data || [])
    } catch (error: any) {
      console.error("Failed to fetch users:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to load users",
      })
      // If unauthorized/forbidden, redirect
      if (error.response?.status === 403 || error.response?.status === 401) {
         router.push('/')
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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/')} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <div className="font-bold text-xl text-primary">Registered Users</div>
         </div>
         
         <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <User className="h-4 w-4" />
            <span>Hello, {currentUser?.username || currentUser?.email || "User"}</span>
          </div>
          
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
            <h1 className="text-3xl font-bold text-gray-900">Registered Users</h1>
            <p className="text-gray-500 mt-1">Manage and view all registered users in the system.</p>
        </div>

        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium">Loading users...</p>
            </div>
        ) : (
            <>
                <div className="flex flex-col gap-3">
                    {users.map((user) => {
                        // Generate a consistent random gradient based on username length
                        const gradients = [
                            "from-pink-400 to-rose-500",
                            "from-orange-400 to-amber-500",
                            "from-green-400 to-emerald-500",
                            "from-blue-400 to-indigo-500",
                            "from-purple-400 to-violet-500",
                            "from-teal-400 to-cyan-500"
                        ]
                        const gradientIndex = user.username.length % gradients.length
                        const gradientClass = gradients[gradientIndex]

                        return (
                            <Card 
                                key={user._id} 
                                className="hover:shadow-md border border-gray-100 shadow-sm cursor-pointer active:scale-[0.99] transition-all duration-200"
                                onClick={() => handleUserClick(user)}
                            >
                                <div className="flex items-center p-4">
                                    {/* Left: Random Gradient Avatar */}
                                    <div className={`flex items-center justify-center h-12 w-12 rounded-full bg-linear-to-br ${gradientClass} text-white font-bold text-lg shadow-sm shrink-0 mr-4`}>
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                    
                                    {/* Middle: User Info */}
                                    <div className="flex-1 min-w-0 flex items-center gap-3">
                                        <h3 className="font-bold text-lg text-gray-900 truncate">{user.username}</h3>
                                        <p className="text-lg text-gray-500 truncate">{user.email}</p>
                                    </div>
                                    
                                    {/* Right: Role Badge */}
                                    <div className="ml-4 shrink-0">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                             user.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-600'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
                
                {users.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-lg shadow-xs border border-dashed border-gray-300">
                        <div className="mx-auto h-12 w-12 text-gray-300 mb-3">
                            <User className="h-full w-full" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No users found</h3>
                        <p className="text-gray-500 mt-1">There are currently no registered users in the system.</p>
                    </div>
                )}
            </>
        )}

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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      </main>
    </div>
  )
}

export default function WrappedUsersPage() {
  return (
    <ProtectedRoute>
      <UsersPage />
    </ProtectedRoute>
  )
}

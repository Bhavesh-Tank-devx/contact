"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, User, Plus, Pencil, Trash2, Mail, Phone, Calendar, Users, TrendingUp, LayoutDashboard } from "lucide-react"
import axios from "axios"
import { ProtectedRoute } from "@/components/auth-wrappers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { UserProfileDialog } from "@/components/user-profile-dialog"

interface Contact {
  _id: string
  name: string
  email?: string
  phone: string
  age?: number
  profileImage?: string
  createdAt: string
  updatedAt: string
}

function Home() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<{ username: string; email: string; role?: string; profileImage?: string } | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [viewingContact, setViewingContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    profileImage: "",
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    // Get user info from localStorage
    const userStr = localStorage.getItem("user")
    if (userStr) {
      try {
        setUser(JSON.parse(userStr))
      } catch (e) {
        console.error("Failed to parse user info", e)
      }
    }
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      const jwt = localStorage.getItem("jwt")
      const response = await axios.get("/api/contacts", {
        headers: { Authorization: `Bearer ${jwt}` },
      })
      setContacts(response.data.data || [])
    } catch (error) {
      console.error("Failed to fetch contacts:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load contacts",
      })
    }
  }

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const jwt = localStorage.getItem("jwt")
      let uploadedImageUrl = formData.profileImage

      // Upload image if file is selected
      if (selectedFile) {
        const imageFormData = new FormData()
        imageFormData.append('file', selectedFile)
        
        const uploadResponse = await axios.post('/api/upload', imageFormData, {
          headers: { 
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'multipart/form-data'
          },
        })
        
        if (uploadResponse.data.url) {
          uploadedImageUrl = uploadResponse.data.url
        }
      }

      const payload: any = {
        name: formData.name,
        phone: formData.phone,
      }
      
      if (formData.email) payload.email = formData.email
      if (formData.age) payload.age = parseInt(formData.age)
      if (uploadedImageUrl) payload.profileImage = uploadedImageUrl

      await axios.post("/api/contacts", payload, {
        headers: { Authorization: `Bearer ${jwt}` },
      })

      toast({
        variant: "success",
        title: "Success",
        description: "Contact created successfully",
      })

      setIsCreateOpen(false)
      setFormData({ name: "", email: "", phone: "", age: "", profileImage: "" })
      setSelectedFile(null)
      setImagePreview(null)
      fetchContacts()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to create contact",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingContact) return
    setLoading(true)

    try {
      const jwt = localStorage.getItem("jwt")
      let uploadedImageUrl = formData.profileImage

      // Upload image if new file is selected
      if (selectedFile) {
        const imageFormData = new FormData()
        imageFormData.append('file', selectedFile)
        
        const uploadResponse = await axios.post('/api/upload', imageFormData, {
          headers: { 
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'multipart/form-data'
          },
        })
        
        if (uploadResponse.data.url) {
          uploadedImageUrl = uploadResponse.data.url
        }
      }

      const payload: any = {
        name: formData.name,
        phone: formData.phone,
      }
      
      if (formData.email) payload.email = formData.email
      if (formData.age) payload.age = parseInt(formData.age)
      if (uploadedImageUrl) payload.profileImage = uploadedImageUrl

      await axios.put(`/api/contacts/${editingContact._id}`, payload, {
        headers: { Authorization: `Bearer ${jwt}` },
      })

      toast({
        variant: "success",
        title: "Success",
        description: "Contact updated successfully",
      })

      setIsEditOpen(false)
      setEditingContact(null)
      setFormData({ name: "", email: "", phone: "", age: "", profileImage: "" })
      setSelectedFile(null)
      setImagePreview(null)
      fetchContacts()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to update contact",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteContact = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return

    try {
      const jwt = localStorage.getItem("jwt")
      await axios.delete(`/api/contacts/${id}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      })

      toast({
        variant: "success",
        title: "Success",
        description: "Contact deleted successfully",
      })

      setIsViewOpen(false)
      setViewingContact(null)
      fetchContacts()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete contact",
      })
    }
  }

  const openViewDialog = (contact: Contact) => {
    setViewingContact(contact)
    setIsViewOpen(true)
  }

  const openEditDialog = (contact: Contact) => {
    setEditingContact(contact)
    setFormData({
      name: contact.name,
      email: contact.email || "",
      phone: contact.phone,
      age: contact.age?.toString() || "",
      profileImage: contact.profileImage || "",
    })
    setSelectedFile(null)
    setImagePreview(contact.profileImage || null)
    setIsViewOpen(false)
    setIsEditOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("jwt")
    localStorage.removeItem("user")
    router.push("/login")
  }

  const handleUserUpdated = (updatedUser: any) => {
    setUser(updatedUser)
    localStorage.setItem("user", JSON.stringify(updatedUser))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between">
        <div className="font-bold text-xl text-primary">Contact App</div>
        
        <div className="flex items-center gap-4">
           <UserProfileDialog user={user} onUserUpdated={handleUserUpdated} />
          
          {user?.role === "superadmin" && (
            <div className="flex gap-2">
               <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => router.push("/users")}
              >
                <Users className="h-4 w-4" />
                Users
              </Button>
                <Button 
                size="sm" 
                className="gap-2 bg-black text-white hover:bg-gray-800"
                onClick={() => router.push("/dashboard")}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </div>
          )}
          
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

      {/* Main Content */}
      <main className="container mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Contacts</h1>
            <p className="text-gray-500 mt-1">{contacts.length} contacts</p>
          </div>

          {/* Create Contact Dialog */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Contact</DialogTitle>
                <DialogDescription>
                  Add a new contact to your list. Only name and phone are required.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateContact} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age (Optional)</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="25"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profileImage">Profile Image (Optional)</Label>
                  <Input
                    id="profileImage"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    </div>
                  )}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Contact"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* View Contact Details Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Contact Details</DialogTitle>
            </DialogHeader>
              {viewingContact && (
              <div className="space-y-6">
                {/* Profile Image */}
                <div className="flex justify-center">
                  {viewingContact.profileImage ? (
                    <img 
                      src={viewingContact.profileImage} 
                      alt={viewingContact.name}
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-100"
                    />
                  ) : (
                    // Generate gradient immediately before use
                    (() => {
                      const gradients = [
                        "from-pink-400 to-rose-500",
                        "from-orange-400 to-amber-500",
                        "from-green-400 to-emerald-500",
                        "from-blue-400 to-indigo-500",
                        "from-purple-400 to-violet-500",
                        "from-teal-400 to-cyan-500"
                      ]
                      const gradientIndex = viewingContact.name.length % gradients.length
                      const gradientClass = gradients[gradientIndex]
                      
                      return (
                        <div className={`w-32 h-32 rounded-full bg-linear-to-br ${gradientClass} flex items-center justify-center text-white text-4xl font-bold border-4 border-gray-100`}>
                          {viewingContact.name.charAt(0).toUpperCase()}
                        </div>
                      )
                    })()
                  )}
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900">{viewingContact.name}</h3>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center gap-3 text-gray-700">
                      <Phone className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="font-medium">{viewingContact.phone}</p>
                      </div>
                    </div>

                    {viewingContact.email && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <Mail className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="font-medium">{viewingContact.email}</p>
                        </div>
                      </div>
                    )}

                    {viewingContact.age && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-500">Age</p>
                          <p className="font-medium">{viewingContact.age} years old</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => openEditDialog(viewingContact)}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 gap-2"
                    onClick={() => handleDeleteContact(viewingContact._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Contact Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Contact</DialogTitle>
              <DialogDescription>
                Update contact information
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateContact} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone *</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email (Optional)</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-age">Age (Optional)</Label>
                <Input
                  id="edit-age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-profileImage">Profile Image (Optional)</Label>
                <Input
                  id="edit-profileImage"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Updating..." : "Update Contact"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Contacts List */}
        {contacts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No contacts yet. Create your first contact!</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-3">
            {contacts.map((contact) => {
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
              <Card 
                key={contact._id} 
                className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500"
                onClick={() => openViewDialog(contact)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Profile Picture */}
                    {contact.profileImage ? (
                      <img 
                        src={contact.profileImage} 
                        alt={contact.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className={`w-16 h-16 rounded-full bg-linear-to-br ${gradientClass} flex items-center justify-center text-white text-xl font-bold border-2 border-gray-200`}>
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    {/* Name */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{contact.name}</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )})}
          </div>
        )}
      </main>
    </div>
  )
}

export default function WrappedHome() {
  return (
    <ProtectedRoute>
      <Home />
    </ProtectedRoute>
  )
}

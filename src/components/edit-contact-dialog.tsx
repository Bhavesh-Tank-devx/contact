"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Pencil, Loader2, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import axios from "axios"

interface Contact {
    _id: string
    name: string
    email?: string
    phone: string
    age?: number
    profileImage?: string
    createdAt: string
}

interface EditContactDialogProps {
  contact: Contact;
  onContactUpdated: (contact: Contact | null) => void; 
}

export function EditContactDialog({ contact, onContactUpdated }: EditContactDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast()
    const [imagePreview, setImagePreview] = useState<string | null>(contact.profileImage || null);
    const [formData, setFormData] = useState({
        name: contact.name,
        email: contact.email || "",
        phone: contact.phone,
        age: contact.age?.toString() || ""
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open) {
             setFormData({
                name: contact.name,
                email: contact.email || "",
                phone: contact.phone,
                age: contact.age?.toString() || ""
            });
            setImagePreview(contact.profileImage || null);
            setSelectedFile(null);
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const jwt = localStorage.getItem("jwt");
            let uploadedImageUrl = imagePreview;

            if (selectedFile) {
                const imageFormData = new FormData();
                imageFormData.append('file', selectedFile);
                
                const uploadResponse = await axios.post('/api/upload', imageFormData, {
                    headers: { 
                        'Authorization': `Bearer ${jwt}`,
                        'Content-Type': 'multipart/form-data'
                    },
                });
                
                if (uploadResponse.data.url) {
                    uploadedImageUrl = uploadResponse.data.url;
                }
            }

            const payload: any = {
                name: formData.name,
                phone: formData.phone,
            }
            
            if (formData.email) payload.email = formData.email
            if (formData.age) payload.age = parseInt(formData.age)
            if (uploadedImageUrl !== undefined) payload.profileImage = uploadedImageUrl

            const response = await axios.put(`/api/contacts/${contact._id}`, payload, {
                 headers: { Authorization: `Bearer ${jwt}` },
            });

            onContactUpdated(response.data.data);
            
            toast({
                title: "Contact updated",
                description: "Contact information updated successfully.",
                variant: "success", 
            });
            setIsOpen(false);

        } catch (error: any) {
            console.error(error);
             toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to update contact",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this contact?")) return;
        
        setLoading(true);
        try {
             const jwt = localStorage.getItem("jwt");
             await axios.delete(`/api/contacts/${contact._id}`, {
                 headers: { Authorization: `Bearer ${jwt}` },
            });

            onContactUpdated(null); // Signal deletion
            toast({
                title: "Contact deleted",
                description: "Contact deleted successfully.",
                variant: "success", 
            });
            setIsOpen(false);

        } catch (error: any) {
             console.error(error);
             toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to delete contact",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Contact</DialogTitle>
                    <DialogDescription>
                        Update contact details.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="flex justify-center mb-4">
                        <div className="relative w-20 h-20 group cursor-pointer">
                             {imagePreview ? (
                                <img 
                                    src={imagePreview} 
                                    alt="Preview" 
                                    className="w-full h-full rounded-full object-cover border-2 border-gray-200"
                                />
                             ) : (
                                <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border-2 border-gray-200">
                                    <span className="text-xs">No Img</span>
                                </div>
                             )}
                             <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                 <Pencil className="w-5 h-5 text-white" />
                             </div>
                             <Input 
                                type="file" 
                                accept="image/*" 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                onChange={handleFileChange}
                             />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input 
                                id="name" 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone *</Label>
                            <Input 
                                id="phone" 
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                            id="email" 
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="age">Age</Label>
                        <Input 
                            id="age" 
                            type="number"
                            value={formData.age}
                            onChange={(e) => setFormData({...formData, age: e.target.value})}
                        />
                    </div>

                    <div className="flex justify-between pt-4">
                        <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                        </Button>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Save
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

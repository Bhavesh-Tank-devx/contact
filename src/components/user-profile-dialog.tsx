"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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

interface UserProfile {
    _id?: string;
    username: string;
    email: string;
    profileImage?: string;
    role?: string;
}

interface UserProfileDialogProps {
  user: UserProfile | null;
  onUserUpdated: (user: UserProfile) => void;
  isAdminMode?: boolean;
}

export function UserProfileDialog({ user, onUserUpdated, isAdminMode = false }: UserProfileDialogProps) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast()
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        username: "",
        email: "",
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const gradients = [
        "from-pink-400 to-rose-500",
        "from-orange-400 to-amber-500",
        "from-green-400 to-emerald-500",
        "from-blue-400 to-indigo-500",
        "from-purple-400 to-violet-500",
        "from-teal-400 to-cyan-500"
    ];

    const getGradient = (name: string) => {
        if (!name) return gradients[0];
        const index = name.length % gradients.length;
        return gradients[index];
    }

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open && user) {
            setFormData({
                username: user.username,
                email: user.email,
            });
            setImagePreview(user.profileImage || null);
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
            let uploadedImageUrl = imagePreview; // Default to current preview (could be existing url)

            // If we have a newly selected file, upload it
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

            // Prepare payload
            const payload: any = {
                username: formData.username,
                email: formData.email,
            };
            
            // Only send profileImage if it logic needs to be updated.
            // If I selected a file, I have a new URL.
            // If I didn't select a file, but imagePreview is set, it might be the old one.
            // If I didn't select a file, and imagePreview is null, maybe I deleted it? (Not implemented)
            // Just sending whatever is in uploadedImageUrl
            if (uploadedImageUrl !== undefined) {
                 payload.profileImage = uploadedImageUrl;
            }

            const endpoint = isAdminMode && user?._id 
                ? `/api/users/${user._id}` 
                : '/api/profile';

            const response = await axios.put(endpoint, payload, {
                 headers: { Authorization: `Bearer ${jwt}` },
            });

            const updatedUser = response.data.data;
            
            // Allow parent to update state
            onUserUpdated(updatedUser);
            toast({
                title: "Profile updated",
                description: "Your profile has been updated successfully.",
                variant: "success", 
            });
            setIsOpen(false);

        } catch (error: any) {
            console.error(error);
             toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to update profile",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    const handleDeleteAccount = async () => {
        if (confirm("Are you sure you want to delete your account? This action cannot be undone and will delete all your contacts.")) {
            try {
                setLoading(true);
                const jwt = localStorage.getItem("jwt");
                const endpoint = isAdminMode && user?._id
                    ? `/api/users/${user._id}`
                    : '/api/profile';
                
                await axios.delete(endpoint, {
                    headers: { Authorization: `Bearer ${jwt}` },
                });

                toast({
                    title: "Account deleted",
                    description: isAdminMode ? "User account deleted successfully." : "Your account has been successfully deleted.",
                    variant: "success",
                });
                
                if (isAdminMode) {
                     // For admin, just close dialog and notify parent (who might remove from list)
                     // In fact, ideally we should callback onUserDeleted, but for now we can rely on onUserUpdated or just page refresh/re-fetch
                     // But strictly speaking, the user is gone.
                     onUserUpdated({...user!, _id: "deleted"}); // HACK: signal deletion
                } else {
                    // Logout logic for self-deletion
                    localStorage.removeItem("jwt");
                    localStorage.removeItem("user");
                    router.push("/login");
                }

            } catch (error: any) {
                console.error("Delete account error", error);
                toast({
                    title: "Error",
                    description: error.response?.data?.error || "Failed to delete account",
                    variant: "destructive",
                });
                setLoading(false);
            }
        }
    }

    if (!user) return null;

    const displayName = user.username || "User";
    const initial = displayName.charAt(0).toUpperCase();
    const gradientClass = getGradient(displayName);

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {isAdminMode ? (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600">
                        <Pencil className="h-4 w-4" />
                    </Button>
                ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-100 cursor-pointer transition-colors border border-transparent hover:border-gray-200" title="Edit Profile">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-gray-200">
                            {user.profileImage ? (
                                <img src={user.profileImage} alt={displayName} className="w-full h-full object-cover" />
                            ) : (
                                <div className={`w-full h-full bg-linear-to-br ${gradientClass} flex items-center justify-center text-white text-xs font-bold`}>
                                    {initial}
                                </div>
                            )}
                        </div>
                        <span className="font-medium text-sm text-gray-700 max-w-[100px] truncate">{displayName}</span>
                    </div>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isAdminMode ? "Edit User" : "Edit Profile"}</DialogTitle>
                    <DialogDescription>
                        {isAdminMode ? "Update user account information." : "Update your personal information."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group cursor-pointer w-24 h-24">
                             {imagePreview ? (
                                <img 
                                    src={imagePreview} 
                                    alt="Preview" 
                                    className="w-full h-full rounded-full object-cover border-4 border-gray-100"
                                />
                             ) : (
                                <div className={`w-full h-full rounded-full bg-linear-to-br ${gradientClass} flex items-center justify-center text-white text-2xl font-bold border-4 border-gray-100`}>
                                    {initial}
                                </div>
                             )}
                             <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                 <Pencil className="w-6 h-6 text-white" />
                             </div>
                             <Input 
                                type="file" 
                                accept="image/*" 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                onChange={handleFileChange}
                                title="Change profile picture"
                             />
                        </div>
                        <p className="text-sm text-gray-500">Click avatar to change photo</p>
                    </div>

                    <div className="space-y-3">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input 
                                id="username" 
                                value={formData.username}
                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input 
                                id="email" 
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </form>
                
                <div className="border-t pt-4">
                     <Button 
                        type="button" 
                        variant="destructive" 
                        className="w-full gap-2"
                        onClick={handleDeleteAccount}
                        disabled={loading}
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Account
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

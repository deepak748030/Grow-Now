"use client"

import type React from "react"

import { useState, useEffect } from "react"
import axios from "axios"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
    Search,
    UsersIcon,
    Wallet,
    UserPlus,
    UserMinus,
    Pencil,
    Loader2,
    DollarSign,
    CheckCircle,
    AlertCircle,
    MapPin,
    Building,
    XCircle,
} from "lucide-react"

// Import the shared Input component
import { Input } from '@/components/ui/Input'

// API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api"

// Franchise Interface
interface Franchise {
    _id: string
    name: string
    cityName: string
}

// User Interface
interface User {
    _id: string
    mobileNumber: string
    name?: string
    alternateMobile?: string
    email?: string
    profilePicture?: string
    fcmToken?: string
    wallet: number
    referCode: string
    autopayBalance: number
    bonusWallet?: number
    userType: string
    gender?: string
    role: string
    tag: string
    createdAt: string
    updatedAt: string
    dob?: string
    isBlocked?: boolean
    assignedFranchiseId?: Franchise
}

// API Response Interface
interface ApiResponse {
    success: boolean
    totalUsers: number
    totalCustomer: number
    data: User[]
    message?: string
}

// Wallet Update Schema
const walletUpdateSchema = z.object({
    amount: z.number().min(1, "Amount must be at least 1").max(10000, "Amount cannot exceed 10,000"),
    reason: z.string().min(5, "Reason must be at least 5 characters").max(200, "Reason cannot exceed 200 characters"),
})

type WalletUpdateFormData = z.infer<typeof walletUpdateSchema>

// Custom Badge Component
const Badge = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
            {children}
        </span>
    )
}

// Custom Button Component
const Button = ({
    children,
    className = "",
    variant = "default",
    size = "default",
    type = "button",
    disabled = false,
    onClick,
}: {
    children: React.ReactNode
    className?: string
    variant?: "default" | "destructive" | "outline" | "ghost"
    size?: "default" | "sm" | "lg" | "icon"
    type?: "button" | "submit" | "reset"
    disabled?: boolean
    onClick?: () => void
    title?: string
}) => {
    const baseStyles =
        "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"

    const variantStyles = {
        default: "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700",
        destructive: "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700",
        outline: "border border-gray-600 bg-transparent hover:bg-gray-700 text-gray-100",
        ghost: "bg-transparent hover:bg-gray-700 text-gray-300 hover:text-gray-100",
    }

    const sizeStyles = {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6",
        icon: "h-9 w-9",
    }

    const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"

    return (
        <button
            type={type}
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    )
}

// Card Components
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    return <div className={`rounded-lg border shadow-sm ${className}`}>{children}</div>
}

const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    return <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
}

const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    return <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
}

const CardDescription = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    return <p className={`text-sm ${className}`}>{children}</p>
}

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    return <div className={`p-6 pt-0 ${className}`}>{children}</div>
}

// Table Components
const Table = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    return <table className={`w-full caption-bottom text-sm ${className}`}>{children}</table>
}

const TableHeader = ({ children }: { children: React.ReactNode }) => {
    return <thead>{children}</thead>
}

const TableBody = ({ children }: { children: React.ReactNode }) => {
    return <tbody>{children}</tbody>
}

const TableHead = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    return <th className={`h-12 px-4 text-left align-middle font-medium ${className}`}>{children}</th>
}

const TableRow = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    return <tr className={`border-b transition-colors ${className}`}>{children}</tr>
}

const TableCell = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    return <td className={`p-4 align-middle ${className}`}>{children}</td>
}

// Sheet Components
const Sheet = ({
    children,
    open,
    onOpenChange,
}: { children: React.ReactNode; open: boolean; onOpenChange: (open: boolean) => void }) => {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black/80" onClick={() => onOpenChange(false)} />
            {children}
        </div>
    )
}

const SheetContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    return (
        <div
            className={`fixed inset-y-0 right-0 z-50 flex flex-col p-6 shadow-lg animate-in slide-in-from-right duration-300 ${className}`}
        >
            {children}
        </div>
    )
}

const SheetHeader = ({ children }: { children: React.ReactNode }) => {
    return <div className="flex flex-col space-y-2">{children}</div>
}

const SheetTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    return <h3 className={`text-xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
}

const SheetDescription = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    return <p className={`text-sm ${className}`}>{children}</p>
}

const SheetFooter = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    return <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}>{children}</div>
}

// Loading Spinner Component
const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
)

// Empty State Component
const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center p-8 text-gray-400">
        <UsersIcon className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg">{message}</p>
    </div>
)

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [userDetailOpen, setUserDetailOpen] = useState(false)
    const [walletUpdateOpen, setWalletUpdateOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [apiError, setApiError] = useState<string | null>(null)
    const [apiSuccess, setApiSuccess] = useState<string | null>(null)
    const [totalUsers, setTotalUsers] = useState(0)

    // Form for wallet update
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<WalletUpdateFormData>({
        resolver: zodResolver(walletUpdateSchema),
        defaultValues: {
            amount: 100,
            reason: "",
        },
    })

    // Fetch users data
    useEffect(() => {
        const fetchUsers = async () => {
            setApiError(null) // Clear previous errors
            setApiSuccess(null) // Clear previous success messages
            try {
                setIsLoading(true)
                const response = await axios.get<ApiResponse>(`${API_URL}/users?limit=1000`)
                if (response.data && response.data.success) {
                    setUsers(response.data.data)
                    setTotalUsers(response.data.totalUsers)
                    setApiSuccess("Users loaded successfully!")
                } else {
                    setApiError(response.data.message || "Failed to fetch users")
                }
            } catch (error) {
                console.error("Error fetching users:", error)
                setApiError("An error occurred while fetching users.")
            } finally {
                setIsLoading(false)
            }
        }

        fetchUsers()
    }, [])

    // Filter users based on search query only
    const filteredUsers = users.filter((user) => {
        const searchLower = searchQuery.toLowerCase()
        return (
            user.name?.toLowerCase().includes(searchLower) ||
            user.mobileNumber.includes(searchQuery) ||
            user.email?.toLowerCase().includes(searchLower) ||
            user.referCode.toLowerCase().includes(searchLower) ||
            user.userType.toLowerCase().includes(searchLower) ||
            user.tag.toLowerCase().includes(searchLower) ||
            user.assignedFranchiseId?.name.toLowerCase().includes(searchLower) ||
            user.assignedFranchiseId?.cityName.toLowerCase().includes(searchLower)
        )
    })

    // Handle user detail view
    const handleViewUser = (user: User) => {
        setSelectedUser(user)
        setUserDetailOpen(true)
        setApiError(null) // Clear messages when opening sheet
        setApiSuccess(null)
    }

    // Handle wallet update modal
    const handleWalletUpdate = (user: User) => {
        setSelectedUser(user)
        setWalletUpdateOpen(true)
        reset() // Reset form fields
        setApiError(null) // Clear messages when opening sheet
        setApiSuccess(null)
    }

    // Submit wallet update
    const onSubmitWalletUpdate = async (data: WalletUpdateFormData) => {
        if (!selectedUser) return;

        setIsSubmitting(true);
        setApiError(null);
        setApiSuccess(null);

        try {
            const response = await axios.post(`${API_URL}/users/add-balance`, {
                userId: selectedUser._id,
                amount: data.amount,
                reason: data.reason,
            });

            if (response.data && response.data.success) {
                const updatedUsers = users.map((user) =>
                    user._id === selectedUser._id
                        ? { ...user, wallet: response.data.data.wallet }
                        : user,
                );
                setUsers(updatedUsers);
                setSelectedUser(response.data.data); // Update selected user with new wallet balance
                setApiSuccess("Wallet updated successfully!");
                setWalletUpdateOpen(false);
            } else {
                setApiError(response.data.message || "Failed to update wallet.");
            }
        } catch (error) {
            console.error("Error updating wallet:", error);
            setApiError("An error occurred while updating wallet.");
        } finally {
            setIsSubmitting(false);
        }
    };


    // Toggle user block status
    const toggleBlockUser = async (user: User) => {
        setApiError(null) // Clear previous errors
        setApiSuccess(null) // Clear previous success messages
        try {
            const action = user.isBlocked ? "unblock" : "block"
            // Corrected endpoint to /users/toggle-block/:id
            const response = await axios.patch(`${API_URL}/users/toggle-block/${user._id}`)

            if (response.data && response.data.success) {
                const updatedUsers = users.map((u) => (u._id === user._id ? { ...u, isBlocked: !u.isBlocked } : u))
                setUsers(updatedUsers)

                if (selectedUser && selectedUser._id === user._id) {
                    setSelectedUser({ ...selectedUser, isBlocked: !selectedUser.isBlocked })
                }

                setApiSuccess(`User ${action}ed successfully!`)
            } else {
                setApiError(response.data.message || `Failed to ${action} user.`)
            }
        } catch (error) {
            console.error(`Error ${user.isBlocked ? "unblocking" : "blocking"} user:`, error)
            setApiError(`An error occurred while trying to ${user.isBlocked ? "unblock" : "block"} user.`)
        }
    }

    // Format date to readable string
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    // Get user type badge
    const getUserTypeBadge = (userType: string) => {
        switch (userType.toLowerCase()) {
            case "premium":
                return <Badge className="bg-purple-500 hover:bg-purple-600">Premium</Badge>
            case "free":
                return <Badge className="bg-gray-500 hover:bg-gray-600">Free</Badge>
            default:
                return <Badge>{userType}</Badge>
        }
    }

    // Get franchise information display
    const getFranchiseInfo = (user: User) => {
        if (user.assignedFranchiseId) {
            return (
                <div className="flex items-center text-sm text-emerald-400">
                    <Building className="w-3.5 h-3.5 mr-1" />
                    <span>{user.assignedFranchiseId.name}, </span>
                    <MapPin className="w-3.5 h-3.5 mx-1" />
                    <span>{user.assignedFranchiseId.cityName}</span>
                </div>
            )
        }
        return <div className="text-sm text-amber-400">Out of Service Area</div>
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <UsersIcon className="w-8 h-8 text-blue-400" />
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">USER MANAGEMENT</h1>
                    </div>
                </div>
            </header>

            <main className="p-4 sm:p-6 space-y-6">
                {/* Global API Messages */}
                {apiError && (
                    <div className="relative p-3 bg-red-900/50 border border-red-700 text-red-200 rounded flex items-start">
                        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{apiError}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-red-200 hover:bg-red-800/50"
                            onClick={() => setApiError(null)}
                        >
                            <XCircle className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {apiSuccess && (
                    <div className="relative p-3 bg-green-900/50 border border-green-700 text-green-200 rounded flex items-start">
                        <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{apiSuccess}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-green-200 hover:bg-green-800/50"
                            onClick={() => setApiSuccess(null)}
                        >
                            <XCircle className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search users by name, mobile, email, refer code, or location..."
                        className="w-full h-12 pl-10 pr-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Users Stats Cards - Only showing Total Users and Total Wallet Balance */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="bg-gray-800 border-gray-700 text-gray-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-gray-300">Total Users</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{totalUsers}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700 text-gray-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-gray-300">Total Wallet Balance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                ₹{users.reduce((sum, user) => sum + user.wallet, 0).toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* User List Table */}
                <Card className="bg-gray-800 border border-gray-700 shadow-xl overflow-hidden">
                    <CardHeader className="bg-gray-750 border-b border-gray-700">
                        <CardTitle>Users</CardTitle>
                        <CardDescription className="text-gray-400">
                            Manage user accounts, wallet balances, and access.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <LoadingSpinner />
                        ) : filteredUsers.length === 0 ? (
                            <EmptyState message="No users found" />
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-750 hover:bg-gray-750">
                                            <TableHead className="text-gray-300">User</TableHead>
                                            <TableHead className="text-gray-300">Type</TableHead>
                                            <TableHead className="text-gray-300">Tag</TableHead>
                                            <TableHead className="text-gray-300">Wallet</TableHead>
                                            <TableHead className="text-gray-300 hidden md:table-cell">Refer Code</TableHead>
                                            <TableHead className="text-gray-300 hidden md:table-cell">Location</TableHead>
                                            <TableHead className="text-gray-300 hidden lg:table-cell">Joined</TableHead>
                                            <TableHead className="text-gray-300 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.map((user) => (
                                            <TableRow key={user._id} className="border-t border-gray-700 hover:bg-gray-750">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                                            {user.profilePicture ? (
                                                                <img
                                                                    src={user.profilePicture || "/placeholder.svg"}
                                                                    alt={user.name || "User"}
                                                                    className="w-10 h-10 rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <span className="text-gray-400 text-lg font-medium">
                                                                    {user.name ? user.name[0] : user.mobileNumber[0]}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{user.name || "Unnamed User"}</div>
                                                            <div className="text-sm text-gray-400">{user.mobileNumber}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getUserTypeBadge(user.userType)}
                                                    {user.isBlocked && <Badge className="ml-2 bg-red-500 hover:bg-red-600">Blocked</Badge>}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={
                                                            user.tag === "user"
                                                                ? "bg-blue-500 hover:bg-blue-600"
                                                                : user.tag === "customer"
                                                                    ? "bg-green-500 hover:bg-green-600"
                                                                    : "bg-blue-500 hover:bg-blue-600"
                                                        }
                                                    >
                                                        {user.tag || "User"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">₹{user.wallet.toLocaleString()}</div>
                                                    {user.autopayBalance > 0 && (
                                                        <div className="text-xs text-gray-400">
                                                            Autopay: ₹{user.autopayBalance.toLocaleString()}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <code className="px-2 py-1 bg-gray-700 rounded text-gray-300">{user.referCode || "N/A"}</code>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">{getFranchiseInfo(user)}</TableCell>
                                                <TableCell className="hidden lg:table-cell">
                                                    <div className="text-sm">{formatDate(user.createdAt)}</div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="icon" variant="ghost" onClick={() => handleViewUser(user)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" onClick={() => handleWalletUpdate(user)}>
                                                            <Wallet className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant={user.isBlocked ? "ghost" : "destructive"}
                                                            onClick={() => toggleBlockUser(user)}
                                                        >
                                                            {user.isBlocked ? <UserPlus className="h-4 w-4" /> : <UserMinus className="h-4 w-4" />}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700">
                            <div className="text-sm text-gray-400">
                                Showing {filteredUsers.length} of {totalUsers} users
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>

            {/* User Detail Slide-over */}
            {selectedUser && (
                <Sheet open={userDetailOpen} onOpenChange={setUserDetailOpen}>
                    <SheetContent className="bg-gray-800 border-l border-gray-700 text-gray-100 w-full sm:max-w-md">
                        <SheetHeader>
                            <SheetTitle className="text-gray-100">User Details</SheetTitle>
                            <SheetDescription className="text-gray-400">View complete information about this user.</SheetDescription>
                        </SheetHeader>

                        <div className="mt-6 space-y-6">
                            {/* User Avatar & Name */}
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                                    {selectedUser.profilePicture ? (
                                        <img
                                            src={selectedUser.profilePicture || "/placeholder.svg"}
                                            alt={selectedUser.name || "User"}
                                            className="w-16 h-16 rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-gray-400 text-2xl font-medium">
                                            {selectedUser.name ? selectedUser.name[0] : selectedUser.mobileNumber[0]}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold">{selectedUser.name || "Unnamed User"}</h3>
                                    <div className="flex gap-2 mt-1">
                                        {getUserTypeBadge(selectedUser.userType)}
                                        {selectedUser.isBlocked && <Badge className="bg-red-500 hover:bg-red-600">Blocked</Badge>}
                                    </div>
                                </div>
                            </div>

                            {/* Franchise Information */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Location</h4>
                                <div className="p-3 rounded-md bg-gray-750 border border-gray-700">
                                    {selectedUser.assignedFranchiseId ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center">
                                                <Building className="w-4 h-4 mr-2 text-emerald-400" />
                                                <span className="font-medium">{selectedUser.assignedFranchiseId.name}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <MapPin className="w-4 h-4 mr-2 text-emerald-400" />
                                                <span>{selectedUser.assignedFranchiseId.cityName}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-amber-400">
                                            <AlertCircle className="w-4 h-4 mr-2" />
                                            <span>Out of Service Area</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Contact Info</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-sm text-gray-400">Mobile Number</p>
                                        <p className="font-medium">{selectedUser.mobileNumber}</p>
                                    </div>
                                    {selectedUser.alternateMobile && (
                                        <div>
                                            <p className="text-sm text-gray-400">Alternate Mobile</p>
                                            <p className="font-medium">{selectedUser.alternateMobile}</p>
                                        </div>
                                    )}
                                    {selectedUser.email && (
                                        <div className="col-span-2">
                                            <p className="text-sm text-gray-400">Email</p>
                                            <p className="font-medium">{selectedUser.email}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Account Details */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Account Details</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-sm text-gray-400">User ID</p>
                                        <p className="font-medium text-xs whitespace-nowrap overflow-hidden text-ellipsis">
                                            {selectedUser._id}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Gender</p>
                                        <p className="font-medium capitalize">{selectedUser.gender || "Not specified"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Wallet Balance</p>
                                        <p className="font-medium">₹{selectedUser.wallet.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Autopay Balance</p>
                                        <p className="font-medium">₹{selectedUser.autopayBalance.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Refer Code</p>
                                        <p className="font-medium">{selectedUser.referCode || "N/A"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Activity</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-sm text-gray-400">Joined</p>
                                        <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Last Updated</p>
                                        <p className="font-medium">{formatDate(selectedUser.updatedAt)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <SheetFooter className="mt-6 flex gap-2">
                            <Button variant="destructive" className="w-full" onClick={() => toggleBlockUser(selectedUser)}>
                                {selectedUser.isBlocked ? "Unblock User" : "Block User"}
                            </Button>
                            <Button
                                className="w-full"
                                onClick={() => {
                                    setUserDetailOpen(false)
                                    handleWalletUpdate(selectedUser)
                                }}
                            >
                                Update Wallet
                            </Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            )}

            {/* Update Wallet Slide-over */}
            {selectedUser && (
                <Sheet open={walletUpdateOpen} onOpenChange={setWalletUpdateOpen}>
                    <SheetContent className="bg-gray-800 border-l border-gray-700 text-gray-100 w-full sm:max-w-md">
                        <SheetHeader>
                            <SheetTitle className="text-gray-100">Update Wallet Balance</SheetTitle>
                            <SheetDescription className="text-gray-400">
                                Add or remove funds from {selectedUser.name || selectedUser.mobileNumber}'s wallet.
                            </SheetDescription>
                        </SheetHeader>

                        {apiError && (
                            <div className="mt-4 p-3 bg-red-900/50 border border-red-700 text-red-200 rounded flex items-start">
                                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                                <span>{apiError}</span>
                            </div>
                        )}

                        {apiSuccess && (
                            <div className="mt-4 p-3 bg-green-900/50 border border-green-700 text-green-200 rounded flex items-start">
                                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                                <span>{apiSuccess}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmitWalletUpdate)} className="mt-6 space-y-6">
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-400">Current Wallet Balance</h4>
                                <div className="flex items-center text-2xl font-bold">
                                    <DollarSign className="h-6 w-6 mr-1" />₹{selectedUser.wallet.toLocaleString()}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Input
                                    {...register("amount", { valueAsNumber: true })}
                                    type="number"
                                    id="amount"
                                    label="Amount (+ to add, - to subtract)"
                                    placeholder="Enter amount"
                                    className="w-full h-12 pl-10 pr-4 rounded-lg bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    error={errors.amount?.message}
                                />

                                <div className="space-y-2">
                                    <label htmlFor="reason" className="text-sm font-medium text-gray-400">
                                        Reason for update
                                    </label>
                                    <textarea
                                        {...register("reason")}
                                        id="reason"
                                        rows={3}
                                        placeholder="Explain why you're updating the wallet balance"
                                        className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {errors.reason && <p className="text-sm text-red-400 mt-1">{errors.reason.message}</p>}
                                </div>
                            </div>

                            <SheetFooter className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => setWalletUpdateOpen(false)} className="w-full">
                                    Cancel
                                </Button>
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        "Update Wallet"
                                    )}
                                </Button>
                            </SheetFooter>
                        </form>
                    </SheetContent>
                </Sheet>
            )}
        </div>
    )
}

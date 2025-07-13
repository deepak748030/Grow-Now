"use client"

import type React from "react"

import { useState, useEffect } from "react"
import axios from "axios"
import { Search, UsersIcon, Loader2, CheckCircle, AlertCircle, Trash2, Plus } from "lucide-react"

// Manager Interface
interface Manager {
    _id: string
    mobileNumber: string
    name: string
    wallet: number
    referCode: string
    bonusWallet: number
    autopayBalance: number
    userType: string
    gender: string
    role: string
    referredUsers: any[]
    createdAt: string
    updatedAt: string
    dob?: string
    referredBy?: string
}

// API Response Interface
interface ApiResponse {
    success: boolean
    data: Manager[]
    message?: string
}

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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Custom Input Component
const Input = ({
    className = "",
    type = "text",
    placeholder,
    value,
    onChange,
    ...props
}: {
    className?: string
    type?: string
    placeholder?: string
    value?: string | number
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    [key: string]: any
}) => {
    return (
        <input
            type={type}
            className={`flex h-10 w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            {...props}
        />
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

// Dialog Components
const Dialog = ({
    children,
    open,
    onOpenChange,
}: { children: React.ReactNode; open: boolean; onOpenChange: (open: boolean) => void }) => {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/80" onClick={() => onOpenChange(false)} />
            {children}
        </div>
    )
}

const DialogContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    return (
        <div
            className={`relative z-50 max-w-md w-full p-6 rounded-lg shadow-lg animate-in fade-in duration-300 ${className}`}
        >
            {children}
        </div>
    )
}

const DialogHeader = ({ children }: { children: React.ReactNode }) => {
    return <div className="flex flex-col space-y-2 mb-4">{children}</div>
}

const DialogTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    return <h3 className={`text-xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
}

const DialogDescription = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    return <p className={`text-sm ${className}`}>{children}</p>
}

const DialogFooter = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    return (
        <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4 ${className}`}>{children}</div>
    )
}

// Toast function (simplified version)
const toast = {
    success: (message: string) => {
        console.log("Success:", message)
        // In a real implementation, this would show a toast
    },
    error: (message: string) => {
        console.error("Error:", message)
        // In a real implementation, this would show a toast
    },
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

export default function ManagersPage() {
    const [managers, setManagers] = useState<Manager[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedManager, setSelectedManager] = useState<Manager | null>(null)
    const [managerDetailOpen, setManagerDetailOpen] = useState(false)
    const [createManagerOpen, setCreateManagerOpen] = useState(false)
    const [newManagerName, setNewManagerName] = useState("")
    const [newManagerMobile, setNewManagerMobile] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [apiError, setApiError] = useState<string | null>(null)
    const [apiSuccess, setApiSuccess] = useState<string | null>(null)

    // Fetch managers data
    const fetchManagers = async () => {
        try {
            setIsLoading(true)
            const response = await axios.get<ApiResponse>(`${API_URL}/admin/get-managers`)
            if (response.data && response.data.success) {
                setManagers(response.data.data)
            } else {
                setApiError(response.data.message || "Failed to fetch managers")
                toast.error("Failed to fetch managers")
            }
        } catch (error) {
            console.error("Error fetching managers:", error)
            setApiError("An error occurred while fetching managers")
            toast.error("Failed to fetch managers")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchManagers()
    }, [])

    // Filter managers based on search query
    const filteredManagers = managers.filter((manager) => {
        const searchLower = searchQuery.toLowerCase()
        return (
            manager.name?.toLowerCase().includes(searchLower) ||
            false ||
            manager.mobileNumber.includes(searchQuery) ||
            manager.referCode.toLowerCase().includes(searchLower) ||
            manager.userType.toLowerCase().includes(searchLower)
        )
    })

    // Handle manager detail view
    const handleViewManager = (manager: Manager) => {
        setSelectedManager(manager)
        setManagerDetailOpen(true)
    }

    // Create new manager
    const handleCreateManager = async () => {
        if (!newManagerMobile || !newManagerName) {
            setApiError("Mobile number and name are required")
            return
        }

        setIsSubmitting(true)
        setApiError(null)
        setApiSuccess(null)

        try {
            const response = await axios.post(`${API_URL}/admin/create-manager`, {
                mobileNumber: newManagerMobile,
                name: newManagerName,
            })

            if (response.data && response.data.success) {
                await fetchManagers() // Refresh the manager list
                setApiSuccess("Manager created successfully")
                toast.success("Manager created successfully")
                setCreateManagerOpen(false)
                setNewManagerName("")
                setNewManagerMobile("")
            } else {
                setApiError(response.data.message || "Failed to create manager")
                toast.error("Failed to create manager")
            }
        } catch (error) {
            console.error("Error creating manager:", error)
            setApiError("An error occurred while creating manager")
            toast.error("Failed to create manager")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Delete manager
    const handleDeleteManager = async (id: string) => {
        if (!confirm("Are you sure you want to delete this manager?")) {
            return
        }

        try {
            const response = await axios.delete(`${API_URL}/admin/delete-manager/${id}`)

            if (response.data && response.data.success) {
                // Remove manager from state
                setManagers(managers.filter((manager) => manager._id !== id))
                toast.success("Manager deleted successfully")

                // Close detail dialog if the deleted manager was selected
                if (selectedManager && selectedManager._id === id) {
                    setManagerDetailOpen(false)
                }
            } else {
                toast.error("Failed to delete manager")
            }
        } catch (error) {
            console.error("Error deleting manager:", error)
            toast.error("Failed to delete manager")
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

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <UsersIcon className="w-8 h-8 text-blue-400" />
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">MANAGER MANAGEMENT</h1>
                    </div>
                    <Button onClick={() => setCreateManagerOpen(true)} className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add Manager
                    </Button>
                </div>
            </header>

            <main className="p-4 sm:p-6 space-y-6">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search managers by name, mobile, or refer code..."
                        className="w-full h-12 pl-10 pr-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Managers Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="bg-gray-800 border-gray-700 text-gray-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-gray-300">Total Managers</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{managers.length}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700 text-gray-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-gray-300">Total Wallet Balance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                ₹{managers.reduce((sum, manager) => sum + manager.wallet, 0).toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700 text-gray-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-gray-300">Total Bonus Wallet</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                ₹{managers.reduce((sum, manager) => sum + manager.bonusWallet, 0).toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Manager List Table */}
                <Card className="bg-gray-800 border border-gray-700 shadow-xl overflow-hidden">
                    <CardHeader className="bg-gray-750 border-b border-gray-700">
                        <CardTitle>Managers</CardTitle>
                        <CardDescription className="text-gray-400">
                            Manage manager accounts, wallet balances, and access.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <LoadingSpinner />
                        ) : filteredManagers.length === 0 ? (
                            <EmptyState message="No managers found" />
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-750 hover:bg-gray-750">
                                            <TableHead className="text-gray-300">Manager</TableHead>
                                            <TableHead className="text-gray-300">Type</TableHead>
                                            <TableHead className="text-gray-300">Wallet</TableHead>
                                            <TableHead className="text-gray-300">Refer Code</TableHead>
                                            <TableHead className="text-gray-300">Joined</TableHead>
                                            <TableHead className="text-gray-300 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredManagers.map((manager) => (
                                            <TableRow key={manager._id} className="border-t border-gray-700 hover:bg-gray-750">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                                            <span className="text-gray-400 text-lg font-medium">
                                                                {manager.name ? manager.name[0] : manager.mobileNumber[0]}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{manager.name || "Unnamed Manager"}</div>
                                                            <div className="text-sm text-gray-400">{manager.mobileNumber}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getUserTypeBadge(manager.userType)}
                                                    <Badge className="ml-2 bg-blue-500 hover:bg-blue-600">Manager</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">₹{manager.wallet.toLocaleString()}</div>
                                                    {manager.bonusWallet > 0 && (
                                                        <div className="text-xs text-gray-400">Bonus: ₹{manager.bonusWallet.toLocaleString()}</div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <code className="px-2 py-1 bg-gray-700 rounded text-gray-300">
                                                        {manager.referCode || "N/A"}
                                                    </code>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">{formatDate(manager.createdAt)}</div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="icon" variant="ghost" onClick={() => handleViewManager(manager)}>
                                                            <UsersIcon className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="icon" variant="destructive" onClick={() => handleDeleteManager(manager._id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>

            {/* Manager Detail Dialog */}
            <Dialog open={managerDetailOpen} onOpenChange={setManagerDetailOpen}>
                <DialogContent className="bg-gray-800 border border-gray-700 text-gray-100 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Manager Details</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            View complete information about this manager.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedManager && (
                        <div className="mt-4 space-y-6">
                            {/* Manager Avatar & Name */}
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                                    <span className="text-gray-400 text-2xl font-medium">
                                        {selectedManager.name ? selectedManager.name[0] : selectedManager.mobileNumber[0]}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold">{selectedManager.name || "Unnamed Manager"}</h3>
                                    <div className="flex gap-2 mt-1">
                                        {getUserTypeBadge(selectedManager.userType)}
                                        <Badge className="bg-blue-500 hover:bg-blue-600">Manager</Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Contact Info</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-sm text-gray-400">Mobile Number</p>
                                        <p className="font-medium">{selectedManager.mobileNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Gender</p>
                                        <p className="font-medium capitalize">{selectedManager.gender || "Not specified"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Account Details */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Account Details</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-sm text-gray-400">Manager ID</p>
                                        <p className="font-medium text-xs whitespace-nowrap overflow-hidden text-ellipsis">
                                            {selectedManager._id}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Role</p>
                                        <p className="font-medium capitalize">{selectedManager.role}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Wallet Balance</p>
                                        <p className="font-medium">₹{selectedManager.wallet.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Bonus Wallet</p>
                                        <p className="font-medium">₹{selectedManager.bonusWallet.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Refer Code</p>
                                        <p className="font-medium">{selectedManager.referCode || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Autopay Balance</p>
                                        <p className="font-medium">₹{selectedManager.autopayBalance.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Activity</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-sm text-gray-400">Joined</p>
                                        <p className="font-medium">{formatDate(selectedManager.createdAt)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Last Updated</p>
                                        <p className="font-medium">{formatDate(selectedManager.updatedAt)}</p>
                                    </div>
                                    {selectedManager.dob && (
                                        <div>
                                            <p className="text-sm text-gray-400">Date of Birth</p>
                                            <p className="font-medium">{formatDate(selectedManager.dob)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Referred By */}
                            {selectedManager.referredBy && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Referral</h4>
                                    <div>
                                        <p className="text-sm text-gray-400">Referred By</p>
                                        <p className="font-medium">{selectedManager.referredBy}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="mt-6 flex gap-2">
                        <Button
                            variant="destructive"
                            className="w-full"
                            onClick={() => {
                                if (selectedManager) {
                                    handleDeleteManager(selectedManager._id)
                                }
                            }}
                        >
                            Delete Manager
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Manager Dialog */}
            <Dialog open={createManagerOpen} onOpenChange={setCreateManagerOpen}>
                <DialogContent className="bg-gray-800 border border-gray-700 text-gray-100 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create New Manager</DialogTitle>
                        <DialogDescription className="text-gray-400">Add a new manager to the system.</DialogDescription>
                    </DialogHeader>

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

                    <div className="mt-4 space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium text-gray-400">
                                Name
                            </label>
                            <Input
                                id="name"
                                value={newManagerName}
                                onChange={(e) => setNewManagerName(e.target.value)}
                                placeholder="Enter manager name"
                                className="bg-gray-700 border-gray-600 text-gray-100"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="mobile" className="text-sm font-medium text-gray-400">
                                Mobile Number
                            </label>
                            <Input
                                id="mobile"
                                value={newManagerMobile}
                                onChange={(e) => setNewManagerMobile(e.target.value)}
                                placeholder="Enter mobile number"
                                className="bg-gray-700 border-gray-600 text-gray-100"
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={() => setCreateManagerOpen(false)} className="mr-2">
                            Cancel
                        </Button>
                        <Button type="button" onClick={handleCreateManager} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Manager"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

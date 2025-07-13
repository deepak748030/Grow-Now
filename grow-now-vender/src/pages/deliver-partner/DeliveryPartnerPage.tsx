"use client"

import type React from "react"

import { useState, useEffect } from "react"
import axios from "axios"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
    Search,
    Bike,
    Wallet,
    UserPlus,
    UserMinus,
    Pencil,
    Loader2,
    DollarSign,
    CheckCircle,
    AlertCircle,
    MapPin,
    Briefcase,
} from "lucide-react"

// API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api"

// Partner Interface
interface Partner {
    _id: string
    firstName: string
    lastName: string
    gender: string
    tshirtSize: string
    state: string
    profileImageUrl: string
    mobileNumber: string
    vehicleType: string
    city: string
    branch: string
    rank: string
    wallet: number
    incentive: number
    onlineStatus: boolean
    onboardingStatus: string
    assignedBranchId: string
    aadharDetails: {
        aadharNumber: string
        aadharName: string
        aadharImage: string
    }
    panDetails: {
        panNumber: string
        panName: string
        panImage: string
    }
    withdrawalDetails: {
        onboardingStatus: string
        selectedPrimaryMethod: string
        upiId?: string
        accountNumber?: string
        ifscCode?: string
        bankAccountName?: string
        bankName?: string
    }
    createdAt: string
    updatedAt: string
    isBlocked?: boolean
}

// API Response Interface
interface ApiResponse {
    success: boolean
    data: Partner[]
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

// Custom Input Component Partner Details
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
        <Bike className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg">{message}</p>
    </div>
)

export default function DeliveryPartnerPage() {
    const [partners, setPartners] = useState<Partner[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
    const [partnerDetailOpen, setPartnerDetailOpen] = useState(false)
    const [walletUpdateOpen, setWalletUpdateOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [apiError, setApiError] = useState<string | null>(null)
    const [apiSuccess, setApiSuccess] = useState<string | null>(null)

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

    // Fetch partners data
    useEffect(() => {
        const fetchPartners = async () => {
            try {
                setIsLoading(true)
                const response = await axios.get<ApiResponse>(`${API_URL}/delivery-partner`)
                if (response.data && response.data.success) {
                    setPartners(response.data.data)
                } else {
                    setApiError(response.data.message || "Failed to fetch delivery partners")
                    toast.error("Failed to fetch delivery partners")
                }
            } catch (error) {
                console.error("Error fetching delivery partners:", error)
                setApiError("An error occurred while fetching delivery partners")
                toast.error("Failed to fetch delivery partners")
            } finally {
                setIsLoading(false)
            }
        }

        fetchPartners()
    }, [])

    // Filter partners based on search query
    const filteredPartners = partners.filter((partner) => {
        const searchLower = searchQuery.toLowerCase()
        const fullName = `${partner.firstName} ${partner.lastName}`.toLowerCase()
        return (
            fullName.includes(searchLower) ||
            partner.mobileNumber.includes(searchQuery) ||
            partner.city.toLowerCase().includes(searchLower) ||
            partner.vehicleType.toLowerCase().includes(searchLower) ||
            partner.branch.toLowerCase().includes(searchLower) ||
            partner.rank.toLowerCase().includes(searchLower)
        )
    })

    // Handle partner detail view
    const handleViewPartner = (partner: Partner) => {
        setSelectedPartner(partner)
        setPartnerDetailOpen(true)
    }

    // Handle wallet update modal
    const handleWalletUpdate = (partner: Partner) => {
        setSelectedPartner(partner)
        setWalletUpdateOpen(true)
        reset() // Reset form fields
    }

    // Submit wallet update
    const onSubmitWalletUpdate = async (data: WalletUpdateFormData) => {
        if (!selectedPartner) return

        setIsSubmitting(true)
        setApiError(null)
        setApiSuccess(null)

        try {
            const response = await axios.patch(`${API_URL}/delivery-partner/${selectedPartner._id}/wallet`, {
                amount: data.amount,
                reason: data.reason,
            })

            if (response.data && response.data.success) {
                // Update partner in state
                const updatedPartners = partners.map((partner) =>
                    partner._id === selectedPartner._id ? { ...partner, wallet: response.data.data.wallet } : partner,
                )
                setPartners(updatedPartners)
                setSelectedPartner(response.data.data)
                setApiSuccess("Wallet updated successfully")
                toast.success("Wallet updated successfully")
                setWalletUpdateOpen(false)
            } else {
                setApiError(response.data.message || "Failed to update wallet")
                toast.error("Failed to update wallet")
            }
        } catch (error) {
            console.error("Error updating wallet:", error)
            setApiError("An error occurred while updating wallet")
            toast.error("Failed to update wallet")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Toggle partner block status
    const toggleBlockPartner = async (partner: Partner) => {
        try {
            const action = partner.isBlocked ? "unblock" : "block"
            const response = await axios.patch(`${API_URL}/delivery-partner/${partner._id}`, {
                isBlocked: !partner.isBlocked,
            })

            if (response.data && response.data.success) {
                // Update partner in state
                const updatedPartners = partners.map((p) => (p._id === partner._id ? { ...p, isBlocked: !p.isBlocked } : p))
                setPartners(updatedPartners)

                // Update selected partner if it's the one being blocked/unblocked
                if (selectedPartner && selectedPartner._id === partner._id) {
                    setSelectedPartner({ ...selectedPartner, isBlocked: !selectedPartner.isBlocked })
                }

                toast.success(`Partner ${action}ed successfully`)
            } else {
                toast.error(`Failed to ${action} partner`)
            }
        } catch (error) {
            console.error(`Error ${partner.isBlocked ? "unblocking" : "blocking"} partner:`, error)
            toast.error(`Failed to ${partner.isBlocked ? "unblock" : "block"} partner`)
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

    // Get rank badge
    const getRankBadge = (rank: string) => {
        switch (rank.toLowerCase()) {
            case "gold":
                return <Badge className="bg-yellow-500 hover:bg-yellow-600">Gold</Badge>
            case "silver":
                return <Badge className="bg-gray-400 hover:bg-gray-500">Silver</Badge>
            case "bronze":
                return <Badge className="bg-amber-700 hover:bg-amber-800">Bronze</Badge>
            case "platinum":
                return <Badge className="bg-purple-500 hover:bg-purple-600">Platinum</Badge>
            default:
                return <Badge>{rank}</Badge>
        }
    }

    // Get vehicle type icon
    const getVehicleIcon = (vehicleType: string) => {
        switch (vehicleType.toLowerCase()) {
            case "bike":
                return <Bike className="h-4 w-4 mr-1" />
            default:
                return <Bike className="h-4 w-4 mr-1" />
        }
    }
    // partner 


    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Bike className="w-8 h-8 text-blue-400" />
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">DELIVERY PARTNER MANAGEMENT</h1>
                    </div>
                </div>
            </header>

            <main className="p-4 sm:p-6 space-y-6">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search partners by name, mobile, city, branch, vehicle type..."
                        className="w-full h-12 pl-10 pr-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Partners Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="bg-gray-800 border-gray-700 text-gray-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-gray-300">Total Partners</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{partners.length}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700 text-gray-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-gray-300">Active Partners</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{partners.filter((partner) => !partner.isBlocked).length}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700 text-gray-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-gray-300">Total Wallet Balance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                ₹{partners.reduce((sum, partner) => sum + partner.wallet, 0).toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Partners List Table */}
                <Card className="bg-gray-800 border border-gray-700 shadow-xl overflow-hidden">
                    <CardHeader className="bg-gray-750 border-b border-gray-700">
                        <CardTitle>Delivery Partners</CardTitle>
                        <CardDescription className="text-gray-400">
                            Manage delivery partners, wallet balances, and access.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <LoadingSpinner />
                        ) : filteredPartners.length === 0 ? (
                            <EmptyState message="No partners found" />
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-750 hover:bg-gray-750">
                                            <TableHead className="text-gray-300">Partner</TableHead>
                                            <TableHead className="text-gray-300">Rank & Rating</TableHead>
                                            <TableHead className="text-gray-300">Location</TableHead>
                                            <TableHead className="text-gray-300">Wallet</TableHead>
                                            <TableHead className="text-gray-300">Joined</TableHead>
                                            <TableHead className="text-gray-300 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredPartners.map((partner) => (
                                            <TableRow key={partner._id} className="border-t border-gray-700 hover:bg-gray-750">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                                            <span className="text-gray-400 text-lg font-medium">
                                                                {partner.firstName ? partner.firstName[0] : partner.mobileNumber[0]}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{`${partner.firstName} ${partner.lastName}`}</div>
                                                            <div className="text-sm text-gray-400">
                                                                <div className="flex items-center">
                                                                    {getVehicleIcon(partner.vehicleType)}
                                                                    {partner.vehicleType}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        {getRankBadge(partner.rank)}
                                                        {partner.isBlocked && <Badge className="ml-2 bg-red-500 hover:bg-red-600">Blocked</Badge>}
                                                        {/* Rating display removed */}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center">
                                                            <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                                                            <span>{partner.city}</span>
                                                        </div>
                                                        <div className="flex items-center text-sm text-gray-400">
                                                            <Briefcase className="w-3 h-3 mr-1" />
                                                            <span>{partner.branch}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">₹{partner.wallet.toLocaleString()}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">{formatDate(partner.createdAt)}</div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => handleViewPartner(partner)}
                                                            title="View Details"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => handleWalletUpdate(partner)}
                                                            title="Update Wallet"
                                                        >
                                                            <Wallet className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant={partner.isBlocked ? "ghost" : "destructive"}
                                                            onClick={() => toggleBlockPartner(partner)}
                                                            title={partner.isBlocked ? "Unblock Partner" : "Block Partner"}
                                                        >
                                                            {partner.isBlocked ? <UserPlus className="h-4 w-4" /> : <UserMinus className="h-4 w-4" />}
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

            {/* Partner Detail Slide-over */}
            {selectedPartner && (
                <Sheet open={partnerDetailOpen} onOpenChange={setPartnerDetailOpen}>
                    <SheetContent className="bg-gray-800 border-l border-gray-700 text-gray-100 w-full sm:max-w-md max-h-screen overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle className="text-gray-100">Partner Details</SheetTitle>
                            <SheetDescription className="text-gray-400">
                                View complete information about this delivery partner.
                            </SheetDescription>
                        </SheetHeader>

                        <div className="mt-6 space-y-6">
                            {/* Partner Avatar & Name */}
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                                    <span className="text-gray-400 text-2xl font-medium">
                                        {selectedPartner.firstName ? selectedPartner.firstName[0] : selectedPartner.mobileNumber[0]}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold">{`${selectedPartner.firstName} ${selectedPartner.lastName}`}</h3>
                                    <div className="flex gap-2 mt-1">
                                        {getRankBadge(selectedPartner.rank)}
                                        {selectedPartner.isBlocked && <Badge className="bg-red-500 hover:bg-red-600">Blocked</Badge>}
                                    </div>
                                </div>
                            </div>

                            {/* Personal Details */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Personal Details</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-sm text-gray-400">Gender</p>
                                        <p className="font-medium capitalize">{selectedPartner.gender}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">T-shirt Size</p>
                                        <p className="font-medium">{selectedPartner.tshirtSize}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">State</p>
                                        <p className="font-medium">{selectedPartner.state}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Onboarding Status</p>
                                        <p className="font-medium capitalize">{selectedPartner.onboardingStatus}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Rating */}

                            {/* Contact Info */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Contact Info</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-sm text-gray-400">Mobile Number</p>
                                        <p className="font-medium">{selectedPartner.mobileNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Vehicle</p>
                                        <p className="font-medium flex items-center">
                                            {getVehicleIcon(selectedPartner.vehicleType)}
                                            {selectedPartner.vehicleType}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Location Details */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Location</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-sm text-gray-400">City</p>
                                        <p className="font-medium">{selectedPartner.city}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Branch</p>
                                        <p className="font-medium">{selectedPartner.branch}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Documents */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Documents</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-sm text-gray-400">Aadhar Number</p>
                                        <p className="font-medium">{selectedPartner.aadharDetails.aadharNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Aadhar Name</p>
                                        <p className="font-medium">{selectedPartner.aadharDetails.aadharName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">PAN Number</p>
                                        <p className="font-medium">{selectedPartner.panDetails.panNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">PAN Name</p>
                                        <p className="font-medium">{selectedPartner.panDetails.panName}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Details */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Payment Details</h4>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-sm text-gray-400">Wallet Balance</p>
                                            <p className="font-medium">₹{selectedPartner.wallet.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400">Incentive</p>
                                            <p className="font-medium">₹{selectedPartner.incentive.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    {selectedPartner.withdrawalDetails && (
                                        <div className="space-y-2">
                                            <p className="text-sm text-gray-400">Withdrawal Method</p>
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-blue-500 capitalize">
                                                    {selectedPartner.withdrawalDetails.selectedPrimaryMethod}
                                                </Badge>
                                            </div>
                                            {selectedPartner.withdrawalDetails.selectedPrimaryMethod === "upi" && (
                                                <div>
                                                    <p className="text-sm text-gray-400">UPI ID</p>
                                                    <code className="px-2 py-1 bg-gray-700 rounded text-gray-300 text-xs">
                                                        {selectedPartner.withdrawalDetails.upiId}
                                                    </code>
                                                </div>
                                            )}
                                            {selectedPartner.withdrawalDetails.selectedPrimaryMethod === "bank" && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <p className="text-sm text-gray-400">Bank Name</p>
                                                        <p className="font-medium">{selectedPartner.withdrawalDetails.bankName}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-400">Account Name</p>
                                                        <p className="font-medium">{selectedPartner.withdrawalDetails.bankAccountName}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-400">Account Number</p>
                                                        <p className="font-medium">{selectedPartner.withdrawalDetails.accountNumber}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-400">IFSC Code</p>
                                                        <p className="font-medium">{selectedPartner.withdrawalDetails.ifscCode}</p>
                                                    </div>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-sm text-gray-400">Onboarding Status</p>
                                                <Badge
                                                    className={`capitalize ${selectedPartner.withdrawalDetails.onboardingStatus === "approved" ? "bg-green-500" : "bg-yellow-500"}`}
                                                >
                                                    {selectedPartner.withdrawalDetails.onboardingStatus}
                                                </Badge>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Activity</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-sm text-gray-400">Joined</p>
                                        <p className="font-medium">{formatDate(selectedPartner.createdAt)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Last Updated</p>
                                        <p className="font-medium">{formatDate(selectedPartner.updatedAt)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <SheetFooter className="mt-6 flex gap-2">
                            <Button variant="destructive" className="w-full" onClick={() => toggleBlockPartner(selectedPartner)}>
                                {selectedPartner.isBlocked ? "Unblock Partner" : "Block Partner"}
                            </Button>
                            <Button
                                className="w-full"
                                onClick={() => {
                                    setPartnerDetailOpen(false)
                                    handleWalletUpdate(selectedPartner)
                                }}
                            >
                                Update Wallet
                            </Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            )}

            {/* Update Wallet Slide-over */}
            {selectedPartner && (
                <Sheet open={walletUpdateOpen} onOpenChange={setWalletUpdateOpen}>
                    <SheetContent className="bg-gray-800 border-l border-gray-700 text-gray-100 w-full sm:max-w-md">
                        <SheetHeader>
                            <SheetTitle className="text-gray-100">Update Wallet Balance</SheetTitle>
                            <SheetDescription className="text-gray-400">
                                Add or remove funds from {`${selectedPartner.firstName} ${selectedPartner.lastName}`}'s wallet.
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
                                    <DollarSign className="h-6 w-6 mr-1" />₹{selectedPartner.wallet.toLocaleString()}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="amount" className="text-sm font-medium text-gray-400">
                                        Amount (+ to add, - to subtract)
                                    </label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            {...register("amount", { valueAsNumber: true })}
                                            type="number"
                                            id="amount"
                                            placeholder="Enter amount"
                                            className="w-full h-12 pl-10 pr-4 rounded-lg bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    {errors.amount && <p className="text-sm text-red-400 mt-1">{errors.amount.message}</p>}
                                </div>

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

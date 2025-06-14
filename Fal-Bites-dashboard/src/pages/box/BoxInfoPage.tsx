import React from 'react';
import { useState, useEffect } from "react"
import { Search, Box, Loader2, CheckCircle, AlertCircle, Calendar, Clock, MapPin, User, Package, Trash2, Phone, Building } from 'lucide-react'
import axios from "axios"

// API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api"

// Box Interface with updated structure to handle null orderId and include assignedBranchId
interface BoxType {
    _id: string
    orderId: {
        location: {
            address: string
            locationLat: number
            locationLng: number
            locationType: string
            flatNumber: string
            buildingName: string
            floor: string
            landmark: string
        }
        _id: string
        userID: {
            _id: string
            mobileNumber: string
            name: string
        }
        finalAmount: number
        totalAmount: number
        subscriptionStatus: string
        gstAmount: number
        deliveryFees: number
        platformFees: number
        bonusUsed: number
        assignedFranchiseId: string
        createdAt: string
        updatedAt: string
    } | null
    deliveryPartnerId: {
        _id: string
        firstName: string
        lastName: string
        mobileNumber: string
        assignedBranchId?: {
            location: {
                locationName: string
            }
            _id: string
            name: string
            cityName: string
            branchName: string
        }
    }
    deliveryDate: string
    deliveryTime: string
    isBoxPicked: boolean
    isBoxCleaned: boolean
    status: string
    createdAt: string
    updatedAt: string
    __v: number
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
    variant?: "default" | "destructive" | "outline" | "ghost" | "success"
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
        success: "bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700",
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
        <Box className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg">{message}</p>
    </div>
)

// Main component
function BoxInfoPage() {
    const [boxes, setBoxes] = useState<BoxType[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedBox, setSelectedBox] = useState<BoxType | null>(null)
    const [boxDetailOpen, setBoxDetailOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [apiError, setApiError] = useState<string | null>(null)
    const [apiSuccess, setApiSuccess] = useState<string | null>(null)


    // Fetch boxes data
    useEffect(() => {
        const fetchBoxes = async () => {
            try {
                setIsLoading(true)

                // In a real implementation, you would fetch from API:
                const response = await axios.get(`${API_URL}/box`)
                if (response.data) {
                    setBoxes(response.data)
                    console.log(response.data)
                } else {
                    setApiError(response.data.message || "Failed to fetch boxes")
                    toast.error("Failed to fetch boxes")
                }
            } catch (error) {
                console.error("Error fetching boxes:", error)
                // setApiError("An error occurred while fetching boxes")
                toast.error("Failed to fetch boxes")
            } finally {
                setIsLoading(false)
            }
        }

        fetchBoxes()
    }, [])

    // Filter boxes based on search query
    const filteredBoxes = boxes.filter((box) => {
        const searchLower = searchQuery.toLowerCase()
        return (
            box._id.includes(searchQuery) ||
            (box.orderId?._id && box.orderId._id.includes(searchQuery)) ||
            (box.orderId?.location?.address && box.orderId.location.address.toLowerCase().includes(searchLower)) ||
            box.deliveryPartnerId.firstName.toLowerCase().includes(searchLower) ||
            box.deliveryPartnerId.lastName.toLowerCase().includes(searchLower) ||
            box.deliveryPartnerId.mobileNumber.includes(searchQuery) ||
            (box.orderId?.userID?.name && box.orderId.userID.name.toLowerCase().includes(searchLower)) ||
            (box.orderId?.userID?.mobileNumber && box.orderId.userID.mobileNumber.includes(searchQuery)) ||
            box.status.toLowerCase().includes(searchLower) ||
            (box.deliveryPartnerId.assignedBranchId?.name &&
                box.deliveryPartnerId.assignedBranchId.name.toLowerCase().includes(searchLower)) ||
            (box.deliveryPartnerId.assignedBranchId?.cityName &&
                box.deliveryPartnerId.assignedBranchId.cityName.toLowerCase().includes(searchLower)) ||
            (box.deliveryPartnerId.assignedBranchId?.branchName &&
                box.deliveryPartnerId.assignedBranchId.branchName.toLowerCase().includes(searchLower))
        )
    })

    // Handle box detail view
    const handleViewBox = (box: BoxType) => {
        setSelectedBox(box)
        setBoxDetailOpen(true)
    }

    // Handle resolve box (delete)
    const handleResolveBox = async (box: BoxType) => {
        try {
            setIsSubmitting(true)
            setApiError(null)
            setApiSuccess(null)

            // In a real implementation, you would delete via API
            const response = await axios.delete(`${API_URL}/box/${box._id}`)

            if (response.data.success) {
                // Filter out the deleted box from the state
                setBoxes((prevBoxes) => prevBoxes.filter((b) => b._id !== box._id))
                setApiSuccess("Box resolved successfully")
                toast.success("Box resolved successfully")
            } else {
                setApiError(response.data.message || "Failed to resolve box")
                toast.error("Failed to resolve box")
            }
        } catch (error) {
            console.error("Error resolving box:", error)
            setApiError("An error occurred while resolving box")
            toast.error("Failed to resolve box")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Format date to readable string
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    // Get delivery partner full name
    const getDeliveryPartnerName = (partner: BoxType["deliveryPartnerId"]) => {
        return `${partner.firstName || ""} ${partner.lastName || ""}`.trim() || "Unknown"
    }


    // Get user name or mobile number (with null safety)
    const getUserDisplayName = (user?: { name?: string; mobileNumber?: string }) => {
        return user?.name || user?.mobileNumber || "Unknown User"
    }

    // Format currency
    const formatCurrency = (amount: number = 0) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount)
    }

    // Get status badge color
    const getStatusBadgeClass = (status: string) => {
        switch (status.toLowerCase()) {
            case "delivered":
                return "bg-green-500 hover:bg-green-600"
            case "pending":
                return "bg-yellow-500 hover:bg-yellow-600"
            case "cancelled":
                return "bg-red-500 hover:bg-red-600"
            default:
                return "bg-blue-500 hover:bg-blue-600"
        }
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Box className="w-8 h-8 text-blue-400" />
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">BOX MANAGEMENT</h1>
                    </div>
                </div>
            </header>

            <main className="p-4 sm:p-6 space-y-6">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search boxes by ID, address, delivery partner, branch, user..."
                        className="w-full h-12 pl-10 pr-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Box Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gray-800 border-gray-700 text-gray-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-gray-300">Total Boxes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{boxes.length}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700 text-gray-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-gray-300">Picked Boxes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{boxes.filter((box) => box.isBoxPicked).length}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700 text-gray-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-gray-300">Cleaned Boxes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{boxes.filter((box) => box.isBoxCleaned).length}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700 text-gray-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-gray-300">Delivered Boxes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{boxes.filter((box) => box.status === "Delivered").length}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Boxes List Table */}
                <Card className="bg-gray-800 border border-gray-700 shadow-xl overflow-hidden">
                    <CardHeader className="bg-gray-750 border-b border-gray-700">
                        <CardTitle>Box Tracking</CardTitle>
                        <CardDescription className="text-gray-400">Track and manage delivery boxes.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <LoadingSpinner />
                        ) : filteredBoxes.length === 0 ? (
                            <EmptyState message="No boxes found" />
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-750 hover:bg-gray-750">
                                            <TableHead className="text-gray-300">Box ID</TableHead>
                                            <TableHead className="text-gray-300 hidden md:table-cell">Delivery Partner</TableHead>
                                            <TableHead className="text-gray-300 hidden lg:table-cell">Branch</TableHead>
                                            <TableHead className="text-gray-300 hidden md:table-cell">User</TableHead>
                                            <TableHead className="text-gray-300 hidden md:table-cell">Delivery Date</TableHead>
                                            <TableHead className="text-gray-300">Status</TableHead>
                                            <TableHead className="text-gray-300 hidden sm:table-cell">Box Status</TableHead>
                                            <TableHead className="text-gray-300 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredBoxes.map((box) => (
                                            <TableRow key={box._id} className="border-t border-gray-700 hover:bg-gray-750">
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="font-medium">{box._id.substring(0, 8)}...</div>
                                                        <div className="text-xs text-gray-400 hidden sm:block">
                                                            Order: {box.orderId?._id ? box.orderId._id.substring(0, 8) + "..." : "N/A"}
                                                        </div>
                                                        <div className="text-xs text-gray-400 md:hidden">
                                                            {getDeliveryPartnerName(box.deliveryPartnerId)}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <div className="flex flex-col">
                                                        <div>{getDeliveryPartnerName(box.deliveryPartnerId)}</div>
                                                        <div className="text-xs text-gray-400">{box.deliveryPartnerId.mobileNumber}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell">
                                                    {box.deliveryPartnerId.assignedBranchId ? (
                                                        <div className="flex flex-col">
                                                            <div>{box.deliveryPartnerId.assignedBranchId.name}</div>
                                                            <div className="text-xs text-gray-400">
                                                                {box.deliveryPartnerId.assignedBranchId.cityName},
                                                                {box.deliveryPartnerId.assignedBranchId.branchName}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">No branch assigned</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <div className="flex flex-col">
                                                        <div>{getUserDisplayName(box.orderId?.userID)}</div>
                                                        <div className="text-xs text-gray-400">{box.orderId?.userID?.mobileNumber || "N/A"}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <div className="flex flex-col">
                                                        <div>{formatDate(box.deliveryDate)}</div>
                                                        <div className="text-xs text-gray-400">{box.deliveryTime}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getStatusBadgeClass(box.status)}>{box.status}</Badge>
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell">
                                                    <div className="flex flex-col gap-1 text-xs">
                                                        <div className="flex items-center">
                                                            <div
                                                                className={`w-3 h-3 rounded-full mr-2 ${box.isBoxPicked ? "bg-green-500" : "bg-gray-500"}`}
                                                            ></div>
                                                            {box.isBoxPicked ? "Picked" : "Not Picked"}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <div
                                                                className={`w-3 h-3 rounded-full mr-2 ${box.isBoxCleaned ? "bg-green-500" : "bg-gray-500"}`}
                                                            ></div>
                                                            {box.isBoxCleaned ? "Cleaned" : "Not Cleaned"}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="sm" variant="ghost" onClick={() => handleViewBox(box)} title="View Details">
                                                            View
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleResolveBox(box)}
                                                            title="Resolve Box"
                                                            disabled={isSubmitting}
                                                        >
                                                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Resolve"}
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

            {/* Box Detail Slide-over */}
            {selectedBox && (
                <Sheet open={boxDetailOpen} onOpenChange={setBoxDetailOpen}>
                    <SheetContent className="bg-gray-800 border-l border-gray-700 text-gray-100 w-full sm:max-w-md max-h-screen overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle className="text-gray-100">Box Details</SheetTitle>
                            <SheetDescription className="text-gray-400">
                                View complete information about this delivery box.
                            </SheetDescription>
                        </SheetHeader>

                        <div className="mt-6 space-y-6">
                            {/* Box Status */}
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Status</h3>
                                    <Badge className={`mt-2 ${getStatusBadgeClass(selectedBox.status)}`}>{selectedBox.status}</Badge>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Amount</h3>
                                    <div className="mt-2 text-xl font-bold">
                                        {formatCurrency(selectedBox.orderId?.finalAmount)}
                                    </div>
                                </div>
                            </div>

                            {/* Box Tracking */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Box Tracking</h3>
                                <div className="p-4 bg-gray-750 rounded-lg border border-gray-700 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div
                                                className={`w-4 h-4 rounded-full mr-2 ${selectedBox.isBoxPicked ? "bg-green-500" : "bg-gray-500"}`}
                                            ></div>
                                            <span>Box Picked</span>
                                        </div>
                                        <Badge className={selectedBox.isBoxPicked ? "bg-green-500" : "bg-gray-600"}>
                                            {selectedBox.isBoxPicked ? "Yes" : "No"}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div
                                                className={`w-4 h-4 rounded-full mr-2 ${selectedBox.isBoxCleaned ? "bg-green-500" : "bg-gray-500"}`}
                                            ></div>
                                            <span>Box Cleaned</span>
                                        </div>
                                        <Badge className={selectedBox.isBoxCleaned ? "bg-green-500" : "bg-gray-600"}>
                                            {selectedBox.isBoxCleaned ? "Yes" : "No"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* User Information - Only show if orderId exists */}
                            {selectedBox.orderId?.userID && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">User Information</h3>
                                    <div className="p-4 bg-gray-750 rounded-lg border border-gray-700 space-y-3">
                                        <div className="flex items-start gap-2">
                                            <User className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm text-gray-400">Name</p>
                                                <p className="font-medium">{selectedBox.orderId.userID.name || "Not provided"}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Phone className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm text-gray-400">Mobile Number</p>
                                                <p className="font-medium">{selectedBox.orderId.userID.mobileNumber}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="w-4 h-4 mt-0.5 flex-shrink-0" /> {/* Spacer for alignment */}
                                            <div>
                                                <p className="text-sm text-gray-400">User ID</p>
                                                <code className="px-2 py-1 bg-gray-700 rounded text-gray-300 text-xs block mt-1 overflow-x-auto">
                                                    {selectedBox.orderId.userID._id}
                                                </code>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Delivery Information */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Delivery Information</h3>
                                <div className="p-4 bg-gray-750 rounded-lg border border-gray-700 space-y-3">
                                    <div className="flex items-start gap-2">
                                        <Calendar className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-gray-400">Delivery Date</p>
                                            <p className="font-medium">{formatDate(selectedBox.deliveryDate)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Clock className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-gray-400">Delivery Time</p>
                                            <p className="font-medium">{selectedBox.deliveryTime}</p>
                                        </div>
                                    </div>
                                    {selectedBox.orderId?.location && (
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm text-gray-400">Delivery Address</p>
                                                <p className="font-medium">{selectedBox.orderId.location.address}</p>
                                                <div className="mt-1 text-xs text-gray-400">
                                                    {selectedBox.orderId.location.flatNumber && (
                                                        <span>Flat: {selectedBox.orderId.location.flatNumber}, </span>
                                                    )}
                                                    {selectedBox.orderId.location.buildingName && (
                                                        <span>Building: {selectedBox.orderId.location.buildingName}, </span>
                                                    )}
                                                    {selectedBox.orderId.location.floor && (
                                                        <span>Floor: {selectedBox.orderId.location.floor}, </span>
                                                    )}
                                                    {selectedBox.orderId.location.landmark && (
                                                        <span>Landmark: {selectedBox.orderId.location.landmark}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Delivery Partner */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Delivery Partner</h3>
                                <div className="p-4 bg-gray-750 rounded-lg border border-gray-700 space-y-3">
                                    <div className="flex items-start gap-2">
                                        <User className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-gray-400">Name</p>
                                            <p className="font-medium">{getDeliveryPartnerName(selectedBox.deliveryPartnerId)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Phone className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-gray-400">Mobile Number</p>
                                            <p className="font-medium">{selectedBox.deliveryPartnerId.mobileNumber}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-4 h-4 mt-0.5 flex-shrink-0" /> {/* Spacer for alignment */}
                                        <div>
                                            <p className="text-sm text-gray-400">Partner ID</p>
                                            <code className="px-2 py-1 bg-gray-700 rounded text-gray-300 text-xs block mt-1 overflow-x-auto">
                                                {selectedBox.deliveryPartnerId._id}
                                            </code>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Branch Information */}
                            {selectedBox.deliveryPartnerId.assignedBranchId && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Branch Information</h3>
                                    <div className="p-4 bg-gray-750 rounded-lg border border-gray-700 space-y-3">
                                        <div className="flex items-start gap-2">
                                            <Building className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm text-gray-400">Branch Name</p>
                                                <p className="font-medium">{selectedBox.deliveryPartnerId.assignedBranchId.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm text-gray-400">Location</p>
                                                <p className="font-medium">
                                                    {selectedBox.deliveryPartnerId.assignedBranchId.cityName},
                                                    {selectedBox.deliveryPartnerId.assignedBranchId.branchName}
                                                </p>
                                            </div>
                                        </div>
                                        {selectedBox.deliveryPartnerId.assignedBranchId.location?.locationName && (
                                            <div className="flex items-start gap-2">
                                                <div className="w-4 h-4 mt-0.5 flex-shrink-0" /> {/* Spacer for alignment */}
                                                <div>
                                                    <p className="text-sm text-gray-400">Address</p>
                                                    <p className="font-medium text-sm">
                                                        {selectedBox.deliveryPartnerId.assignedBranchId.location.locationName}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-start gap-2">
                                            <div className="w-4 h-4 mt-0.5 flex-shrink-0" /> {/* Spacer for alignment */}
                                            <div>
                                                <p className="text-sm text-gray-400">Branch ID</p>
                                                <code className="px-2 py-1 bg-gray-700 rounded text-gray-300 text-xs block mt-1 overflow-x-auto">
                                                    {selectedBox.deliveryPartnerId.assignedBranchId._id}
                                                </code>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Order Details - Only show if orderId exists */}
                            {selectedBox.orderId && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Order Details</h3>
                                    <div className="p-4 bg-gray-750 rounded-lg border border-gray-700 space-y-3">
                                        <div className="flex items-start gap-2">
                                            <Package className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm text-gray-400">Order ID</p>
                                                <code className="px-2 py-1 bg-gray-700 rounded text-gray-300 text-xs block mt-1 overflow-x-auto">
                                                    {selectedBox.orderId._id}
                                                </code>
                                            </div>
                                        </div>
                                        {selectedBox.orderId.subscriptionStatus && (
                                            <div className="flex items-start gap-2">
                                                <div className="w-4 h-4 mt-0.5 flex-shrink-0" /> {/* Spacer for alignment */}
                                                <div>
                                                    <p className="text-sm text-gray-400">Subscription Status</p>
                                                    <Badge className="mt-1 bg-blue-500">{selectedBox.orderId.subscriptionStatus}</Badge>
                                                </div>
                                            </div>
                                        )}
                                        {(selectedBox.orderId.totalAmount !== undefined ||
                                            selectedBox.orderId.finalAmount !== undefined ||
                                            selectedBox.orderId.platformFees !== undefined ||
                                            selectedBox.orderId.deliveryFees !== undefined) && (
                                                <div className="grid grid-cols-2 gap-3 mt-3">
                                                    {selectedBox.orderId.totalAmount !== undefined && (
                                                        <div>
                                                            <p className="text-sm text-gray-400">Total Amount</p>
                                                            <p className="font-medium">{formatCurrency(selectedBox.orderId.totalAmount)}</p>
                                                        </div>
                                                    )}
                                                    {selectedBox.orderId.finalAmount !== undefined && (
                                                        <div>
                                                            <p className="text-sm text-gray-400">Final Amount</p>
                                                            <p className="font-medium">{formatCurrency(selectedBox.orderId.finalAmount)}</p>
                                                        </div>
                                                    )}
                                                    {selectedBox.orderId.platformFees !== undefined && (
                                                        <div>
                                                            <p className="text-sm text-gray-400">Platform Fees</p>
                                                            <p className="font-medium">{formatCurrency(selectedBox.orderId.platformFees)}</p>
                                                        </div>
                                                    )}
                                                    {selectedBox.orderId.deliveryFees !== undefined && (
                                                        <div>
                                                            <p className="text-sm text-gray-400">Delivery Fees</p>
                                                            <p className="font-medium">{formatCurrency(selectedBox.orderId.deliveryFees)}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                </div>
                            )}

                            {/* Timestamps */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Timestamps</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <div>
                                        <p className="text-sm text-gray-400">Created At</p>
                                        <p className="font-medium">{new Date(selectedBox.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Updated At</p>
                                        <p className="font-medium">{new Date(selectedBox.updatedAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <SheetFooter className="mt-6 flex gap-2">
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={() => handleResolveBox(selectedBox)}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Resolve Box
                                    </>
                                )}
                            </Button>
                            <Button variant="outline" className="w-full" onClick={() => setBoxDetailOpen(false)}>
                                Close
                            </Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            )}

            {/* Error/Success Messages */}
            {apiError && (
                <div className="fixed bottom-4 right-4 p-4 bg-red-900/90 border border-red-700 text-red-200 rounded-lg shadow-lg max-w-md z-50 flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{apiError}</span>
                </div>
            )}

            {apiSuccess && (
                <div className="fixed bottom-4 right-4 p-4 bg-green-900/90 border border-green-700 text-green-200 rounded-lg shadow-lg max-w-md z-50 flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{apiSuccess}</span>
                </div>
            )}
        </div>
    )
}

export default BoxInfoPage;
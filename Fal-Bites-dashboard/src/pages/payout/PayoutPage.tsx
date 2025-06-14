"use client"

import type React from "react"

import { useState, useEffect } from "react"
import axios from "axios"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Search, Bike, Wallet, Calendar, Loader2, CheckCircle, AlertCircle, MapPin, ArrowLeft } from "lucide-react"

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
        selectedPrimaryMethod: string
        upiId?: string
        accountNumber?: string
        ifscCode?: string
        bankAccountName?: string
        bankName?: string
    }
    createdAt: string
    updatedAt: string
}

// API Response Interface
interface ApiResponse {
    success: boolean
    data: Partner[]
    message?: string
}

// Add a new interface for payout history items after the ApiResponse interface
interface PayoutHistoryItem {
    monthName: string
    date: string
    amount: number
}

// Payout Schema
const payoutSchema = z.object({
    monthName: z.string().min(1, "Month is required"),
    date: z.string().min(1, "Date is required"),
    amount: z.preprocess(
        (val) => (val === "" ? undefined : Number(val)),
        z.number().min(1, "Amount must be at least 1").max(100000, "Amount cannot exceed 100,000"),
    ),
    deliveryPartnerId: z.string().min(1, "Delivery partner is required"),
})

type PayoutFormData = z.infer<typeof payoutSchema>

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

// Removed unused CardFooter component

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

const Rupee = (props: any) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="M6 3h12" />
        <path d="M6 8h12" />
        <path d="M6 13l8.5 8" />
        <path d="M6 13h3" />
        <path d="M9 13c6.667 0 6.667-10 0-10" />
    </svg>
)

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

export default function PayoutPage() {
    const [partners, setPartners] = useState<Partner[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [apiError, setApiError] = useState<string | null>(null)
    const [apiSuccess, setApiSuccess] = useState<string | null>(null)
    const [payoutHistory, setPayoutHistory] = useState<any[]>([])

    // Add a new state variable for partner payout history after the existing state variables
    const [partnerPayoutHistory, setPartnerPayoutHistory] = useState<PayoutHistoryItem[]>([])
    const [isLoadingPayoutHistory, setIsLoadingPayoutHistory] = useState(false)

    // Form for payout
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useForm<PayoutFormData>({
        resolver: zodResolver(payoutSchema),
        defaultValues: {
            monthName: "",
            date: new Date().toISOString().split("T")[0],
            amount: 100, // Set a default amount
            deliveryPartnerId: "",
        },
    })

    const watchDeliveryPartnerId = watch("deliveryPartnerId")

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

    // Update selected partner when deliveryPartnerId changes
    useEffect(() => {
        if (watchDeliveryPartnerId) {
            const partner = partners.find((p) => p._id === watchDeliveryPartnerId)
            setSelectedPartner(partner || null)
        } else {
            setSelectedPartner(null)
        }
    }, [watchDeliveryPartnerId, partners])

    // Filter partners based on search query
    const filteredPartners = partners.filter((partner) => {
        const searchLower = searchQuery.toLowerCase()
        const fullName = `${partner.firstName} ${partner.lastName}`.toLowerCase()
        return (
            fullName.includes(searchLower) ||
            partner.mobileNumber.includes(searchQuery) ||
            partner.city.toLowerCase().includes(searchLower) ||
            partner.branch.toLowerCase().includes(searchLower)
        )
    })

    // Handle partner selection
    const handleSelectPartner = (partner: Partner) => {
        setValue("deliveryPartnerId", partner._id)
        setSelectedPartner(partner)
    }

    // Submit payout
    const onSubmitPayout = async (data: PayoutFormData) => {
        setIsSubmitting(true)
        setApiError(null)
        setApiSuccess(null)

        try {
            // Ensure amount is a number
            const payload = {
                ...data,
                amount: Number.parseFloat(data.amount.toString()) || 0,
            }

            const response = await axios.post(`${API_URL}/payout`, payload)

            if (response.data && response.data.success) {
                setApiSuccess("Payout added successfully")
                toast.success("Payout added successfully")

                // Add to local payout history for display
                setPayoutHistory([
                    {
                        id: Date.now().toString(),
                        partnerName: `${selectedPartner?.firstName} ${selectedPartner?.lastName}`,
                        monthName: data.monthName,
                        date: data.date,
                        amount: data.amount,
                        timestamp: new Date().toISOString(),
                    },
                    ...payoutHistory,
                ])

                // Reset form
                reset()
                setSelectedPartner(null)
            } else {
                setApiError(response.data.message || "Failed to add payout")
                toast.error("Failed to add payout")
            }
        } catch (error) {
            console.error("Error adding payout:", error)
            setApiError("An error occurred while adding payout")
            toast.error("Failed to add payout")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Add a function to fetch payout history after the onSubmitPayout function
    const fetchPartnerPayoutHistory = async (partnerId: string) => {
        if (!partnerId) return

        setIsLoadingPayoutHistory(true)
        try {
            const response = await axios.get(`${API_URL}/payout/${partnerId}`)
            if (response.data && response.data.success) {
                setPartnerPayoutHistory(response.data.data)
            } else {
                console.error("Failed to fetch payout history:", response.data.message)
            }
        } catch (error) {
            console.error("Error fetching payout history:", error)
        } finally {
            setIsLoadingPayoutHistory(false)
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

    // Get vehicle icon
    const getVehicleIcon = (vehicleType: string) => {
        switch (vehicleType.toLowerCase()) {
            case "bike":
                return <Bike className="h-4 w-4 mr-1" />
            default:
                return <Bike className="h-4 w-4 mr-1" />
        }
    }

    // Get months for dropdown
    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ]

    // Add a useEffect to fetch payout history when a partner is selected
    useEffect(() => {
        if (selectedPartner?._id) {
            fetchPartnerPayoutHistory(selectedPartner._id)
        } else {
            setPartnerPayoutHistory([])
        }
    }, [selectedPartner])

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Wallet className="w-8 h-8 text-blue-400" />
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">DELIVERY PARTNER PAYOUTS</h1>
                    </div>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </div>
            </header>

            <main className="p-4 sm:p-6 space-y-6">
                {apiError && (
                    <div className="p-4 bg-red-900/50 border border-red-700 text-red-200 rounded flex items-start">
                        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{apiError}</span>
                    </div>
                )}

                {apiSuccess && (
                    <div className="p-4 bg-green-900/50 border border-green-700 text-green-200 rounded flex items-start">
                        <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{apiSuccess}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Partner Selection */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="bg-gray-800 border-gray-700 text-gray-100">
                            <CardHeader>
                                <CardTitle>Select Delivery Partner</CardTitle>
                                <CardDescription className="text-gray-400">Choose a delivery partner to add a payout</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            type="text"
                                            placeholder="Search by name, mobile, city..."
                                            className="pl-10"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>

                                    <div className="h-[400px] overflow-y-auto border border-gray-700 rounded-md">
                                        {isLoading ? (
                                            <LoadingSpinner />
                                        ) : filteredPartners.length === 0 ? (
                                            <EmptyState message="No partners found" />
                                        ) : (
                                            <div className="divide-y divide-gray-700">
                                                {filteredPartners.map((partner) => (
                                                    <div
                                                        key={partner._id}
                                                        className={`p-3 hover:bg-gray-750 cursor-pointer transition-colors ${selectedPartner?._id === partner._id ? "bg-gray-700" : ""
                                                            }`}
                                                        onClick={() => handleSelectPartner(partner)}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                                                <span className="text-gray-400 text-lg font-medium">
                                                                    {partner.firstName ? partner.firstName[0] : partner.mobileNumber[0]}
                                                                </span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium truncate">{`${partner.firstName} ${partner.lastName}`}</div>
                                                                <div className="text-sm text-gray-400 flex items-center">{partner.mobileNumber}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-sm text-gray-400">Current Wallet</div>
                                                                <div className="text-2xl font-bold">₹{partner.wallet.toLocaleString()}</div>
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 flex items-center justify-between text-sm">
                                                            <div className="flex items-center text-gray-400">
                                                                <MapPin className="w-3 h-3 mr-1" />
                                                                {partner.city}
                                                            </div>
                                                            <div className="flex items-center">{getRankBadge(partner.rank)}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Payout Form and Selected Partner */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Selected Partner Card */}
                        {selectedPartner && (
                            <Card className="bg-gray-800 border-gray-700 text-gray-100">
                                <CardHeader className="pb-3">
                                    <CardTitle>Selected Partner</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                                            <span className="text-gray-400 text-2xl font-medium">
                                                {selectedPartner.firstName ? selectedPartner.firstName[0] : selectedPartner.mobileNumber[0]}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-semibold">{`${selectedPartner.firstName} ${selectedPartner.lastName}`}</h3>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {getRankBadge(selectedPartner.rank)}
                                                <Badge className="bg-gray-600">{selectedPartner.mobileNumber}</Badge>
                                                <div className="flex items-center text-gray-400 text-sm">
                                                    {getVehicleIcon(selectedPartner.vehicleType)}
                                                    {selectedPartner.vehicleType}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-gray-400">Current Wallet</div>
                                            <div className="text-2xl font-bold">₹{selectedPartner.wallet.toLocaleString()}</div>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-400">City:</span> {selectedPartner.city}
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Branch:</span> {selectedPartner.branch}
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Joined:</span> {formatDate(selectedPartner.createdAt)}
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Status:</span>{" "}
                                            <span className="capitalize">{selectedPartner.onboardingStatus}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Payout Form */}
                        <Card className="bg-gray-800 border-gray-700 text-gray-100">
                            <CardHeader>
                                <CardTitle>Add Payout</CardTitle>
                                <CardDescription className="text-gray-400">
                                    Enter payout details for the selected delivery partner
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit(onSubmitPayout)} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label htmlFor="monthName" className="text-sm font-medium text-gray-400">
                                                Month
                                            </label>
                                            <select
                                                {...register("monthName")}
                                                id="monthName"
                                                className="w-full h-10 rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Select Month</option>
                                                {months.map((month) => (
                                                    <option key={month} value={month}>
                                                        {month}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.monthName && <p className="text-sm text-red-400">{errors.monthName.message}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="date" className="text-sm font-medium text-gray-400">
                                                Date
                                            </label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <Input
                                                    {...register("date")}
                                                    type="date"
                                                    id="date"
                                                    className="pl-10"
                                                    defaultValue={new Date().toISOString().split("T")[0]}
                                                />
                                            </div>
                                            {errors.date && <p className="text-sm text-red-400">{errors.date.message}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="amount" className="text-sm font-medium text-gray-400">
                                            Amount
                                        </label>
                                        <div className="relative">
                                            <Rupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <Input
                                                {...register("amount")}
                                                type="number"
                                                id="amount"
                                                placeholder="Enter amount"
                                                defaultValue={100}
                                                className="pl-10"
                                            />
                                        </div>
                                        {errors.amount && <p className="text-sm text-red-400">{errors.amount.message}</p>}
                                    </div>

                                    <input type="hidden" {...register("deliveryPartnerId")} />
                                    {errors.deliveryPartnerId && (
                                        <p className="text-sm text-red-400">{errors.deliveryPartnerId.message}</p>
                                    )}

                                    <Button type="submit" className="w-full mt-4" disabled={isSubmitting || !selectedPartner}>
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            "Add Payout"
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Combined Payout History */}
                        <Card className="bg-gray-800 border-gray-700 text-gray-100">
                            <CardHeader>
                                <CardTitle>Payout History</CardTitle>
                                <CardDescription className="text-gray-400">
                                    {selectedPartner
                                        ? `Payout history for ${selectedPartner.firstName} ${selectedPartner.lastName}`
                                        : "Recently added payouts in this session"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {/* Recent Payouts Section */}
                                    {payoutHistory.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-300 mb-3">Recent Payouts</h4>
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-gray-750 hover:bg-gray-750">
                                                            <TableHead className="text-gray-300">Partner</TableHead>
                                                            <TableHead className="text-gray-300">Month</TableHead>
                                                            <TableHead className="text-gray-300">Date</TableHead>
                                                            <TableHead className="text-gray-300 text-right">Amount</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {payoutHistory.map((payout) => (
                                                            <TableRow key={payout.id} className="border-t border-gray-700 hover:bg-gray-750">
                                                                <TableCell>{payout.partnerName}</TableCell>
                                                                <TableCell>{payout.monthName}</TableCell>
                                                                <TableCell>{formatDate(payout.date)}</TableCell>
                                                                <TableCell className="text-right font-medium">
                                                                    ₹{payout.amount.toLocaleString()}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Partner Payout History Section */}
                                    {selectedPartner && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-300 mb-3">Partner History</h4>
                                            {isLoadingPayoutHistory ? (
                                                <div className="flex justify-center py-6">
                                                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                                                </div>
                                            ) : partnerPayoutHistory.length === 0 ? (
                                                <div className="text-center py-6 text-gray-400">
                                                    <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                    <p>No previous payouts found</p>
                                                </div>
                                            ) : (
                                                <div className="overflow-x-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow className="bg-gray-750 hover:bg-gray-750">
                                                                <TableHead className="text-gray-300">Month</TableHead>
                                                                <TableHead className="text-gray-300">Date</TableHead>
                                                                <TableHead className="text-gray-300 text-right">Amount</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {partnerPayoutHistory.map((payout, index) => (
                                                                <TableRow key={index} className="border-t border-gray-700 hover:bg-gray-750">
                                                                    <TableCell>{payout.monthName}</TableCell>
                                                                    <TableCell>{formatDate(payout.date)}</TableCell>
                                                                    <TableCell className="text-right font-medium">
                                                                        ₹{payout.amount.toLocaleString()}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Empty State */}
                                    {payoutHistory.length === 0 && !selectedPartner && (
                                        <div className="text-center py-6 text-gray-400">
                                            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                            <p>No payouts added yet</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}

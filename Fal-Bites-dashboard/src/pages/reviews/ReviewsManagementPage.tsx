"use client"

import type React from "react"

import { useState, useEffect } from "react"
import axios from "axios"
import { Search, Star, MessageSquare, Loader2, CheckCircle, AlertCircle, Calendar, ImageIcon } from 'lucide-react'

// API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api"

// Updated Review Interface with nested objects
interface Review {
    _id: string
    description: string
    rating: number
    image: string
    date: string
    deliveryPartnerId: {
        _id: string
        firstName: string
        lastName: string
        mobileNumber: string
        vehicleType: string
        city: string
        branch: string
    } | null
    subscriptionId: {
        _id: string
        title: string
        imageUrl: string[]
    }
    userId: {
        _id: string
        mobileNumber: string
        name: string
    } | null
    franchiseId: {
        location: {
            locationName: string
            lat: number
            lang: number
        }
        _id: string
        name: string
        cityName: string
        branchName: string
        assignedManager?: {
            _id: string
            mobileNumber: string
            name: string
        }
    } | null
    __v: number
    resolved?: boolean
}

// API Response Interface
interface ApiResponse {
    success: boolean
    reviews: Review[]
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
        <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg">{message}</p>
    </div>
)

// Star Rating Component
const StarRating = ({ rating }: { rating: number }) => {
    return (
        <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    className={`w-4 h-4 ${i < rating ? "fill-primary text-primary" : "fill-muted stroke-muted-foreground"}`}
                />
            ))}
        </div>
    )
}

export default function ReviewsManagementPage() {
    const [reviews, setReviews] = useState<Review[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedReview, setSelectedReview] = useState<Review | null>(null)
    const [reviewDetailOpen, setReviewDetailOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [apiError, setApiError] = useState<string | null>(null)
    const [apiSuccess, setApiSuccess] = useState<string | null>(null)

    // Helper function to safely check if a property exists
    const safeGet = (obj: any, path: string, fallback: any = null) => {
        try {
            const keys = path.split(".")
            let result = obj
            for (const key of keys) {
                if (result === null || result === undefined) return fallback
                result = result[key]
            }
            return result === undefined ? fallback : result
        } catch (error) {
            return fallback
        }
    }

    // Get user display name
    const getUserDisplayName = (user: Review["userId"]) => {
        if (!user) return "Unknown User"
        return user.name || user.mobileNumber || "Unknown User"
    }

    // Fetch reviews data
    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setIsLoading(true)
                const response = await axios.get<ApiResponse>(`${API_URL}/review`)
                if (response.data && response.data.success) {
                    // Normalize the data to ensure it matches our interface
                    const normalizedReviews = response.data.reviews.map((review) => ({
                        ...review,
                        userId: review.userId || { _id: "", mobileNumber: "", name: "" },
                        deliveryPartnerId: review.deliveryPartnerId || {
                            _id: "",
                            firstName: "",
                            lastName: "",
                            mobileNumber: "",
                            vehicleType: "",
                            city: "",
                            branch: "",
                        },
                        franchiseId: review.franchiseId || {
                            _id: "",
                            name: "",
                            cityName: "",
                            branchName: "",
                            location: { locationName: "", lat: 0, lang: 0 },
                            assignedManager: undefined,
                        },
                    }))
                    setReviews(normalizedReviews)
                } else {
                    setApiError(response.data.message || "Failed to fetch reviews")
                    toast.error("Failed to fetch reviews")
                }
            } catch (error) {
                console.error("Error fetching reviews:", error)
                setApiError("An error occurred while fetching reviews")
                toast.error("Failed to fetch reviews")
            } finally {
                setIsLoading(false)
            }
        }

        fetchReviews()
    }, [])

    // Filter reviews based on search query
    const filteredReviews = reviews.filter((review) => {
        const searchLower = searchQuery.toLowerCase()
        return (
            review.description.toLowerCase().includes(searchLower) ||
            review._id.includes(searchQuery) ||
            safeGet(review, "userId.name", "").toLowerCase().includes(searchLower) ||
            safeGet(review, "userId.mobileNumber", "").includes(searchQuery) ||
            safeGet(review, "deliveryPartnerId.firstName", "").toLowerCase().includes(searchLower) ||
            safeGet(review, "deliveryPartnerId.lastName", "").toLowerCase().includes(searchLower) ||
            safeGet(review, "deliveryPartnerId.mobileNumber", "").includes(searchQuery)
        )
    })

    // Handle review detail view
    const handleViewReview = (review: Review) => {
        setSelectedReview(review)
        setReviewDetailOpen(true)
    }

    // Handle resolve review
    const handleResolveReview = async (review: Review) => {
        try {
            setIsSubmitting(true)
            setApiError(null)
            setApiSuccess(null)

            // Delete the review using a DELETE request
            const response = await axios.delete(`${API_URL}/review/${review._id}`)

            if (response.data && response.data.success) {
                // Remove the review from state
                const updatedReviews = reviews.filter((r) => r._id !== review._id)
                setReviews(updatedReviews)

                // Clear selected review if it's the one being deleted
                if (selectedReview && selectedReview._id === review._id) {
                    setSelectedReview(null)
                    setReviewDetailOpen(false)
                }

                setApiSuccess("Review deleted successfully")
                toast.success("Review deleted successfully")
            } else {
                setApiError(response.data.message || "Failed to delete review")
                toast.error("Failed to delete review")
            }
        } catch (error) {
            console.error("Error deleting review:", error)
            setApiError("An error occurred while deleting review")
            toast.error("Failed to delete review")
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

    // Check if image is a valid URL
    const isValidImageUrl = (url: string) => {
        return url && url !== "No-Image-Selected" && (url.startsWith("http://") || url.startsWith("https://"))
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <MessageSquare className="w-8 h-8 text-blue-400" />
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">CUSTOMER REVIEWS MANAGEMENT</h1>
                    </div>
                </div>
            </header>

            <main className="p-4 sm:p-6 space-y-6">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search reviews by description, user name, phone number..."
                        className="w-full h-12 pl-10 pr-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Reviews Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="bg-gray-800 border-gray-700 text-gray-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-gray-300">Total Reviews</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{reviews.length}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700 text-gray-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-gray-300">Resolved Reviews</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{reviews.filter((review) => review.resolved).length}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700 text-gray-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-gray-300">Average Rating</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold flex items-center">
                                {reviews.length > 0
                                    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
                                    : "0.0"}
                                <Star className="w-6 h-6 ml-2 fill-primary text-primary" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Reviews List Table */}
                <Card className="bg-gray-800 border border-gray-700 shadow-xl overflow-hidden">
                    <CardHeader className="bg-gray-750 border-b border-gray-700">
                        <CardTitle>Customer Reviews</CardTitle>
                        <CardDescription className="text-gray-400">Manage customer reviews and feedback.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <LoadingSpinner />
                        ) : filteredReviews.length === 0 ? (
                            <EmptyState message="No reviews found" />
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-750 hover:bg-gray-750">
                                            <TableHead className="text-gray-300">Review</TableHead>
                                            <TableHead className="text-gray-300">Rating</TableHead>
                                            <TableHead className="text-gray-300">Date</TableHead>
                                            <TableHead className="text-gray-300">Image</TableHead>
                                            <TableHead className="text-gray-300">Status</TableHead>
                                            <TableHead className="text-gray-300 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredReviews.map((review) => (
                                            <TableRow key={review._id} className="border-t border-gray-700 hover:bg-gray-750">
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="font-medium truncate max-w-[250px]">{review.description}</div>
                                                        <div className="text-xs text-gray-400">
                                                            User: {review.userId ? getUserDisplayName(review.userId) : "Unknown User"}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            Plan: {safeGet(review, "subscriptionId.title", "Unknown Plan")}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <StarRating rating={review.rating} />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">{formatDate(review.date)}</div>
                                                </TableCell>
                                                <TableCell>
                                                    {isValidImageUrl(review.image) ? (
                                                        <div className="relative w-10 h-10 rounded-md overflow-hidden bg-gray-700">
                                                            <img
                                                                src={review.image || "/placeholder.svg"}
                                                                alt="Review"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-md bg-gray-700 flex items-center justify-center">
                                                            <ImageIcon className="w-5 h-5 text-gray-400" />
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {review.resolved ? (
                                                        <Badge className="bg-green-500 hover:bg-green-600">Resolved</Badge>
                                                    ) : (
                                                        <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleViewReview(review)}
                                                            title="View Details"
                                                        >
                                                            View
                                                        </Button>
                                                        {!review.resolved && (
                                                            <Button
                                                                size="sm"
                                                                variant="success"
                                                                onClick={() => handleResolveReview(review)}
                                                                title="Resolve Review"
                                                                disabled={isSubmitting}
                                                            >
                                                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Resolve"}
                                                            </Button>
                                                        )}
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

            {/* Review Detail Slide-over */}
            {selectedReview && (
                <Sheet open={reviewDetailOpen} onOpenChange={setReviewDetailOpen}>
                    <SheetContent className="bg-gray-800 border-l border-gray-700 text-gray-100 w-full sm:max-w-md max-h-screen overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle className="text-gray-100">Review Details</SheetTitle>
                            <SheetDescription className="text-gray-400">
                                View complete information about this customer review.
                            </SheetDescription>
                        </SheetHeader>

                        <div className="mt-6 space-y-6">
                            {/* Review Status */}
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Status</h3>
                                    {selectedReview.resolved ? (
                                        <Badge className="mt-2 bg-green-500 hover:bg-green-600">Resolved</Badge>
                                    ) : (
                                        <Badge className="mt-2 bg-yellow-500 hover:bg-yellow-600">Pending</Badge>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Rating</h3>
                                    <div className="mt-2">
                                        <StarRating rating={selectedReview.rating} />
                                    </div>
                                </div>
                            </div>

                            {/* Review Content */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Review</h3>
                                <div className="p-4 bg-gray-750 rounded-lg border border-gray-700">
                                    <p className="text-gray-200">{selectedReview.description}</p>
                                </div>
                            </div>

                            {/* Review Image */}
                            {isValidImageUrl(selectedReview.image) && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Image</h3>
                                    <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-750 border border-gray-700">
                                        <img
                                            src={selectedReview.image || "/placeholder.svg"}
                                            alt="Review"
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                                ; (e.target as HTMLImageElement).src = "/placeholder.svg?height=200&width=300"
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* User Information */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">User Information</h3>
                                <div className="p-4 bg-gray-750 rounded-lg border border-gray-700 space-y-2">
                                    {selectedReview.userId ? (
                                        <>
                                            <div>
                                                <p className="text-sm text-gray-400">Name</p>
                                                <p className="font-medium">{selectedReview.userId.name || "Not provided"}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-400">Mobile Number</p>
                                                <p className="font-medium">{selectedReview.userId.mobileNumber || "Not provided"}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-400">User ID</p>
                                                <code className="px-2 py-1 bg-gray-700 rounded text-gray-300 text-xs block mt-1 overflow-x-auto">
                                                    {selectedReview.userId._id || "Not available"}
                                                </code>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-gray-400">No user information available</p>
                                    )}
                                </div>
                            </div>

                            {/* Delivery Partner Information */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Delivery Partner</h3>
                                <div className="p-4 bg-gray-750 rounded-lg border border-gray-700 space-y-2">
                                    {selectedReview.deliveryPartnerId ? (
                                        <>
                                            <div>
                                                <p className="text-sm text-gray-400">Name</p>
                                                <p className="font-medium">
                                                    {selectedReview.deliveryPartnerId.firstName || ""}{" "}
                                                    {selectedReview.deliveryPartnerId.lastName || ""}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-400">Mobile Number</p>
                                                <p className="font-medium">{selectedReview.deliveryPartnerId.mobileNumber || "Not provided"}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-400">Vehicle Type</p>
                                                <p className="font-medium">{selectedReview.deliveryPartnerId.vehicleType || "Not provided"}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-400">Location</p>
                                                <p className="font-medium">
                                                    {selectedReview.deliveryPartnerId.city || "Unknown"} (
                                                    {selectedReview.deliveryPartnerId.branch || "Unknown"})
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-400">Partner ID</p>
                                                <code className="px-2 py-1 bg-gray-700 rounded text-gray-300 text-xs block mt-1 overflow-x-auto">
                                                    {selectedReview.deliveryPartnerId._id || "Not available"}
                                                </code>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-gray-400">No delivery partner information available</p>
                                    )}
                                </div>
                            </div>

                            {/* Subscription Information */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Subscription</h3>
                                <div className="p-4 bg-gray-750 rounded-lg border border-gray-700 space-y-2">
                                    <div>
                                        <p className="text-sm text-gray-400">Plan</p>
                                        <p className="font-medium">{selectedReview.subscriptionId.title}</p>
                                    </div>
                                    {selectedReview.subscriptionId.imageUrl && selectedReview.subscriptionId.imageUrl.length > 0 && (
                                        <div>
                                            <p className="text-sm text-gray-400">Plan Image</p>
                                            <div className="mt-2 w-full h-24 rounded overflow-hidden">
                                                <img
                                                    src={selectedReview.subscriptionId.imageUrl[0] || "/placeholder.svg"}
                                                    alt="Subscription"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        ; (e.target as HTMLImageElement).src = "/placeholder.svg?height=100&width=200"
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm text-gray-400">Subscription ID</p>
                                        <code className="px-2 py-1 bg-gray-700 rounded text-gray-300 text-xs block mt-1 overflow-x-auto">
                                            {selectedReview.subscriptionId._id}
                                        </code>
                                    </div>
                                </div>
                            </div>

                            {/* Franchise Information */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Franchise</h3>
                                <div className="p-4 bg-gray-750 rounded-lg border border-gray-700 space-y-2">
                                    {selectedReview.franchiseId ? (
                                        <>
                                            <div>
                                                <p className="text-sm text-gray-400">Name</p>
                                                <p className="font-medium">{selectedReview.franchiseId.name || "Not provided"}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-400">Location</p>
                                                <p className="font-medium">
                                                    {selectedReview.franchiseId.cityName || "Unknown"} (
                                                    {selectedReview.franchiseId.branchName || "Unknown"})
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-400">Address</p>
                                                <p className="font-medium text-sm">
                                                    {safeGet(selectedReview, "franchiseId.location.locationName", "Not provided")}
                                                </p>
                                            </div>
                                            {selectedReview.franchiseId.assignedManager && (
                                                <>
                                                    <div>
                                                        <p className="text-sm text-gray-400">Assigned Manager</p>
                                                        <p className="font-medium">{selectedReview.franchiseId.assignedManager.name || "Not provided"}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-400">Manager Mobile</p>
                                                        <p className="font-medium">{selectedReview.franchiseId.assignedManager.mobileNumber || "Not provided"}</p>
                                                    </div>
                                                </>
                                            )}
                                            <div>
                                                <p className="text-sm text-gray-400">Franchise ID</p>
                                                <code className="px-2 py-1 bg-gray-700 rounded text-gray-300 text-xs block mt-1 overflow-x-auto">
                                                    {selectedReview.franchiseId._id || "Not available"}
                                                </code>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-gray-400">No franchise information available</p>
                                    )}
                                </div>
                            </div>

                            {/* Date */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Date</h3>
                                <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                    <p className="font-medium">{formatDate(selectedReview.date)}</p>
                                </div>
                            </div>
                        </div>

                        <SheetFooter className="mt-6 flex gap-2">
                            {!selectedReview.resolved && (
                                <Button
                                    variant="success"
                                    className="w-full"
                                    onClick={() => handleResolveReview(selectedReview)}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        "Resolve Review"
                                    )}
                                </Button>
                            )}
                            <Button variant="outline" className="w-full" onClick={() => setReviewDetailOpen(false)}>
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
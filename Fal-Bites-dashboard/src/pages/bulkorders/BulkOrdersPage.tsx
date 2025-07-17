"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import axios from "axios"
import {
    Package,
    Plus,
    Trash2,
    X,
    Menu,
    Loader2,
    Search,
    CalendarDays,
    MapPin,
    CheckCircle,
    Clock,
    XCircle,
} from "lucide-react"

// API Configuration
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
})

// Types and Interfaces
interface BulkDelivery {
    _id: string
    name: string
    address: string
    phoneNumber: string
    deliveryDate: string // ISO 8601 string
    imageUrl: string
    status: "pending" | "delivered" | "cancelled"
    createdAt?: string
    updatedAt?: string
}

interface ApiResponse<T> {
    success: boolean
    message?: string
    data: T[] | T
    error?: string
}

// API Functions for Bulk Deliveries
const createBulkDelivery = async (formData: FormData) => {
    try {
        const response = await api.post<ApiResponse<BulkDelivery>>("/bulk-delivery", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        })
        if (!response.data.success) {
            throw new Error(response.data.error || "Failed to create bulk delivery")
        }
        return response.data.data as BulkDelivery
    } catch (error) {
        console.error("Failed to create bulk delivery:", error)
        throw error
    }
}

const getBulkDeliveries = async () => {
    try {
        const response = await api.get<ApiResponse<BulkDelivery>>("/bulk-delivery")
        if (!response.data.success) {
            throw new Error(response.data.error || "Failed to fetch bulk deliveries")
        }
        return (response.data.data as BulkDelivery[]) || []
    } catch (error) {
        console.error("Failed to fetch bulk deliveries:", error)
        return []
    }
}

const updateBulkDeliveryStatus = async (id: string, status: BulkDelivery["status"]) => {
    try {
        const response = await api.patch<ApiResponse<BulkDelivery>>(
            `/bulk-delivery/status/${id}`,
            { status },
            {
                headers: { "Content-Type": "application/json" },
            },
        )
        if (!response.data.success) {
            throw new Error(response.data.error || "Failed to update bulk delivery status")
        }
        return response.data.data as BulkDelivery
    } catch (error) {
        console.error("Failed to update bulk delivery status:", error)
        throw error
    }
}

const deleteBulkDelivery = async (id: string) => {
    try {
        const response = await api.delete<ApiResponse<any>>(`/bulk-delivery/${id}`)
        if (!response.data.success) {
            throw new Error(response.data.error || "Failed to delete bulk delivery")
        }
    } catch (error) {
        console.error("Failed to delete bulk delivery:", error)
        throw error
    }
}

// Zod Schema for Bulk Delivery Form
const bulkDeliverySchema = z.object({
    name: z.string().min(1, "Name is required"),
    address: z.string().min(1, "Address is required"),
    phoneNumber: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number too long"),
    deliveryDate: z.string().min(1, "Delivery date is required"),
})

type BulkDeliveryFormData = z.infer<typeof bulkDeliverySchema>

// Loading Spinner Component
const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
)

// Empty State Component
const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center p-8 text-gray-400">
        <Package className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg">{message}</p>
    </div>
)

// Bulk Delivery Form Modal
const BulkDeliveryFormModal = ({
    isOpen,
    onClose,
    onSuccess,
}: {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}) => {
    const [isLoading, setIsLoading] = useState(false)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string>("")
    const fileInputRef = useRef<HTMLInputElement>(null)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<BulkDeliveryFormData>({
        resolver: zodResolver(bulkDeliverySchema),
    })

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            setImageFile(file)
            const previewUrl = URL.createObjectURL(file)
            setImagePreview(previewUrl)
        }
    }

    const removeImage = () => {
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview)
        }
        setImageFile(null)
        setImagePreview("")
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const onSubmit = async (data: BulkDeliveryFormData) => {
        setIsLoading(true)
        try {
            if (!imageFile) {
                throw new Error("Image is required")
            }

            const formData = new FormData()
            formData.append("name", data.name)
            formData.append("address", data.address)
            formData.append("phoneNumber", data.phoneNumber)

            // Construct Date object from YYYY-MM-DD string at local midnight
            const dateOnly = data.deliveryDate // "YYYY-MM-DD"
            const localDate = new Date(`${dateOnly}T00:00:00`) // Creates Date object at local midnight

            // Calculate local timezone offset
            const offset = localDate.getTimezoneOffset() // Offset in minutes
            const sign = offset > 0 ? "-" : "+"
            const absOffset = Math.abs(offset)
            const hours = Math.floor(absOffset / 60)
            const minutes = absOffset % 60
            const offsetString = `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`

            // Format to YYYY-MM-DDTHH:mm:ss.SSSZ (ISO 8601) and then append offset
            // We'll use 00:00:00 as the time component since only date is selected
            const isoStringWithoutZ = localDate.toISOString().slice(0, -1)
            formData.append("deliveryDate", `${isoStringWithoutZ}${offsetString}`)

            formData.append("image", imageFile)

            await createBulkDelivery(formData)
            onSuccess()
            reset()
            removeImage()
            onClose()
        } catch (error: any) {
            console.error("Failed to create bulk delivery:", error)
            alert(`Error: ${error.message || "Failed to create bulk delivery"}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        reset()
        removeImage()
        onClose()
    }

    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview)
            }
        }
    }, [imagePreview])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg w-full max-w-md border border-gray-800">
                <div className="px-6 py-4 border-b border-gray-800">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-100">Create New Bulk Delivery</h2>
                        <button onClick={handleClose} className="text-gray-400 hover:text-gray-200 transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                        <input
                            {...register("name")}
                            className="w-full h-12 px-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter recipient name"
                        />
                        {errors.name && <p className="mt-2 text-sm text-red-400">{errors.name.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                        <textarea
                            {...register("address")}
                            className="w-full h-24 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            placeholder="Enter delivery address"
                        />
                        {errors.address && <p className="mt-2 text-sm text-red-400">{errors.address.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                        <input
                            type="tel"
                            {...register("phoneNumber")}
                            className="w-full h-12 px-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., 9876543210"
                        />
                        {errors.phoneNumber && <p className="mt-2 text-sm text-red-400">{errors.phoneNumber.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Delivery Date</label>
                        <input
                            type="date" // Changed from datetime-local to date
                            {...register("deliveryDate")}
                            className="w-full h-12 px-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {errors.deliveryDate && <p className="mt-2 text-sm text-red-400">{errors.deliveryDate.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Image</label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-gray-900 hover:file:bg-blue-600"
                        />
                        {imagePreview && (
                            <div className="mt-4 relative inline-block">
                                <img
                                    src={imagePreview || "/placeholder.svg"}
                                    alt="Preview"
                                    className="h-24 w-24 object-cover rounded-lg"
                                />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                        {!imageFile && <p className="mt-2 text-sm text-red-400">Image is required</p>}
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !imageFile}
                            className="px-4 py-2 rounded-lg bg-blue-500 text-gray-900 font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Delivery"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function BulkOrderPage() {
    // Renamed from OrdersPage
    const [isLoading, setIsLoading] = useState(false)
    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const [showFormModal, setShowFormModal] = useState(false)
    const [bulkDeliveries, setBulkDeliveries] = useState<BulkDelivery[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [showMobileMenu, setShowMobileMenu] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchBulkDeliveries = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const data = await getBulkDeliveries()
            setBulkDeliveries(data)
        } catch (err) {
            console.error("Failed to fetch bulk deliveries:", err)
            setError("Failed to load bulk deliveries. Please refresh the page.")
        } finally {
            setIsLoading(false)
            setIsInitialLoading(false)
        }
    }

    useEffect(() => {
        fetchBulkDeliveries()
    }, [])

    const handleStatusChange = async (id: string, newStatus: BulkDelivery["status"]) => {
        setIsLoading(true)
        setError(null)
        try {
            await updateBulkDeliveryStatus(id, newStatus)
            await fetchBulkDeliveries() // Refresh the list
        } catch (err) {
            console.error("Failed to update status:", err)
            setError("Failed to update status. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this bulk delivery entry?")) {
            setIsLoading(true)
            setError(null)
            try {
                await deleteBulkDelivery(id)
                await fetchBulkDeliveries() // Refresh the list
            } catch (err) {
                console.error("Failed to delete bulk delivery:", err)
                setError("Failed to delete bulk delivery. Please try again.")
            } finally {
                setIsLoading(false)
            }
        }
    }

    const filteredDeliveries = bulkDeliveries.filter(
        (delivery) =>
            delivery.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            delivery.phoneNumber.includes(searchQuery) ||
            delivery.address.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    const getStatusClasses = (status: BulkDelivery["status"]) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-800"
            case "delivered":
                return "bg-green-100 text-green-800"
            case "cancelled":
                return "bg-red-100 text-red-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    const getStatusIcon = (status: BulkDelivery["status"]) => {
        switch (status) {
            case "pending":
                return <Clock className="w-4 h-4 mr-1" />
            case "delivered":
                return <CheckCircle className="w-4 h-4 mr-1" />
            case "cancelled":
                return <XCircle className="w-4 h-4 mr-1" />
            default:
                return null
        }
    }

    const formatDeliveryDate = (isoString: string) => {
        try {
            const date = new Date(isoString)
            // Format to show only date, without time
            return date.toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
            })
        } catch (e) {
            return "Invalid Date"
        }
    }

    if (isInitialLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <LoadingSpinner />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            {/* Error Banner */}
            {error && (
                <div className="bg-red-600 text-white px-4 py-2 text-center">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-4 text-white hover:text-gray-200">
                        <X className="w-4 h-4 inline" />
                    </button>
                </div>
            )}

            {/* Header */}
            <header className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Package className="w-8 h-8 text-blue-400" />
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Bulk Deliveries</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setShowFormModal(true)}
                            className="hidden sm:inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-blue-400 hover:bg-blue-500 transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Delivery
                        </button>
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="sm:hidden p-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                {/* Mobile Menu */}
                {showMobileMenu && (
                    <div className="sm:hidden mt-4 space-y-4">
                        <button
                            onClick={() => {
                                setShowFormModal(true)
                                setShowMobileMenu(false)
                            }}
                            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-blue-400 hover:bg-blue-500 transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Delivery
                        </button>
                    </div>
                )}
            </header>

            <main className="p-4 sm:p-6 space-y-6">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, phone, or address..."
                        className="w-full h-12 pl-10 pr-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Deliveries List/Grid */}
                <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700">
                    {isLoading ? (
                        <LoadingSpinner />
                    ) : filteredDeliveries.length === 0 ? (
                        <EmptyState message="No bulk deliveries found" />
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden sm:block">
                                <table className="min-w-full divide-y divide-gray-700">
                                    <thead className="bg-gray-900">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Recipient
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Address
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Phone
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Delivery Date
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                                        {filteredDeliveries.map((delivery) => (
                                            <tr key={delivery._id} className="hover:bg-gray-750">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <img
                                                            src={delivery.imageUrl || "/placeholder.svg"}
                                                            alt={delivery.name}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement
                                                                target.src = "/placeholder.svg"
                                                            }}
                                                        />
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-100">{delivery.name}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-300 max-w-xs truncate">{delivery.address}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-300">{delivery.phoneNumber}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-300">{formatDeliveryDate(delivery.deliveryDate)}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <select
                                                        value={delivery.status}
                                                        onChange={(e) => handleStatusChange(delivery._id, e.target.value as BulkDelivery["status"])}
                                                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClasses(delivery.status)} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                        disabled={isLoading}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="delivered">Delivered</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        className="text-red-400 hover:text-red-300 transition-colors"
                                                        onClick={() => handleDelete(delivery._id)}
                                                        disabled={isLoading}
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="sm:hidden divide-y divide-gray-700">
                                {filteredDeliveries.map((delivery) => (
                                    <div key={delivery._id} className="p-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <img
                                                    src={delivery.imageUrl || "/placeholder.svg"}
                                                    alt={delivery.name}
                                                    className="w-12 h-12 rounded-full object-cover"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement
                                                        target.src = "/placeholder.svg"
                                                    }}
                                                />
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-100">{delivery.name}</h3>
                                                    <p className="text-xs text-gray-400">{delivery.phoneNumber}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <button
                                                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                                                    onClick={() => handleDelete(delivery._id)}
                                                    disabled={isLoading}
                                                    aria-label="Delete delivery"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 text-sm">
                                            <div className="flex items-center">
                                                <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                                <span className="text-gray-300">{delivery.address}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <CalendarDays className="w-4 h-4 mr-2 text-gray-400" />
                                                <span className="text-gray-300">{formatDeliveryDate(delivery.deliveryDate)}</span>
                                            </div>
                                            <div className="flex items-center">
                                                {getStatusIcon(delivery.status)}
                                                <select
                                                    value={delivery.status}
                                                    onChange={(e) => handleStatusChange(delivery._id, e.target.value as BulkDelivery["status"])}
                                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClasses(delivery.status)} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                    disabled={isLoading}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="delivered">Delivered</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Bulk Delivery Form Modal */}
            <BulkDeliveryFormModal
                isOpen={showFormModal}
                onClose={() => setShowFormModal(false)}
                onSuccess={fetchBulkDeliveries}
            />
        </div>
    )
}

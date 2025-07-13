"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import axios from "axios"
import { Package, Calendar, MapPin, IndianRupee, ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle, AlertCircle, Truck, Search, Trash2, Loader2, User, ImageIcon, Star, CalendarIcon, PauseCircle } from 'lucide-react'

// Types
interface Location {
    address: string
    locationLat: string
    locationLng: string
    locationType: string
    flatNumber: string
    buildingName: string
    floor: string
    landmark: string
}

interface DeliveryDate {
    _id: string
    date: string
    status: string
    description: string
    deliveryPartnerId: string | null
    deliveryTime: string
    rating: number | null
    deliveryImage: string
    isBoxCollected?: boolean
    IsBoxCleaned?: boolean
}

interface UserInfo {
    _id: string
    mobileNumber: string
    name: string
    email?: string
}

interface SubscriptionInfo {
    _id: string
    title: string
    weightOrCount: string
    imageUrl: string[] | string
}

interface Order {
    _id: string
    amount: number
    subscriptionId: SubscriptionInfo
    startDate: string
    selectedType: number
    days: string
    remainingDays: number
    deliveryDates: DeliveryDate[]
}

interface SubscriptionOrder {
    _id: string
    userID: UserInfo
    location: Location
    finalAmount: number
    totalAmount: number
    orders: Order[]
    createdAt: string
    updatedAt: string
    subscriptionStatus?: string
    gstAmount?: number
    deliveryFees?: number
    platformFees?: number
    bonusUsed?: number
    assignedFranchiseId?: string
}

interface ApiResponse {
    success: boolean
    data: SubscriptionOrder[]
}

// Franchise interface
interface FranchiseLocation {
    locationName: string
    lat: number
    lang: number
    _id?: string
}

interface PolygonCoordinate {
    lat: number
    lng: number
    _id: string
}

interface AssignedManager {
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
}

interface Franchise {
    _id: string
    name: string
    cityName: string
    branchName: string
    totalDeliveryRadius: number
    freeDeliveryRadius: number
    chargePerExtraKm: number
    location: FranchiseLocation
    assignedManager: AssignedManager
    createdAt?: string
    updatedAt?: string
    polygonCoordinates: PolygonCoordinate[]
}

interface FranchiseApiResponse {
    success: boolean
    data: Franchise[]
}

// Status options for delivery dates
const STATUS_OPTIONS = [
    "Scheduled",
    "Delivered",
    "Cancelled",
    "Delayed",
    "In Transit",
    "Failed Delivery",
    "non delivery day",
]

// Status colors and icons
const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
        case "scheduled":
            return { color: "bg-blue-100 text-blue-800", icon: <Calendar className="w-4 h-4 mr-1" /> }
        case "delivered":
            return { color: "bg-green-100 text-green-800", icon: <CheckCircle2 className="w-4 h-4 mr-1" /> }
        case "cancelled":
            return { color: "bg-red-100 text-red-800", icon: <XCircle className="w-4 h-4 mr-1" /> }
        case "delayed":
            return { color: "bg-amber-100 text-amber-800", icon: <Clock className="w-4 h-4 mr-1" /> }
        case "in transit":
            return { color: "bg-purple-100 text-purple-800", icon: <Truck className="w-4 h-4 mr-1" /> }
        case "failed delivery":
            return { color: "bg-orange-100 text-orange-800", icon: <AlertCircle className="w-4 h-4 mr-1" /> }
        case "non delivery day":
            return { color: "bg-gray-100 text-gray-800", icon: <XCircle className="w-4 h-4 mr-1" /> }
        default:
            return { color: "bg-gray-100 text-gray-800", icon: <Calendar className="w-4 h-4 mr-1" /> }
    }
}

// Get image URL with proper fallback
const getImageUrl = (path: string | string[] | undefined): string => {
    if (!path) return "/placeholder.svg?height=40&width=40"
    if (Array.isArray(path) && path.length > 0) {
        return path[0]
    }
    return typeof path === "string" ? path : "/placeholder.svg?height=40&width=40"
}

export default function SubscriptionOrderPage() {
    const [orders, setOrders] = useState<SubscriptionOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({})
    const [expandedDeliveries, setExpandedDeliveries] = useState<Record<string, boolean>>({})
    const [searchQuery, setSearchQuery] = useState("")
    const [editingDelivery, setEditingDelivery] = useState<{ orderId: string; deliveryId: string } | null>(null)
    const [statusFilter, setStatusFilter] = useState<string>("")
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [isUpdating, setIsUpdating] = useState(false)

    // Franchise state variables
    const [franchises, setFranchises] = useState<Franchise[]>([])
    const [selectedFranchiseIds, setSelectedFranchiseIds] = useState<string[]>([])
    const [pauseDate, setPauseDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
    const [isPausing, setIsPausing] = useState(false)
    const [selectedDelivery, setSelectedDelivery] = useState<{
        subscriptionOrder: SubscriptionOrder
        order: Order
        delivery: DeliveryDate
    } | null>(null)

    // API base URL
    const API_URL = `${import.meta.env.VITE_API_URL || ""}/subscription-order` || "http://localhost:3000/subscription-order"

    // Fetch orders data
    const fetchOrders = async () => {
        try {
            setLoading(true)
            const response = await axios.get<ApiResponse>(API_URL)
            setOrders(response.data.data)
        } catch (error) {
            console.error("Error fetching orders:", error)
        } finally {
            setLoading(false)
        }
    }

    // Fetch franchises data
    const fetchFranchises = async () => {
        try {
            // Replace with your actual franchise API endpoint
            const franchiseApiUrl = `${import.meta.env.VITE_API_URL || ""}/franchises` || "http://localhost:3000/franchises"
            const response = await axios.get<FranchiseApiResponse>(franchiseApiUrl)
            setFranchises(response.data.data || [])
        } catch (error) {
            console.error("Error fetching franchises:", error)
        }
    }

    // Fetch data on component mount
    useEffect(() => {
        fetchOrders()
        fetchFranchises()
    }, [])

    // Toggle expanded state for an order
    const toggleOrderExpand = (orderId: string) => {
        setExpandedOrders((prev) => ({
            ...prev,
            [orderId]: !prev[orderId],
        }))
    }

    // Toggle expanded state for delivery dates
    const toggleDeliveriesExpand = (orderId: string) => {
        setExpandedDeliveries((prev) => ({
            ...prev,
            [orderId]: !prev[orderId],
        }))
    }

    // Update delivery status
    const updateDeliveryStatus = async (
        subscriptionOrderId: string,
        orderId: string,
        deliveryId: string,
        newStatus: string,
        newDescription = "",
    ) => {
        try {
            setIsUpdating(true)

            // Find the order to update
            const orderToUpdate = orders.find((order) => order._id === subscriptionOrderId)
            if (!orderToUpdate) return

            // Create updated delivery data
            const updatedDelivery = {
                deliveryId,
                status: newStatus,
                description: newDescription || (newStatus === "non delivery day" ? "" : `${newStatus} delivery`),
            }

            // Send PATCH request to update the delivery status
            await axios.patch(`${API_URL}/${subscriptionOrderId}`, {
                orderId,
                delivery: updatedDelivery,
            })

            // Update local state
            const updatedOrders = orders.map((subscriptionOrder) => {
                if (subscriptionOrder._id === subscriptionOrderId) {
                    const updatedOrders = subscriptionOrder.orders.map((order) => {
                        if (order._id === orderId) {
                            const updatedDeliveryDates = order.deliveryDates.map((delivery) => {
                                if (delivery._id === deliveryId) {
                                    return {
                                        ...delivery,
                                        status: newStatus,
                                        description: newDescription || (newStatus === "non delivery day" ? "" : `${newStatus} delivery`),
                                    }
                                }
                                return delivery
                            })
                            return { ...order, deliveryDates: updatedDeliveryDates }
                        }
                        return order
                    })
                    return { ...subscriptionOrder, orders: updatedOrders }
                }
                return subscriptionOrder
            })

            setOrders(updatedOrders)
        } catch (error) {
            console.error("Error updating delivery status:", error)
            alert("Failed to update delivery status. Please try again.")
        } finally {
            setIsUpdating(false)
            setEditingDelivery(null)
        }
    }

    // Delete subscription order
    const deleteOrder = async (orderId: string) => {
        if (!window.confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
            return
        }

        try {
            setIsDeleting(orderId)
            await axios.delete(`${API_URL}/${orderId}`)

            // Remove the deleted order from state
            setOrders(orders.filter((order) => order._id !== orderId))
        } catch (error) {
            console.error("Error deleting order:", error)
            alert("Failed to delete order. Please try again.")
        } finally {
            setIsDeleting(null)
        }
    }

    // Pause all deliveries for selected franchises on a specific date
    const pauseAllDeliveries = async () => {
        if (selectedFranchiseIds.length === 0) {
            alert("Please select at least one franchise")
            return
        }

        try {
            setIsPausing(true)
            await axios.post(`${API_URL}/pause-all`, {
                date: pauseDate, // in yyyy-mm-dd format
                franchiseIds: selectedFranchiseIds, // array of franchise IDs
            })

            // Refresh orders after pausing
            await fetchOrders()
            alert("Successfully paused deliveries for selected franchises")

            // Reset selections
            setSelectedFranchiseIds([])
        } catch (error) {
            console.error("Error pausing deliveries:", error)
            alert("Failed to pause deliveries. Please try again.")
        } finally {
            setIsPausing(false)
        }
    }

    // Handle franchise selection
    const handleFranchiseSelection = (franchiseId: string) => {
        setSelectedFranchiseIds((prev) =>
            prev.includes(franchiseId) ? prev.filter((id) => id !== franchiseId) : [...prev, franchiseId]
        )
    }

    // Open delivery details modal
    const openDeliveryModal = (subscriptionOrder: SubscriptionOrder, order: Order, delivery: DeliveryDate) => {
        setSelectedDelivery({ subscriptionOrder, order, delivery })
    }

    // Close delivery details modal
    const closeDeliveryModal = () => {
        setSelectedDelivery(null)
    }

    // Filter orders based on search query
    const filteredOrders = orders.filter((order) => {
        const searchLower = searchQuery.toLowerCase()
        return (
            order._id.toLowerCase().includes(searchLower) ||
            order.location.address.toLowerCase().includes(searchLower) ||
            order.userID.name.toLowerCase().includes(searchLower) ||
            (order.userID.email && order.userID.email.toLowerCase().includes(searchLower)) ||
            order.userID.mobileNumber.includes(searchLower)
        )
    })

    // Filter delivery dates based on status filter
    const filterDeliveryDates = (deliveryDates: DeliveryDate[]) => {
        if (!statusFilter) return deliveryDates
        return deliveryDates.filter((delivery) => delivery.status.toLowerCase() === statusFilter.toLowerCase())
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                    <p className="text-gray-300">Loading subscription orders...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <Package className="w-8 h-8 text-blue-400" />
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Subscription Orders</h1>
                    </div>
                    <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search orders..."
                                className="w-full sm:w-64 h-10 pl-10 pr-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <select
                            className="h-10 px-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            {STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </header>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6 mx-4 sm:mx-6 mt-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                    <div className="w-full">
                        <h2 className="text-lg font-medium text-gray-200 mb-3 flex items-center">
                            <PauseCircle className="w-5 h-5 mr-2 text-blue-400" />
                            Pause Deliveries
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Select Franchises</label>
                                <div className="bg-gray-900 rounded-lg border border-gray-700 p-2 max-h-40 overflow-y-auto">
                                    {franchises.length === 0 ? (
                                        <p className="text-sm text-gray-400 p-2">Loading franchises...</p>
                                    ) : (
                                        franchises.map((franchise) => (
                                            <div key={franchise._id} className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded">
                                                <input
                                                    type="checkbox"
                                                    id={`franchise-${franchise._id}`}
                                                    checked={selectedFranchiseIds.includes(franchise._id)}
                                                    onChange={() => handleFranchiseSelection(franchise._id)}
                                                    className="rounded border-gray-600 text-blue-500 focus:ring-blue-500 bg-gray-700"
                                                />
                                                <label htmlFor={`franchise-${franchise._id}`} className="text-sm text-gray-300 cursor-pointer">
                                                    {franchise.name} - {franchise.cityName}
                                                </label>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="text-xs text-gray-400">{selectedFranchiseIds.length} franchise(s) selected</div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Select Date</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="date"
                                        value={pauseDate}
                                        onChange={(e) => setPauseDate(e.target.value)}
                                        className="bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
                                    />
                                </div>
                                <div className="text-xs text-gray-400">Format: YYYY-MM-DD</div>
                            </div>

                            <div className="flex items-end">
                                <button
                                    onClick={pauseAllDeliveries}
                                    disabled={isPausing || selectedFranchiseIds.length === 0}
                                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isPausing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Pausing...
                                        </>
                                    ) : (
                                        <>
                                            <PauseCircle className="w-4 h-4 mr-2" />
                                            Pause Deliveries
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="p-4 sm:p-6 space-y-6">
                {filteredOrders.length === 0 ? (
                    <div className="bg-gray-800 rounded-lg shadow-xl p-8 text-center border border-gray-700">
                        <Package className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                        <h3 className="text-xl font-medium text-gray-300">No orders found</h3>
                        <p className="mt-2 text-gray-400">Try adjusting your search or filter criteria</p>
                    </div>
                ) : (
                    filteredOrders.map((subscriptionOrder) => (
                        <div
                            key={subscriptionOrder._id}
                            className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700"
                        >
                            {/* Order Header */}
                            <div className="p-4 sm:p-6 border-b border-gray-700">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                Order ID: {subscriptionOrder._id.substring(subscriptionOrder._id.length - 8)}
                                            </span>
                                            <span className="text-sm text-gray-400">
                                                {new Date(subscriptionOrder.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-2 mb-2">
                                            <User className="w-5 h-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-200">{subscriptionOrder.userID.name}</p>
                                                <p className="text-xs text-gray-400">
                                                    {subscriptionOrder.userID.email || "No email"} | {subscriptionOrder.userID.mobileNumber}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                            <p className="text-sm text-gray-300">
                                                {subscriptionOrder.location.address}
                                                {subscriptionOrder.location.landmark && ` (${subscriptionOrder.location.landmark})`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-400">Total:</span>
                                                <span className="text-lg font-semibold flex items-center">
                                                    <IndianRupee className="w-4 h-4 mr-1" />
                                                    {subscriptionOrder.finalAmount}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400">Original:</span>
                                                <span className="text-sm text-gray-400 line-through flex items-center">
                                                    <IndianRupee className="w-3 h-3 mr-1" />
                                                    {subscriptionOrder.totalAmount}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded-full transition-colors"
                                            onClick={() => deleteOrder(subscriptionOrder._id)}
                                            disabled={isDeleting === subscriptionOrder._id}
                                            aria-label="Delete order"
                                        >
                                            {isDeleting === subscriptionOrder._id ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="divide-y divide-gray-700">
                                {subscriptionOrder.orders.map((order) => (
                                    <div key={order._id} className="p-4 sm:p-6">
                                        <div
                                            className="flex justify-between items-start cursor-pointer"
                                            onClick={() => toggleOrderExpand(order._id)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-700 flex-shrink-0">
                                                    {order.subscriptionId && order.subscriptionId.imageUrl ? (
                                                        <img
                                                            src={getImageUrl(Array.isArray(order.subscriptionId.imageUrl) ? order.subscriptionId.imageUrl[0] : order.subscriptionId.imageUrl) || "/placeholder.svg"}
                                                            alt={order.subscriptionId.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <ImageIcon className="w-6 h-6 text-gray-500" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="text-md font-medium text-gray-200 mb-1">
                                                        {order.subscriptionId ? order.subscriptionId.title : "Unknown Subscription"}
                                                        {order.subscriptionId && (
                                                            <span className="ml-2 text-sm text-gray-400">({order.subscriptionId.weightOrCount})</span>
                                                        )}
                                                    </h3>
                                                    <div className="flex flex-wrap gap-2 text-sm text-gray-400">
                                                        <span className="flex items-center">
                                                            <Calendar className="w-4 h-4 mr-1" />
                                                            Start: {format(new Date(order.startDate), "MMM d, yyyy")}
                                                        </span>
                                                        <span className="flex items-center">
                                                            <IndianRupee className="w-4 h-4 mr-1" />
                                                            {order.amount}
                                                        </span>
                                                        <span>Type: {order.selectedType}</span>
                                                        <span>Days: {order.days}</span>
                                                        <span>{order.remainingDays} days remaining</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="p-1 text-gray-400 hover:text-gray-200">
                                                {expandedOrders[order._id] ? (
                                                    <ChevronUp className="w-5 h-5" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>

                                        {expandedOrders[order._id] && (
                                            <div className="mt-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h4 className="text-sm font-medium text-gray-300">
                                                        Delivery Schedule ({order.deliveryDates.length} dates)
                                                    </h4>
                                                    <button
                                                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            toggleDeliveriesExpand(order._id)
                                                        }}
                                                    >
                                                        {expandedDeliveries[order._id] ? "Collapse" : "Expand"} All
                                                        {expandedDeliveries[order._id] ? (
                                                            <ChevronUp className="w-4 h-4 ml-1" />
                                                        ) : (
                                                            <ChevronDown className="w-4 h-4 ml-1" />
                                                        )}
                                                    </button>
                                                </div>

                                                <div className="bg-gray-850 rounded-lg border border-gray-700 overflow-hidden">
                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full divide-y divide-gray-700">
                                                            <thead className="bg-gray-900">
                                                                <tr>
                                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                                        Date
                                                                    </th>
                                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                                        Status
                                                                    </th>
                                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                                        Description
                                                                    </th>
                                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                                        Rating
                                                                    </th>
                                                                    <th className="px-4 py-3 whitespace-nowrap text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                                        Actions
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                                                {filterDeliveryDates(order.deliveryDates)
                                                                    .slice(0, expandedDeliveries[order._id] ? undefined : 5)
                                                                    .map((delivery) => (
                                                                        <tr
                                                                            key={delivery._id}
                                                                            className="hover:bg-gray-750 cursor-pointer"
                                                                            onClick={() => openDeliveryModal(subscriptionOrder, order, delivery)}
                                                                        >
                                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                                                                                {format(new Date(delivery.date), "MMM d, yyyy")}
                                                                            </td>
                                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                                {editingDelivery?.deliveryId === delivery._id ? (
                                                                                    <select
                                                                                        className="w-full text-sm rounded-md bg-gray-700 border-gray-600 text-gray-200"
                                                                                        defaultValue={delivery.status}
                                                                                        onChange={(e) => {
                                                                                            updateDeliveryStatus(
                                                                                                subscriptionOrder._id,
                                                                                                order._id,
                                                                                                delivery._id,
                                                                                                e.target.value,
                                                                                            )
                                                                                        }}
                                                                                        autoFocus
                                                                                        disabled={isUpdating}
                                                                                    >
                                                                                        {STATUS_OPTIONS.map((status) => (
                                                                                            <option key={status} value={status}>
                                                                                                {status}
                                                                                            </option>
                                                                                        ))}
                                                                                    </select>
                                                                                ) : (
                                                                                    <span
                                                                                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${getStatusInfo(delivery.status).color
                                                                                            }`}
                                                                                    >
                                                                                        {getStatusInfo(delivery.status).icon}
                                                                                        {delivery.status}
                                                                                    </span>
                                                                                )}
                                                                            </td>
                                                                            <td className="px-4 py-3 text-sm text-gray-300">
                                                                                {editingDelivery?.deliveryId === delivery._id ? (
                                                                                    <input
                                                                                        type="text"
                                                                                        className="w-full text-sm rounded-md bg-gray-700 border-gray-600 text-gray-200"
                                                                                        defaultValue={delivery.description}
                                                                                        onBlur={(e) => {
                                                                                            updateDeliveryStatus(
                                                                                                subscriptionOrder._id,
                                                                                                order._id,
                                                                                                delivery._id,
                                                                                                delivery.status,
                                                                                                e.target.value,
                                                                                            )
                                                                                        }}
                                                                                        onKeyDown={(e) => {
                                                                                            if (e.key === "Enter") {
                                                                                                updateDeliveryStatus(
                                                                                                    subscriptionOrder._id,
                                                                                                    order._id,
                                                                                                    delivery._id,
                                                                                                    delivery.status,
                                                                                                    e.currentTarget.value,
                                                                                                )
                                                                                            }
                                                                                        }}
                                                                                        disabled={isUpdating}
                                                                                    />
                                                                                ) : (
                                                                                    delivery.description || "-"
                                                                                )}
                                                                            </td>
                                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                                                                                {delivery.rating ? (
                                                                                    <div className="flex items-center">
                                                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                                                            <Star
                                                                                                key={star}
                                                                                                className={`w-4 h-4 ${delivery.rating !== null && star <= delivery.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-500"}`}
                                                                                            />
                                                                                        ))}
                                                                                        <span className="ml-2">{delivery.rating}/5</span>
                                                                                    </div>
                                                                                ) : (
                                                                                    <span className="text-gray-500">Not rated</span>
                                                                                )}
                                                                            </td>
                                                                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                                                {editingDelivery?.deliveryId === delivery._id ? (
                                                                                    <button
                                                                                        className="text-green-400 hover:text-green-300 transition-colors flex items-center justify-center"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation()
                                                                                            setEditingDelivery(null)
                                                                                        }}
                                                                                        disabled={isUpdating}
                                                                                    >
                                                                                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Done"}
                                                                                    </button>
                                                                                ) : (
                                                                                    <button
                                                                                        className="text-blue-400 hover:text-blue-300 transition-colors"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation()
                                                                                            setEditingDelivery({ orderId: order._id, deliveryId: delivery._id })
                                                                                        }}
                                                                                        disabled={isUpdating}
                                                                                    >
                                                                                        Edit
                                                                                    </button>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    {!expandedDeliveries[order._id] && order.deliveryDates.length > 5 && (
                                                        <div className="p-2 text-center border-t border-gray-700">
                                                            <button
                                                                className="text-sm text-blue-400 hover:text-blue-300"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    toggleDeliveriesExpand(order._id)
                                                                }}
                                                            >
                                                                Show {order.deliveryDates.length - 5} more dates
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </main>

            {/* Delivery Details Modal */}
            {selectedDelivery && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-700">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-semibold text-gray-200">Delivery Details</h3>
                                <button onClick={closeDeliveryModal} className="text-gray-400 hover:text-gray-200 transition-colors">
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Date and Status */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-400">Delivery Date</h4>
                                    <p className="text-lg font-medium text-gray-200">
                                        {format(new Date(selectedDelivery.delivery.date), "MMMM d, yyyy")}
                                    </p>
                                </div>
                                <div>
                                    <span
                                        className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full items-center ${getStatusInfo(selectedDelivery.delivery.status).color}`}
                                    >
                                        {getStatusInfo(selectedDelivery.delivery.status).icon}
                                        {selectedDelivery.delivery.status}
                                    </span>
                                </div>
                            </div>

                            {/* User Information */}
                            <div className="bg-gray-750 rounded-lg p-4 border border-gray-700">
                                <h4 className="text-md font-medium text-gray-200 mb-3 flex items-center">
                                    <User className="w-5 h-5 mr-2 text-blue-400" />
                                    Customer Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h5 className="text-sm font-medium text-gray-400">Name</h5>
                                        <p className="text-gray-200">{selectedDelivery.subscriptionOrder.userID.name}</p>
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-medium text-gray-400">Mobile</h5>
                                        <p className="text-gray-200">{selectedDelivery.subscriptionOrder.userID.mobileNumber}</p>
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-medium text-gray-400">Email</h5>
                                        <p className="text-gray-200">{selectedDelivery.subscriptionOrder.userID.email || "Not provided"}</p>
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-medium text-gray-400">User ID</h5>
                                        <p className="text-gray-200">{selectedDelivery.subscriptionOrder.userID._id}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Address Information */}
                            <div className="bg-gray-750 rounded-lg p-4 border border-gray-700">
                                <h4 className="text-md font-medium text-gray-200 mb-3 flex items-center">
                                    <MapPin className="w-5 h-5 mr-2 text-blue-400" />
                                    Delivery Address
                                </h4>
                                <div className="space-y-2">
                                    <p className="text-gray-200">{selectedDelivery.subscriptionOrder.location.address}</p>
                                    {selectedDelivery.subscriptionOrder.location.flatNumber && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <h5 className="text-sm font-medium text-gray-400">Flat/House Number</h5>
                                                <p className="text-gray-200">{selectedDelivery.subscriptionOrder.location.flatNumber}</p>
                                            </div>
                                            <div>
                                                <h5 className="text-sm font-medium text-gray-400">Building Name</h5>
                                                <p className="text-gray-200">
                                                    {selectedDelivery.subscriptionOrder.location.buildingName || "Not provided"}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {selectedDelivery.subscriptionOrder.location.floor && (
                                        <div>
                                            <h5 className="text-sm font-medium text-gray-400">Floor</h5>
                                            <p className="text-gray-200">{selectedDelivery.subscriptionOrder.location.floor}</p>
                                        </div>
                                    )}
                                    {selectedDelivery.subscriptionOrder.location.landmark && (
                                        <div>
                                            <h5 className="text-sm font-medium text-gray-400">Landmark</h5>
                                            <p className="text-gray-200">{selectedDelivery.subscriptionOrder.location.landmark}</p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div>
                                            <h5 className="text-sm font-medium text-gray-400">Location Type</h5>
                                            <p className="text-gray-200">
                                                {selectedDelivery.subscriptionOrder.location.locationType || "Not specified"}
                                            </p>
                                        </div>
                                        {selectedDelivery.subscriptionOrder.location.locationLat &&
                                            selectedDelivery.subscriptionOrder.location.locationLng && (
                                                <div>
                                                    <h5 className="text-sm font-medium text-gray-400">Coordinates</h5>
                                                    <p className="text-gray-200">
                                                        {selectedDelivery.subscriptionOrder.location.locationLat},{" "}
                                                        {selectedDelivery.subscriptionOrder.location.locationLng}
                                                    </p>
                                                </div>
                                            )}
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Details */}
                            <div className="bg-gray-750 rounded-lg p-4 border border-gray-700">
                                <h4 className="text-md font-medium text-gray-200 mb-3 flex items-center">
                                    <Package className="w-5 h-5 mr-2 text-blue-400" />
                                    Delivery Details
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h5 className="text-sm font-medium text-gray-400">Product</h5>
                                        <p className="text-gray-200">
                                            {selectedDelivery.order.subscriptionId ? selectedDelivery.order.subscriptionId.title : "Unknown Product"}
                                        </p>
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-medium text-gray-400">Weight/Count</h5>
                                        <p className="text-gray-200">
                                            {selectedDelivery.order.subscriptionId ? selectedDelivery.order.subscriptionId.weightOrCount : "N/A"}
                                        </p>
                                    </div>
                                    {selectedDelivery.delivery.deliveryTime && (
                                        <div>
                                            <h5 className="text-sm font-medium text-gray-400">Delivery Time</h5>
                                            <p className="text-gray-200">{selectedDelivery.delivery.deliveryTime}</p>
                                        </div>
                                    )}
                                    {selectedDelivery.delivery.deliveryPartnerId && (
                                        <div>
                                            <h5 className="text-sm font-medium text-gray-400">Delivery Partner ID</h5>
                                            <p className="text-gray-200">{selectedDelivery.delivery.deliveryPartnerId}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="mt-4">
                                    <h5 className="text-sm font-medium text-gray-400">Description</h5>
                                    <p className="text-gray-200 p-2 bg-gray-800 rounded mt-1 min-h-[60px]">
                                        {selectedDelivery.delivery.description || "No description provided"}
                                    </p>
                                </div>

                                {/* Rating */}
                                {selectedDelivery.delivery.rating !== null && (
                                    <div className="mt-4">
                                        <h5 className="text-sm font-medium text-gray-400">Rating</h5>
                                        <div className="flex items-center mt-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`w-5 h-5 ${selectedDelivery.delivery.rating !== null && star <= selectedDelivery.delivery.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-500"}`}
                                                />
                                            ))}
                                            <span className="ml-2 text-gray-200">{selectedDelivery.delivery.rating}/5</span>
                                        </div>
                                    </div>
                                )}

                                {/* Delivery Image */}
                                {selectedDelivery.delivery.deliveryImage && (
                                    <div className="mt-4">
                                        <h5 className="text-sm font-medium text-gray-400">Delivery Image</h5>
                                        <div className="mt-2 rounded-lg overflow-hidden border border-gray-700">
                                            <img
                                                src={selectedDelivery.delivery.deliveryImage || "/placeholder.svg"}
                                                alt="Delivery confirmation"
                                                className="w-full h-auto max-h-[200px] object-contain bg-gray-900"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-700 flex justify-end">
                            <button
                                onClick={closeDeliveryModal}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
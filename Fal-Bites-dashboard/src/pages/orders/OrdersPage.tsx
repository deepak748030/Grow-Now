"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Package, AlertCircle, CheckCircle, Eye, X, Calendar, Info } from "lucide-react"

// Type definitions
type DeliveryDate = {
    _id: string
    date: string
    status: string
    description: string
    deliveryPartnerId: string | null
    deliveryTime: string
    rating: number | null
    deliveryImage: string
}

type SubscriptionOrder = {
    amount: number
    subscriptionId: {
        _id: string
        title: string
        weightOrCount: string
        imageUrl: string
    }
    startDate: string
    selectedType: number
    days: string
    remainingDays: number
    deliveryDates: DeliveryDate[]
    _id: string
}

type Subscription = {
    _id: string
    userID: {
        _id: string
        mobileNumber: string
        name: string
        email: string
    }
    location: string
    finalAmount: number
    totalAmount: number
    orders: SubscriptionOrder[]
    createdAt: string
    updatedAt: string
}

type ApiResponse = {
    success: boolean
    data: Subscription[]
    message?: string
}

// Modal state type
type ModalState = {
    isOpen: boolean
    subscriptionId: string
    orderId: string
}

export default function SubscriptionOrdersPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    // Add modal state
    const [modal, setModal] = useState<ModalState>({
        isOpen: false,
        subscriptionId: "",
        orderId: "",
    })

    const apiUrl = import.meta.env.VITE_API_URL

    useEffect(() => {
        fetchOrders()
    }, [])

    async function fetchOrders() {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`${apiUrl}/subscription-order`, {
                method: "GET",
            })

            const result: ApiResponse = await response.json()

            if (result.success) {
                setSubscriptions(result.data)
            } else {
                setError(result.message || "Failed to fetch orders")
            }
        } catch (err) {
            setError("An error occurred while fetching orders")
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    async function handleStatusChange(subscriptionId: string, orderId: string, deliveryId: string, newStatus: string) {
        try {
            const response = await fetch(`${apiUrl}/subscription-order/${subscriptionId}/delivery-status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orderId,
                    deliveryId,
                    status: newStatus,
                }),
            })

            const result = await response.json()

            if (result.success) {
                // Update local state to reflect the change
                setSubscriptions((prevSubscriptions) =>
                    prevSubscriptions.map((subscription) => {
                        if (subscription._id === subscriptionId) {
                            return {
                                ...subscription,
                                orders: subscription.orders.map((order) => {
                                    if (order._id === orderId) {
                                        return {
                                            ...order,
                                            deliveryDates: order.deliveryDates.map((delivery) =>
                                                delivery._id === deliveryId ? { ...delivery, status: newStatus } : delivery,
                                            ),
                                        }
                                    }
                                    return order
                                }),
                            }
                        }
                        return subscription
                    }),
                )

                setSuccessMessage("Order status updated successfully")

                // Clear success message after 3 seconds
                setTimeout(() => {
                    setSuccessMessage(null)
                }, 3000)
            } else {
                setError(result.message || "Failed to update status")
            }
        } catch (err) {
            setError("An error occurred while updating status")
            console.error(err)
        }
    }

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    function getStatusBadgeClass(status: string) {
        switch (status.toLowerCase()) {
            case "delivered":
            case "completed":
                return "bg-green-600 text-green-100"
            case "pending":
            case "order placed":
            case "in transit":
            case "out-for-delivery":
            case "scheduled":
                return "bg-yellow-600 text-yellow-100"
            case "cancelled":
            case "failed":
            case "non delivery day":
                return "bg-red-600 text-red-100"
            case "paused":
                return "bg-blue-600 text-blue-100"
            default:
                return "bg-blue-600 text-blue-100"
        }
    }

    // Function to open modal
    function openModal(subscriptionId: string, orderId: string) {
        setModal({
            isOpen: true,
            subscriptionId,
            orderId,
        })
    }

    // Function to close modal
    function closeModal() {
        setModal({
            isOpen: false,
            subscriptionId: "",
            orderId: "",
        })
    }

    // Get current subscription and order for modal
    const currentSubscription = subscriptions.find((sub) => sub._id === modal.subscriptionId)
    const currentOrder = currentSubscription?.orders.find((order) => order._id === modal.orderId)

    return (
        <div className="min-h-screen bg-[#0f1729] text-white">
            {/* Header */}
            <div className="container mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6 tracking-wide">Subscription Orders</h1>

                {/* Status Messages */}
                {error && (
                    <div className="mb-6 bg-red-900/50 border border-red-700 text-red-100 px-4 py-3 rounded-lg flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="mb-6 bg-green-900/50 border border-green-700 text-green-100 px-4 py-3 rounded-lg flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        {successMessage}
                    </div>
                )}

                {/* Order List */}
                <div className="bg-[#1a2236] p-6 rounded-lg border border-[#2a3349] shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Subscription Order List</h2>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-400 border-r-transparent"></div>
                            <p className="mt-2 text-gray-300">Loading orders...</p>
                        </div>
                    ) : subscriptions.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <Package className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                            <p>No subscription orders found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            {subscriptions.map((subscription) => (
                                <div key={subscription._id} className="mb-6 bg-[#1f2942] rounded-lg overflow-hidden shadow-md">
                                    <div className="bg-[#2a3349] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <h3 className="font-semibold text-lg">Subscription #{subscription._id.slice(-6)}</h3>
                                            <p className="text-gray-400 text-sm">Customer: {subscription.userID.name}</p>
                                            <p className="text-gray-400 text-sm">Location: {subscription.location}</p>
                                        </div>
                                        <div className="flex flex-col md:items-end">
                                            <p className="text-blue-400 font-medium">₹{subscription.totalAmount}</p>
                                            <p className="text-gray-400 text-sm">Created: {formatDate(subscription.createdAt)}</p>
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <h4 className="text-sm font-medium text-gray-300 mb-3">Subscription Plans</h4>
                                        <div className="grid gap-3">
                                            {subscription.orders.map((order) => (
                                                <div
                                                    key={order._id}
                                                    className="bg-[#171f2f] p-3 rounded-lg border border-[#2a3349] flex justify-between items-center"
                                                >
                                                    <div>
                                                        <h5 className="font-medium">{order.subscriptionId.title}</h5>
                                                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                                            <span className="flex items-center">
                                                                <Info className="w-3 h-3 mr-1" />
                                                                {order.subscriptionId.weightOrCount}
                                                            </span>
                                                            <span className="flex items-center">
                                                                <Calendar className="w-3 h-3 mr-1" />
                                                                {order.days}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <p className="text-green-400">₹{order.amount}</p>
                                                            <p className="text-xs text-gray-400">{order.remainingDays} days left</p>
                                                        </div>
                                                        <button
                                                            onClick={() => openModal(subscription._id, order._id)}
                                                            className="p-2 bg-[#2a3349] rounded-full hover:bg-blue-700 transition-colors"
                                                            aria-label="View delivery details"
                                                        >
                                                            <Eye className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {modal.isOpen && currentSubscription && currentOrder && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1a2236] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="bg-[#2a3349] p-4 flex justify-between items-center sticky top-0">
                            <h3 className="font-semibold text-lg">{currentOrder.subscriptionId.title} - Delivery Schedule</h3>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-[#3a4359] rounded-full transition-colors"
                                aria-label="Close modal"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 overflow-auto flex-grow">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p className="text-gray-400 text-sm">Customer: {currentSubscription.userID.name}</p>
                                    <p className="text-gray-400 text-sm">Phone: {currentSubscription.userID.mobileNumber}</p>
                                    <p className="text-gray-400 text-sm">Email: {currentSubscription.userID.email}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Start Date: {formatDate(currentOrder.startDate)}</p>
                                    <p className="text-gray-400 text-sm">Delivery Days: {currentOrder.days}</p>
                                    <p className="text-gray-400 text-sm">Remaining Days: {currentOrder.remainingDays}</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-[#2a3349] text-left text-gray-300">
                                            <th className="p-4 text-sm">Delivery Date</th>
                                            <th className="p-4 text-sm">Time Slot</th>
                                            <th className="p-4 text-sm">Description</th>
                                            <th className="p-4 text-sm">Status</th>
                                            <th className="p-4 text-sm">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentOrder.deliveryDates.map((delivery, index) => (
                                            <tr
                                                key={delivery._id}
                                                className={`border-t border-[#2a3349] ${index % 2 === 0 ? "bg-[#171f2f]" : "bg-[#1a2236]"}`}
                                            >
                                                <td className="p-4 flex items-center gap-3 font-medium">
                                                    <ShoppingCart className="w-5 h-5 text-blue-400" />
                                                    {formatDate(delivery.date)}
                                                </td>
                                                <td className="p-4">{delivery.deliveryTime || "Not specified"}</td>
                                                <td className="p-4">{delivery.description || "No description"}</td>
                                                <td className="p-4">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(delivery.status)}`}
                                                    >
                                                        {delivery.status}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <select
                                                        className="bg-[#2a3349] text-white p-2 rounded-md border border-[#2a3349] hover:border-blue-400 transition-all outline-none cursor-pointer"
                                                        value={delivery.status}
                                                        onChange={(e) =>
                                                            handleStatusChange(
                                                                currentSubscription._id,
                                                                currentOrder._id,
                                                                delivery._id,
                                                                e.target.value,
                                                            )
                                                        }
                                                        disabled={delivery.status.toLowerCase() === "non delivery day"}
                                                    >
                                                        <option value="Scheduled">Scheduled</option>
                                                        <option value="order placed">Order Placed</option>
                                                        <option value="pending">Pending</option>
                                                        <option value="in transit">In Transit</option>
                                                        <option value="out-for-delivery">Out For Delivery</option>
                                                        <option value="delivered">Delivered</option>
                                                        <option value="cancelled">Cancelled</option>
                                                        <option value="paused">Paused</option>
                                                        {delivery.status.toLowerCase() === "non delivery day" && (
                                                            <option value="non delivery day">Non Delivery Day</option>
                                                        )}
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

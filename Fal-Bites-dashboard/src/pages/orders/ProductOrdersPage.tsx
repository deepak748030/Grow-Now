"use client"

import { useState, useEffect } from "react"
import { Package, AlertCircle, CheckCircle, Edit, X } from "lucide-react"

// Define types based on actual API response
type User = {
    _id: string
    mobileNumber: string
    name: string
}

type ProductData = {
    _id: string
    title: string
    weightOrCount: string
    imageUrl: string[] | string
} | null

type ProductOrder = {
    _id: string
    userId: User
    deliveryPartnerId?: string
    productData: ProductData
    selectedType: string
    quantity: number
    totalPrice: number
    status: string
    deliveryDate: string
    orderDate: string
    paymentMethod: string
    location?: {
        address: string
        locationLat: number
        locationLng: number
        locationType: string
        flatNumber?: string
        buildingName?: string
        floor?: string
        landmark?: string
    }
    orderTimeStamps: number
    createdAt: string
    updatedAt: string
    gstAmount?: number
    deliveryFees?: number
    platformFees?: number
    bonusUsed?: number
    assignedFranchiseId?: string
    amountEarnedByDeliveryPartner?: number
}

type ApiResponse = {
    success: boolean
    count: number
    data: ProductOrder[]
    message?: string
}

export default function ProductOrdersPage() {
    const [orders, setOrders] = useState<ProductOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [currentOrder, setCurrentOrder] = useState<ProductOrder | null>(null)
    const [editedStatus, setEditedStatus] = useState("")

    useEffect(() => {
        fetchOrders()
    }, [])

    async function fetchOrders() {
        setLoading(true)
        setError(null)
        try {
            // Use process.env for Next.js environment variables
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000"
            const response = await fetch(`${apiUrl}/product-order`, {
                method: "GET",
            })
            const result: ApiResponse = await response.json()
            if (result.success) {
                setOrders(result.data)
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

    async function handleStatusChange(orderId: string, newStatus: string) {
        try {
            // Use process.env for Next.js environment variables
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000"
            const response = await fetch(`${apiUrl}/product-order/${orderId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status: newStatus,
                }),
            })
            const result = await response.json()
            if (result.success) {
                // Update local state to reflect the change
                setOrders((prevOrders) =>
                    prevOrders.map((order) => {
                        if (order._id === orderId) {
                            return {
                                ...order,
                                status: newStatus,
                            }
                        }
                        return order
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
            case "processing":
            case "in transit":
            case "out-for-delivery":
                return "bg-yellow-600 text-yellow-100"
            case "cancelled":
            case "failed":
                return "bg-red-600 text-red-100"
            case "paused":
                return "bg-blue-600 text-blue-100"
            default:
                return "bg-blue-600 text-blue-100"
        }
    }

    function openEditModal(order: ProductOrder) {
        setCurrentOrder(order)
        setEditedStatus(order.status)
        setIsEditModalOpen(true)
    }

    function closeEditModal() {
        setIsEditModalOpen(false)
        setCurrentOrder(null)
    }

    async function handleEditSubmit() {
        if (!currentOrder) return
        await handleStatusChange(currentOrder._id, editedStatus)
        closeEditModal()
    }

    return (
        <div className="min-h-screen bg-[#0f1729] text-white">
            <div className="container mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6 tracking-wide">Product Orders</h1>

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
                    <h2 className="text-xl font-semibold mb-4">Product Order List</h2>
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-400 border-r-transparent"></div>
                            <p className="mt-2 text-gray-300">Loading orders...</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <Package className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                            <p>No product orders found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr className="bg-[#2a3349] text-left text-gray-300">
                                        <th className="p-4 text-sm">Order ID</th>
                                        <th className="p-4 text-sm">Customer</th>
                                        <th className="p-4 text-sm">Product Info</th>
                                        <th className="p-4 text-sm">Quantity</th>
                                        <th className="p-4 text-sm">Total Price</th>
                                        <th className="p-4 text-sm">Payment Method</th>
                                        <th className="p-4 text-sm">Order Date</th>
                                        <th className="p-4 text-sm">Status</th>
                                        <th className="p-4 text-sm">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order, index) => (
                                        <tr
                                            key={order._id}
                                            className={`border-t border-[#2a3349] ${index % 2 === 0 ? "bg-[#171f2f]" : "bg-[#1a2236]"}`}
                                        >
                                            <td className="p-4 font-medium">#{order._id.slice(-6)}</td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{order.userId?.name || "N/A"}</span>
                                                    <span className="text-gray-400 text-xs">{order.userId?.mobileNumber || "N/A"}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    {order.productData ? (
                                                        <>
                                                            <span className="font-medium">{order.productData.title}</span>
                                                            <span className="text-gray-400 text-xs">{order.productData.weightOrCount}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="font-medium">Product Type: {order.selectedType}</span>
                                                            <span className="text-gray-400 text-xs">Product data not available</span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">{order.quantity}</td>
                                            <td className="p-4 font-medium">₹{order.totalPrice}</td>
                                            <td className="p-4">
                                                <span className="text-sm">{order.paymentMethod}</span>
                                            </td>
                                            <td className="p-4">{formatDate(order.orderDate)}</td>
                                            <td className="p-4">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(order.status)}`}
                                                >
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="p-4 flex items-center gap-2">
                                                <select
                                                    className="bg-[#2a3349] text-white p-2 rounded-md border border-[#2a3349] hover:border-blue-400 transition-all outline-none cursor-pointer"
                                                    value={order.status}
                                                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Processing">Processing</option>
                                                    <option value="In Transit">In Transit</option>
                                                    <option value="Out For Delivery">Out For Delivery</option>
                                                    <option value="Delivered">Delivered</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </select>
                                                <button
                                                    onClick={() => openEditModal(order)}
                                                    className="p-2 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && currentOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#1a2236] p-6 rounded-lg border border-[#2a3349] shadow-lg w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Edit Order</h3>
                            <button onClick={closeEditModal} className="p-1 rounded-full hover:bg-[#2a3349]">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="mb-4">
                            <p className="text-gray-400 mb-2">Order ID: #{currentOrder._id.slice(-6)}</p>
                            <p className="mb-2">
                                <span className="font-medium">Product Type:</span> {currentOrder.selectedType}
                            </p>
                            <p className="mb-2">
                                <span className="font-medium">Customer:</span> {currentOrder.userId?.name || "N/A"}
                            </p>
                            <p className="mb-4">
                                <span className="font-medium">Total Price:</span> ₹{currentOrder.totalPrice}
                            </p>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Status</label>
                                <select
                                    className="w-full bg-[#2a3349] text-white p-2 rounded-md border border-[#2a3349] hover:border-blue-400 transition-all outline-none cursor-pointer"
                                    value={editedStatus}
                                    onChange={(e) => setEditedStatus(e.target.value)}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Processing">Processing</option>
                                    <option value="In Transit">In Transit</option>
                                    <option value="Out For Delivery">Out For Delivery</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={closeEditModal}
                                className="px-4 py-2 bg-[#2a3349] rounded-md hover:bg-[#3a4359] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditSubmit}
                                className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

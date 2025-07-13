"use client"

import { DollarSign, ShoppingCart, Package, BarChart3, Users, CheckCircle } from "lucide-react"
import { useEffect, useState } from "react"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from "recharts"
import { useNavigate } from "react-router-dom"

// Define types for our API response
interface Stat {
    title: string
    value: string
    icon: string
    change: string
}

interface SalesData {
    month: string
    sales: number
}

interface OrderData {
    name: string
    value: number
    color: string
}

interface RevenueData {
    week: string
    revenue: number
}

interface DashboardData {
    success: boolean
    stats: Stat[]
    salesData: SalesData[]
    orderData: OrderData[]
    revenueData: RevenueData[]
}

export default function DashboardPage() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)

    // Map icon strings to actual components
    const iconMap = {
        DollarSign,
        ShoppingCart,
        Package,
        BarChart3,
        Users,
        CheckCircle,
    }

    // Function to fetch dashboard data
    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem("userData")
            const userData = token ? JSON.parse(token) : null

            if (!userData) {
                navigate("/login")
                return
            }

            const apiUrl = import.meta.env.VITE_API_URL || ""
            const response = await fetch(`${apiUrl}/dashboard`, {
                headers: {
                    Authorization: `Bearer ${userData.token}`,
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                throw new Error("Failed to fetch dashboard data")
            }

            const data = await response.json()
            setDashboardData(data)
        } catch (error) {
            console.error("Error fetching dashboard data:", error)
            setError("Failed to load dashboard data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    // Show loading state
    // if (loading) {
    //     return (
    //         <div className="min-h-screen bg-[#0f1729] text-white flex items-center justify-center">
    //             <div className="text-xl">Loading dashboard data...</div>
    //         </div>
    //     )
    // }

    // Replace with this improved loading state that shows skeleton UI
    if (loading) {
        // Create placeholder data for charts
        const placeholderStats = Array(6).fill({
            title: "Loading...",
            value: "---",
            icon: "BarChart3",
            change: "---",
        })

        const placeholderSalesData = Array(6)
            .fill(0)
            .map((_, i) => ({
                month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"][i],
                sales: 0,
            }))

        const placeholderOrderData = [
            { name: "Pending", value: 0, color: "#FFC107" },
            { name: "Processing", value: 0, color: "#3B82F6" },
            { name: "Completed", value: 0, color: "#10B981" },
            { name: "Cancelled", value: 0, color: "#EF4444" },
        ]

        const placeholderRevenueData = Array(7)
            .fill(0)
            .map((_, i) => ({
                week: `Week ${i + 1}`,
                revenue: 0,
            }))

        return (
            <div className="min-h-screen bg-[#0f1729] text-white">
                {/* Header */}
                <div className="container mx-auto p-6">
                    <div className="flex items-center gap-3 mb-8">
                        <h1 className="text-2xl font-bold">Dashboard</h1>
                    </div>

                    {/* Stats Overview Skeletons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {placeholderStats.map((_, index) => (
                            <div key={index} className="bg-[#1a2236] p-6 rounded-lg border border-[#2a3349] animate-pulse">
                                <div className="flex justify-between items-start">
                                    <div className="w-full">
                                        <div className="h-3 bg-[#2a3349] rounded w-1/3 mb-3"></div>
                                        <div className="h-6 bg-[#2a3349] rounded w-1/2 mb-2"></div>
                                        <div className="h-2 bg-[#2a3349] rounded w-1/4"></div>
                                    </div>
                                    <div className="bg-[#2a3349] p-2 rounded-md h-10 w-10"></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Charts Section Skeletons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                        {/* Monthly Sales Bar Chart Skeleton */}
                        <div className="bg-[#1a2236] p-6 rounded-lg border border-[#2a3349]">
                            <h2 className="text-lg font-bold mb-4">Monthly Sales</h2>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={placeholderSalesData}>
                                    <XAxis dataKey="month" stroke="#a8a5a6" />
                                    <YAxis stroke="#a8a5a6" />
                                    <Tooltip />
                                    <Bar dataKey="sales" fill="#2a3349" />
                                </BarChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-gray-400">Loading chart data...</div>
                            </div>
                        </div>

                        {/* Order Status Pie Chart Skeleton */}
                        <div className="bg-[#1a2236] p-6 rounded-lg border border-[#2a3349]">
                            <h2 className="text-lg font-bold mb-4">Order Status</h2>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={placeholderOrderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                                        {placeholderOrderData.map((index) => (
                                            <Cell key={`cell-${index}`} fill="#2a3349" />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="text-center text-gray-400 mt-4">Loading order data...</div>
                        </div>
                    </div>

                    {/* Revenue Line Chart Skeleton */}
                    <div className="bg-[#1a2236] p-6 rounded-lg border border-[#2a3349] mt-8">
                        <h2 className="text-lg font-bold mb-4">Weekly Revenue</h2>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={placeholderRevenueData}>
                                <XAxis dataKey="week" stroke="#a8a5a6" />
                                <YAxis stroke="#a8a5a6" />
                                <Tooltip />
                                <Line type="monotone" dataKey="revenue" stroke="#2a3349" strokeWidth={3} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        )
    }

    // Show error state
    if (error || !dashboardData) {
        return (
            <div className="min-h-screen bg-[#0f1729] text-white flex items-center justify-center">
                <div className="text-xl text-red-400">{error || "Failed to load dashboard data"}</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0f1729] text-white">
            {/* Header */}
            <div className="container mx-auto p-6">
                <div className="flex items-center gap-3 mb-8">
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dashboardData.stats.map((stat, index) => {
                        // Get the icon component based on the icon name
                        const IconComponent = iconMap[stat.icon as keyof typeof iconMap]

                        return (
                            <div key={index} className="bg-[#1a2236] p-6 rounded-lg border border-[#2a3349]">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-gray-400 text-sm">{stat.title}</p>
                                        <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                                        <p className="text-xs text-gray-400 mt-2">{stat.change}</p>
                                    </div>
                                    <div className="bg-[#2a3349] p-2 rounded-md">
                                        {IconComponent && <IconComponent className="h-6 w-6 text-blue-400" />}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    {/* Monthly Sales Bar Chart */}
                    <div className="bg-[#1a2236] p-6 rounded-lg border border-[#2a3349]">
                        <h2 className="text-lg font-bold mb-4">Monthly Sales</h2>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={dashboardData.salesData}>
                                <XAxis dataKey="month" stroke="#a8a5a6" />
                                <YAxis stroke="#a8a5a6" />
                                <Tooltip />
                                <Bar dataKey="sales" fill="#00fe93" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Order Status Pie Chart */}
                    <div className="bg-[#1a2236] p-6 rounded-lg border border-[#2a3349]">
                        <h2 className="text-lg font-bold mb-4">Order Status</h2>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={dashboardData.orderData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    // If all values are 0, show empty message
                                    isAnimationActive={!dashboardData.orderData.every((item) => item.value === 0)}
                                >
                                    {dashboardData.orderData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        {dashboardData.orderData.every((item) => item.value === 0) && (
                            <div className="text-center text-gray-400 mt-4">No order data available</div>
                        )}
                    </div>
                </div>

                {/* Revenue Line Chart */}
                <div className="bg-[#1a2236] p-6 rounded-lg border border-[#2a3349] mt-8">
                    <h2 className="text-lg font-bold mb-4">Weekly Revenue</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={dashboardData.revenueData}>
                            <XAxis dataKey="week" stroke="#a8a5a6" />
                            <YAxis stroke="#a8a5a6" />
                            <Tooltip />
                            <Line type="monotone" dataKey="revenue" stroke="#fe6c00" strokeWidth={3} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}

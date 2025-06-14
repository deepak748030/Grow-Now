"use client"

import type React from "react"

import { useState, useEffect } from "react"
import axios, { AxiosResponse } from "axios"
import {
    Search,
    Calendar,
    Users,
    Truck,
    Bike,
    CheckCircle,
    XCircle,
    Clock,
    CalendarDays,
    Loader2,
    AlertCircle,
    Filter,
    Download,
} from "lucide-react"

// API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api"

// Types
interface Worker {
    _id: string
    name: string
    number: string
    image: string
    gender: string
    age: number
    status: string
    type: string
    franchiseId: string
    createdAt: string
    updatedAt: string
    __v: number
}

interface DeliveryPartner {
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
    createdAt: string
    updatedAt: string
    __v: number
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
        upiId: string
        accountNumber: string
        ifscCode: string
        bankAccountName: string
        bankName: string
    }
}

interface AttendanceRecord {
    _id: string
    workerId?: Worker
    DeliveryPartnerId?: DeliveryPartner
    type: "delivery-partner" | "worker" | "truck-driver"
    date: string
    status: "pending" | "present" | "absent" | "holiday"
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
    title,
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
            title={title}
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

// Select Component
const Select = ({
    options,
    value,
    onChange,
    className = "",
}: {
    options: { value: string; label: string }[]
    value: string
    onChange: (value: string) => void
    className?: string
}) => {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`flex h-10 w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
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
        <Calendar className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg">{message}</p>
    </div>
)

export default function AttendanceManagementPage() {
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
    const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [isUpdating, setIsUpdating] = useState(false)
    const [updateError, setUpdateError] = useState<string | null>(null)
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])

    // Fetch attendance records
    useEffect(() => {
        const fetchAttendanceRecords = async () => {
            try {
                setIsLoading(true)
                const token = localStorage.getItem("userData")
                const userData = token ? JSON.parse(token) : null

                if (!userData) {
                    // Handle authentication error
                    return
                }

                const response = await axios.get<AxiosResponse>(`${API_URL}/attendance/get-attendance`, {
                    headers: {
                        Authorization: `Bearer ${userData.token}`,
                        "Content-Type": "application/json",
                    },
                })

                if (response.data && response.data) {
                    setAttendanceRecords(
                        response.data.data.map((record: any) => ({
                            ...record,
                            status: record.status as "pending" | "present" | "absent" | "holiday",
                        })),
                    )
                    setFilteredRecords(response.data.data)
                } else {
                    toast.error("Failed to fetch attendance records")
                }
            } catch (error) {
                console.error("Error fetching attendance records:", error)
                toast.error("Failed to fetch attendance records")
            } finally {
                setIsLoading(false)
            }
        }

        fetchAttendanceRecords()
    }, [])

    // Helper function to get worker name
    const getWorkerName = (record: AttendanceRecord): string => {
        if (record.workerId) {
            return record.workerId.name || "Unnamed Worker"
        } else if (record.DeliveryPartnerId) {
            return `${record.DeliveryPartnerId.firstName} ${record.DeliveryPartnerId.lastName}`.trim() || "Unnamed Partner"
        }
        return "Unknown"
    }

    // Helper function to get worker number
    const getWorkerNumber = (record: AttendanceRecord): string => {
        if (record.workerId) {
            return record.workerId.number
        } else if (record.DeliveryPartnerId) {
            return record.DeliveryPartnerId.mobileNumber
        }
        return ""
    }

    // Helper function to get worker image
    const getWorkerImage = (record: AttendanceRecord): string => {
        if (record.workerId) {
            return record.workerId.image
        } else if (record.DeliveryPartnerId) {
            return record.DeliveryPartnerId.profileImageUrl
        }
        return "/placeholder.svg"
    }

    // Helper function to get worker status
    // const getWorkerStatus = (record: AttendanceRecord): string => {
    //     if (record.workerId) {
    //         return record.workerId.status
    //     } else if (record.DeliveryPartnerId) {
    //         return record.DeliveryPartnerId.onboardingStatus
    //     }
    //     return "unknown"
    // }

    // Filter records based on search query and filters
    useEffect(() => {
        let results = attendanceRecords

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            results = results.filter((record) => {
                const name = getWorkerName(record).toLowerCase()
                const number = getWorkerNumber(record)
                return name.includes(query) || number.includes(query) || record.type.toLowerCase().includes(query)
            })
        }

        // Apply type filter
        if (typeFilter !== "all") {
            results = results.filter((record) => record.type === typeFilter)
        }

        // Apply status filter
        if (statusFilter !== "all") {
            results = results.filter((record) => record.status === statusFilter)
        }

        setFilteredRecords(results)
    }, [searchQuery, typeFilter, statusFilter, attendanceRecords])

    // Update attendance status
    const updateAttendanceStatus = async (id: string, type: string, status: string) => {
        try {
            setIsUpdating(true)
            setUpdateError(null)

            const token = localStorage.getItem("userData")
            const userData = token ? JSON.parse(token) : null

            if (!userData) {
                // Handle authentication error
                return
            }

            const response = await axios.put(
                `${API_URL}/attendance/mark-attendance`,
                {
                    id,
                    type,
                    status,
                    date: selectedDate,
                },
                {
                    headers: {
                        Authorization: `Bearer ${userData.token}`,
                        "Content-Type": "application/json",
                    },
                },
            )

            if (response.data && response.data.success) {
                // Update the record in state
                const updatedRecords = attendanceRecords.map((record) => (record._id === id ? { ...record, status: status as "pending" | "present" | "absent" | "holiday" } : record))
                setAttendanceRecords(updatedRecords)
                toast.success("Attendance updated successfully")
            } else {
                setUpdateError(response.data.message || "Failed to update attendance")
                toast.error("Failed to update attendance")
            }
        } catch (error) {
            console.error("Error updating attendance:", error)
            setUpdateError("An error occurred while updating attendance")
            toast.error("Failed to update attendance")
        } finally {
            setIsUpdating(false)
        }
    }

    // Format date to readable string
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    // Get worker type icon
    const getWorkerTypeIcon = (type: string) => {
        switch (type) {
            case "delivery-partner":
                return <Bike className="h-4 w-4 mr-1" />
            case "truck-driver":
                return <Truck className="h-4 w-4 mr-1" />
            case "worker":
                return <Users className="h-4 w-4 mr-1" />
            default:
                return <Users className="h-4 w-4 mr-1" />
        }
    }

    // Get status badge
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "present":
                return <Badge className="bg-green-500 hover:bg-green-600">Present</Badge>
            case "absent":
                return <Badge className="bg-red-500 hover:bg-red-600">Absent</Badge>
            case "pending":
                return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>
            case "holiday":
                return <Badge className="bg-purple-500 hover:bg-purple-600">Holiday</Badge>
            default:
                return <Badge>{status}</Badge>
        }
    }

    // Export attendance data to CSV
    const exportToCSV = () => {
        // Create CSV header
        const header = ["Name", "Type", "Date", "Status", "Contact Number"]

        // Create CSV rows
        const rows = filteredRecords.map((record) => [
            getWorkerName(record),
            record.type,
            formatDate(record.date),
            record.status,
            getWorkerNumber(record),
        ])

        // Combine header and rows
        const csvContent = [header.join(","), ...rows.map((row) => row.join(","))].join("\n")

        // Create a blob and download link
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `attendance-${selectedDate}.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Calendar className="w-8 h-8 text-blue-400" />
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">ATTENDANCE MANAGEMENT</h1>
                    </div>
                    <Button onClick={exportToCSV} variant="outline" className="hidden sm:flex">
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                </div>
            </header>

            <main className="p-4 sm:p-6 space-y-6">
                {/* Search and Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search by name, number, or type..."
                            className="w-full h-12 pl-10 pr-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Select
                            options={[
                                { value: "all", label: "All Types" },
                                { value: "worker", label: "Worker" },
                                { value: "truck-driver", label: "Truck Driver" },
                                { value: "delivery-partner", label: "Delivery Partner" },
                            ]}
                            value={typeFilter}
                            onChange={setTypeFilter}
                            className="w-full h-12 pl-10 pr-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100"
                        />
                    </div>

                    <div className="relative">
                        <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Select
                            options={[
                                { value: "all", label: "All Statuses" },
                                { value: "present", label: "Present" },
                                { value: "absent", label: "Absent" },
                                { value: "pending", label: "Pending" },
                                { value: "holiday", label: "Holiday" },
                            ]}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            className="w-full h-12 pl-10 pr-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100"
                        />
                    </div>
                </div>

                {/* Date Selector */}
                <div className="flex items-center space-x-4">
                    <CalendarDays className="w-5 h-5 text-gray-400" />
                    <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-48 h-10 rounded-lg bg-gray-800 border border-gray-700 text-gray-100"
                    />
                </div>

                {/* Attendance Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gray-800 border-gray-700 text-gray-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-gray-300">Total Workers</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{attendanceRecords.length}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700 text-gray-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-gray-300">Present</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {attendanceRecords.filter((record) => record.status === "present").length}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700 text-gray-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-gray-300">Absent</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {attendanceRecords.filter((record) => record.status === "absent").length}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700 text-gray-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-gray-300">Pending</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {attendanceRecords.filter((record) => record.status === "pending").length}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Attendance Date Summary */}
                <Card className="bg-gray-800 border border-gray-700 shadow-xl">
                    <CardHeader className="bg-gray-750 border-b border-gray-700">
                        <div className="flex items-center justify-between">
                            <CardTitle>Attendance Summary for {formatDate(selectedDate)}</CardTitle>
                            <div className="flex items-center space-x-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        const date = new Date(selectedDate)
                                        date.setDate(date.getDate() - 1)
                                        setSelectedDate(date.toISOString().split("T")[0])
                                    }}
                                >
                                    Previous Day
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        const date = new Date(selectedDate)
                                        date.setDate(date.getDate() + 1)
                                        setSelectedDate(date.toISOString().split("T")[0])
                                    }}
                                >
                                    Next Day
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center p-4 bg-gray-750 rounded-lg border border-gray-700">
                                <div className="p-2 mr-4 bg-green-500/20 rounded-full">
                                    <CheckCircle className="h-6 w-6 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Present</p>
                                    <p className="text-2xl font-bold">{filteredRecords.filter((r) => r.status === "present").length}</p>
                                </div>
                            </div>

                            <div className="flex items-center p-4 bg-gray-750 rounded-lg border border-gray-700">
                                <div className="p-2 mr-4 bg-red-500/20 rounded-full">
                                    <XCircle className="h-6 w-6 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Absent</p>
                                    <p className="text-2xl font-bold">{filteredRecords.filter((r) => r.status === "absent").length}</p>
                                </div>
                            </div>

                            <div className="flex items-center p-4 bg-gray-750 rounded-lg border border-gray-700">
                                <div className="p-2 mr-4 bg-yellow-500/20 rounded-full">
                                    <Clock className="h-6 w-6 text-yellow-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Attendance Rate</p>
                                    <p className="text-2xl font-bold">
                                        {filteredRecords.length > 0
                                            ? `${Math.round((filteredRecords.filter((r) => r.status === "present").length / filteredRecords.length) * 100)}%`
                                            : "0%"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Attendance Records Table */}
                <Card className="bg-gray-800 border border-gray-700 shadow-xl overflow-hidden">
                    <CardHeader className="bg-gray-750 border-b border-gray-700">
                        <CardTitle>Attendance Records</CardTitle>
                        <CardDescription className="text-gray-400">
                            View and update attendance status for all workers.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <LoadingSpinner />
                        ) : filteredRecords.length === 0 ? (
                            <EmptyState message="No attendance records found" />
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-750 hover:bg-gray-750">
                                            <TableHead className="text-gray-300">Worker</TableHead>
                                            <TableHead className="text-gray-300">Type</TableHead>
                                            <TableHead className="text-gray-300">Date</TableHead>
                                            <TableHead className="text-gray-300">Status</TableHead>
                                            <TableHead className="text-gray-300 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredRecords.map((record) => (
                                            <TableRow key={record._id} className="border-t border-gray-700 hover:bg-gray-750">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                                            {getWorkerImage(record) ? (
                                                                <img
                                                                    src={getWorkerImage(record) || "/placeholder.svg"}
                                                                    alt={getWorkerName(record)}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <span className="text-gray-400 text-lg font-medium">
                                                                    {getWorkerName(record) ? getWorkerName(record)[0] : "?"}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{getWorkerName(record)}</div>
                                                            <div className="text-sm text-gray-400">{getWorkerNumber(record)}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        {getWorkerTypeIcon(record.type)}
                                                        <span className="capitalize">{record.type.replace("-", " ")}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{formatDate(record.date)}</TableCell>
                                                <TableCell>{getStatusBadge(record.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="success"
                                                            onClick={() => updateAttendanceStatus(record._id, record.type, "present")}
                                                            disabled={isUpdating || record.status === "present"}
                                                            title="Mark Present"
                                                        >
                                                            <CheckCircle className="h-4 w-4 mr-1" />
                                                            Present
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => updateAttendanceStatus(record._id, record.type, "absent")}
                                                            disabled={isUpdating || record.status === "absent"}
                                                            title="Mark Absent"
                                                        >
                                                            <XCircle className="h-4 w-4 mr-1" />
                                                            Absent
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => updateAttendanceStatus(record._id, record.type, "pending")}
                                                            disabled={isUpdating || record.status === "pending"}
                                                            title="Mark Pending"
                                                        >
                                                            <Clock className="h-4 w-4 mr-1" />
                                                            Pending
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

                {/* Error Message */}
                {updateError && (
                    <div className="p-4 bg-red-900/50 border border-red-700 text-red-200 rounded flex items-start">
                        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{updateError}</span>
                    </div>
                )}
            </main>
        </div>
    )
}

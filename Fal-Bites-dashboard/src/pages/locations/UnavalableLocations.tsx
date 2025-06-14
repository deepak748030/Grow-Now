"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { MapPin, AlertCircle, Loader2, Calendar, User } from "lucide-react"
import axios from "axios"

// API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api"

// Location Interface
interface Location {
    _id: string
    city: string
    area: string
    pinCode: string
    addedBy: {
        _id: string
        mobileNumber: string
        name: string
    } | null
    reason: string
    date: string
    __v: number
}

// API Response Interface
interface ApiResponse {
    success: boolean
    locations: Location[]
}

// Custom Badge Component Unavailable Locations
const Badge = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
            {children}
        </span>
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

// Loading Spinner Component
const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
)

// Empty State Component
const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center p-8 text-gray-400">
        <MapPin className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg">{message}</p>
    </div>
)

export default function UnavailableLocationsPage() {
    const [locations, setLocations] = useState<Location[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

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

    // Fetch locations data
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                setIsLoading(true)
                // For demo purposes, we're using the provided data directly
                // In a real app, you would fetch from an API endpoint
                const response = await axios.get<ApiResponse>(`${API_URL}/unavailable-locations`)

                // Simulating API response with the provided data

                if (response.data && response.data.success) {
                    setLocations(response.data.locations)
                } else {
                    setError("Failed to fetch unavailable locations")
                }
            } catch (error) {
                console.error("Error fetching unavailable locations:", error)
                setError("An error occurred while fetching unavailable locations")
            } finally {
                setIsLoading(false)
            }
        }

        fetchLocations()
    }, [])

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <MapPin className="w-8 h-8 text-red-400" />
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">UNAVAILABLE LOCATIONS</h1>
                    </div>
                </div>
            </header>

            <main className="p-4 sm:p-6 space-y-6">
                {/* Stats Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="bg-gray-800 border-gray-700 text-gray-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-gray-300">Total Unavailable Locations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{locations.length}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Locations List */}
                <Card className="bg-gray-800 border border-gray-700 shadow-xl overflow-hidden">
                    <CardHeader className="bg-gray-750 border-b border-gray-700">
                        <CardTitle>Unavailable Locations</CardTitle>
                        <CardDescription className="text-gray-400">
                            Areas where delivery service is currently unavailable
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <LoadingSpinner />
                        ) : error ? (
                            <div className="p-4 text-red-400 flex items-center">
                                <AlertCircle className="w-5 h-5 mr-2" />
                                {error}
                            </div>
                        ) : locations.length === 0 ? (
                            <EmptyState message="No unavailable locations found" />
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-750 hover:bg-gray-750">
                                            <TableHead className="text-gray-300">Location</TableHead>
                                            <TableHead className="text-gray-300">Reason</TableHead>
                                            <TableHead className="text-gray-300">Added By</TableHead>
                                            <TableHead className="text-gray-300">Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {locations.map((location) => (
                                            <TableRow key={location._id} className="border-t border-gray-700 hover:bg-gray-750">
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="font-medium flex items-center">
                                                            <MapPin className="w-4 h-4 mr-2 text-red-400" />
                                                            {location.city}, {location.area}
                                                        </div>
                                                        <Badge className="bg-gray-700 text-gray-300">PIN: {location.pinCode}</Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{location.reason}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-2">
                                                            <User className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                        <div>
                                                            {location.addedBy ? (
                                                                <>
                                                                    <div className="font-medium">{location.addedBy.name}</div>
                                                                    <div className="text-sm text-gray-400">{location.addedBy.mobileNumber}</div>
                                                                </>
                                                            ) : (
                                                                <span className="text-gray-400">System</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center text-sm">
                                                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                        {formatDate(location.date)}
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

                {/* Mobile View for Small Screens */}

            </main>
        </div>
    )
}

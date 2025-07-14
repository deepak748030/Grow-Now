"use client"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import axios from "axios"
import { Package, Plus, Pencil, Trash2, X, Menu, Loader2 } from "lucide-react"

// Types and Interfaces
interface Vendor {
    _id: string
    name: string
    username: string
    brandName: string
    password?: string // Optional for fetching, required for creation/update
    createdAt?: string
    updatedAt?: string
}

interface ApiResponse<T> {
    success: boolean
    message?: string
    error?: string
    data: T | T[]
}

// API Configuration
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000", // Base URL for vendor APIs
})

// Vendor API Functions
const createVendor = async (data: VendorFormData) => {
    try {
        const response = await api.post<ApiResponse<Vendor>>("/vendors", data, {
            headers: { "Content-Type": "application/json" },
        })
        if (!response.data.success) {
            throw new Error(response.data.error || "Failed to create vendor")
        }
        return response.data.data as Vendor
    } catch (error: any) {
        console.error("Failed to create vendor:", error)
        throw new Error(error.response?.data?.error || "Failed to create vendor")
    }
}

const getVendors = async () => {
    try {
        const response = await api.get<ApiResponse<Vendor[]>>("/vendors")
        if (!response.data.success) {
            throw new Error(response.data.error || "Failed to fetch vendors")
        }
        return response.data.data || []
    } catch (error: any) {
        console.error("Failed to fetch vendors:", error)
        throw new Error(error.response?.data?.error || "Failed to fetch vendors")
    }
}

const getVendorById = async (id: string) => {
    try {
        const response = await api.get<ApiResponse<Vendor>>(`/vendors/${id}`)
        if (!response.data.success) {
            throw new Error(response.data.error || "Vendor not found")
        }
        return response.data.data as Vendor
    } catch (error: any) {
        console.error("Failed to fetch vendor by ID:", error)
        throw new Error(error.response?.data?.error || "Failed to fetch vendor details")
    }
}

const updateVendor = async (id: string, data: Partial<VendorFormData>) => {
    try {
        const response = await api.put<ApiResponse<Vendor>>(`/vendors/${id}`, data, {
            headers: { "Content-Type": "application/json" },
        })
        if (!response.data.success) {
            throw new Error(response.data.error || "Failed to update vendor")
        }
        return response.data.data as Vendor
    } catch (error: any) {
        console.error("Failed to update vendor:", error)
        throw new Error(error.response?.data?.error || "Failed to update vendor")
    }
}

const deleteVendor = async (id: string) => {
    try {
        const response = await api.delete<ApiResponse<any>>(`/vendors/${id}`)
        if (!response.data.success) {
            throw new Error(response.data.error || "Failed to delete vendor")
        }
        return response.data.message
    } catch (error: any) {
        console.error("Failed to delete vendor:", error)
        throw new Error(error.response?.data?.error || "Failed to delete vendor")
    }
}

// Zod Schema for Vendor Form
const vendorSchema = z.object({
    name: z.string().min(1, "Name is required"),
    username: z.string().min(1, "Username is required"),
    password: z.string().optional(), // Optional for update, but will be set for create
    brandName: z.string().min(1, "Brand Name is required"),
})

type VendorFormData = z.infer<typeof vendorSchema>

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

export default function VendorManagementPage() {
    const [vendors, setVendors] = useState<Vendor[]>([])
    const [isLoading, setIsLoading] = useState(false) // For form submission/deletion
    const [isInitialLoading, setIsInitialLoading] = useState(true) // For initial data fetch
    const [error, setError] = useState<string | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
    const [showMobileMenu, setShowMobileMenu] = useState(false)

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<VendorFormData>({
        resolver: zodResolver(vendorSchema),
        defaultValues: {
            name: "",
            username: "",
            password: "",
            brandName: "",
        },
    })

    const fetchVendors = async () => {
        setIsInitialLoading(true)
        setError(null)
        try {
            const data = await getVendors()
            setVendors(Array.isArray(data[0]) ? (data as Vendor[][]).flat() : (data as Vendor[]))
        } catch (err: any) {
            setError(err.message || "Failed to load vendors.")
        } finally {
            setIsInitialLoading(false)
        }
    }

    useEffect(() => {
        fetchVendors()
    }, [])

    const resetFormCompletely = () => {
        reset({
            name: "",
            username: "",
            password: "",
            brandName: "",
        })
        setEditingVendor(null)
        setError(null)
    }

    const handleCloseModal = () => {
        setShowForm(false)
        resetFormCompletely()
    }

    const onSubmit = async (data: VendorFormData) => {
        setIsLoading(true)
        setError(null)
        try {
            if (editingVendor) {
                // For update, only send fields that are present in the form and not empty
                const updateData: Partial<VendorFormData> = {
                    name: data.name,
                    username: data.username,
                    brandName: data.brandName,
                }
                // Only include password if it's provided (i.e., not an empty string)
                if (data.password) {
                    updateData.password = data.password
                }
                await updateVendor(editingVendor._id, updateData)
            } else {
                // For creation, password is required by the API
                if (!data.password) {
                    throw new Error("Password is required for new vendor creation.")
                }
                await createVendor(data as Required<VendorFormData>) // Cast to Required as password is now mandatory for create
            }
            await fetchVendors() // Refresh list
            handleCloseModal()
        } catch (err: any) {
            setError(err.message || "Failed to save vendor.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleEdit = async (vendor: Vendor) => {
        setIsLoading(true)
        setError(null)
        try {
            const fullVendor = await getVendorById(vendor._id) // Fetch full vendor details
            setEditingVendor(fullVendor)
            setValue("name", fullVendor.name)
            setValue("username", fullVendor.username)
            setValue("brandName", fullVendor.brandName)
            setValue("password", "") // Do not pre-fill password for security
            setShowForm(true)
        } catch (err: any) {
            setError(err.message || "Failed to load vendor details for editing.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this vendor?")) {
            setIsLoading(true)
            setError(null)
            try {
                await deleteVendor(id)
                await fetchVendors() // Refresh list
            } catch (err: any) {
                setError(err.message || "Failed to delete vendor.")
            } finally {
                setIsLoading(false)
            }
        }
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
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Vendor Management</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => {
                                resetFormCompletely()
                                setShowForm(true)
                            }}
                            className="hidden sm:inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-blue-400 hover:bg-blue-500 transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Vendor
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
                                resetFormCompletely()
                                setShowForm(true)
                                setShowMobileMenu(false)
                            }}
                            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-blue-400 hover:bg-blue-500 transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Vendor
                        </button>
                    </div>
                )}
            </header>

            <main className="p-4 sm:p-6 space-y-6">
                {/* Vendors List/Grid */}
                <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700">
                    {isInitialLoading ? (
                        <LoadingSpinner />
                    ) : vendors.length === 0 ? (
                        <EmptyState message="No vendors found" />
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden sm:block">
                                <table className="min-w-full divide-y divide-gray-700">
                                    <thead className="bg-gray-900">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Username
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Brand Name
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                                        {vendors.map((vendor) => (
                                            <tr key={vendor._id} className="hover:bg-gray-750">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-100">{vendor.name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-300">{vendor.username}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-300">{vendor.brandName}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        className="text-blue-400 hover:text-blue-300 mr-4 transition-colors"
                                                        onClick={() => handleEdit(vendor)}
                                                        disabled={isLoading}
                                                    >
                                                        <Pencil className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        className="text-red-400 hover:text-red-300 transition-colors"
                                                        onClick={() => handleDelete(vendor._id)}
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
                                {vendors.map((vendor) => (
                                    <div key={vendor._id} className="p-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-100">{vendor.name}</h3>
                                                <p className="text-xs text-gray-400">{vendor.brandName}</p>
                                                <p className="text-xs text-gray-400">@{vendor.username}</p>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <button
                                                    className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                                                    onClick={() => handleEdit(vendor)}
                                                    disabled={isLoading}
                                                    aria-label="Edit vendor"
                                                >
                                                    <Pencil className="w-5 h-5" />
                                                </button>
                                                <button
                                                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                                                    onClick={() => handleDelete(vendor._id)}
                                                    disabled={isLoading}
                                                    aria-label="Delete vendor"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Vendor Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-800">
                        <div className="sticky top-0 bg-gray-900 px-6 py-4 border-b border-gray-800 z-10">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-gray-100">
                                    {editingVendor ? "Edit Vendor" : "Add New Vendor"}
                                </h2>
                                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-200 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                                <input
                                    {...register("name")}
                                    className="w-full h-12 px-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter vendor's name"
                                />
                                {errors.name && <p className="mt-2 text-sm text-red-400">{errors.name.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                                <input
                                    {...register("username")}
                                    className="w-full h-12 px-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter unique username"
                                />
                                {errors.username && <p className="mt-2 text-sm text-red-400">{errors.username.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Password {editingVendor ? "(Leave blank to keep current)" : ""}
                                </label>
                                <input
                                    type="password"
                                    {...register("password")}
                                    className="w-full h-12 px-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder={editingVendor ? "New password (optional)" : "Enter password"}
                                />
                                {errors.password && <p className="mt-2 text-sm text-red-400">{errors.password.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Brand Name</label>
                                <input
                                    {...register("brandName")}
                                    className="w-full h-12 px-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter vendor's brand name"
                                />
                                {errors.brandName && <p className="mt-2 text-sm text-red-400">{errors.brandName.message}</p>}
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-4 space-y-4 space-y-reverse sm:space-y-0 pt-6">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-6 py-3 text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors"
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-6 py-3 rounded-lg bg-blue-500 text-gray-900 font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Vendor"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import axios from "axios"
import { Lightbulb, Plus, Pencil, Trash2, X, Menu, Loader2, Search } from "lucide-react"

// Types and Interfaces
interface DailyTip {
    _id: string
    title: string
    imageUrl: string
    subscription: "free" | "paid"
}

interface ApiResponse {
    success: boolean
    data: DailyTip[]
}

// API Configuration
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
})

// API Functions
const getDailyTips = async () => {
    const response = await api.get<ApiResponse>("/daily-tips")
    return response.data.data
}

const getDailyTipById = async (id: string) => {
    const response = await api.get(`/daily-tips/${id}`)
    return response.data.data
}

const createDailyTip = async (formData: FormData) => {
    const response = await api.post<ApiResponse>("/daily-tips", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data.data[0]
}

const updateDailyTip = async (id: string, formData: FormData) => {
    const response = await api.patch<ApiResponse>(`/daily-tips/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data.data[0]
}

const deleteDailyTip = async (id: string) => {
    await api.delete(`/daily-tips/${id}`)
}

const searchDailyTips = async (query: string) => {
    const response = await api.get<ApiResponse>("/daily-tips/search", {
        params: { q: query },
    })
    return response.data.data
}

// Zod Schema for Daily Tip
const dailyTipSchema = z.object({
    title: z.string().min(1, "Title is required"),
    subscription: z.enum(["free", "paid"], {
        required_error: "Subscription type is required",
    }),
})

type DailyTipFormData = z.infer<typeof dailyTipSchema>

// Loading Spinner Component
const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
)

// Empty State Component
const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center p-8 text-gray-400">
        <Lightbulb className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg">{message}</p>
    </div>
)

export default function DailyTipsPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [imagePreview, setImagePreview] = useState<{ file: File; preview: string } | null>(null)
    const [dailyTips, setDailyTips] = useState<DailyTip[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [editingTip, setEditingTip] = useState<DailyTip | null>(null)
    const [showMobileMenu, setShowMobileMenu] = useState(false)
    const [isSearching, setIsSearching] = useState(false)

    // Reference to file input for resetting
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Form for the daily tip
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
        setValue,
    } = useForm<DailyTipFormData>({
        resolver: zodResolver(dailyTipSchema),
        defaultValues: {
            title: "",
            subscription: "free",
        },
    })

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const tipsData = await getDailyTips()
                setDailyTips(tipsData)
            } catch (error) {
                console.error("Failed to fetch initial data:", error)
            } finally {
                setIsInitialLoading(false)
            }
        }
        fetchInitialData()
    }, [])

    // Handle search with debouncing
    useEffect(() => {
        const handleSearch = async () => {
            if (!searchQuery) {
                const data = await getDailyTips()
                setDailyTips(data)
                return
            }

            setIsSearching(true)
            try {
                const data = await searchDailyTips(searchQuery)
                setDailyTips(data)
            } catch (error) {
                console.error("Failed to search daily tips:", error)
            } finally {
                setIsSearching(false)
            }
        }

        const debounceTimeout = setTimeout(handleSearch, 300)
        return () => clearTimeout(debounceTimeout)
    }, [searchQuery])

    // Reset form completely
    const resetFormCompletely = () => {
        reset({
            title: "",
            subscription: "free",
        })
        setImagePreview(null)
        setEditingTip(null)
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const onSubmit = async (data: DailyTipFormData) => {
        setIsLoading(true)
        try {
            const formData = new FormData()

            // Append daily tip data
            formData.append("title", data.title)
            formData.append("subscription", data.subscription)

            // Append image if exists
            if (imagePreview) {
                formData.append("image", imagePreview.file)
            }

            if (editingTip) {
                await updateDailyTip(editingTip._id, formData)
            } else {
                await createDailyTip(formData)
            }

            // Refresh daily tips list
            const tipsData = await getDailyTips()
            setDailyTips(tipsData)

            // Reset form and state
            resetFormCompletely()

            // Close the form modal
            setShowForm(false)
        } catch (error) {
            console.error("Failed to save daily tip:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this daily tip?")) {
            setIsLoading(true)
            try {
                await deleteDailyTip(id)
                const data = await getDailyTips()
                setDailyTips(data)
            } catch (error) {
                console.error("Failed to delete daily tip:", error)
            } finally {
                setIsLoading(false)
            }
        }
    }

    const handleEdit = async (tip: DailyTip) => {
        try {
            // First reset the form to clear any previous data
            resetFormCompletely()

            // Fetch the full daily tip details
            const fullTip = await getDailyTipById(tip._id)

            // Set the editing tip state
            setEditingTip(fullTip)

            // Set form values
            setValue("title", fullTip.title)
            setValue("subscription", fullTip.subscription)

            // Open the form modal
            setShowForm(true)
        } catch (error) {
            console.error("Failed to fetch daily tip details:", error)
        }
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            // Create a new object URL for the preview
            const previewUrl = URL.createObjectURL(file)

            setImagePreview({
                file,
                preview: previewUrl,
            })
        }
    }

    const removeImage = () => {
        setImagePreview(null)
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    // Clean up object URLs when component unmounts or when imagePreview changes
    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview.preview)
            }
        }
    }, [imagePreview])

    // Close modal and reset form
    const handleCloseModal = () => {
        setShowForm(false)
        resetFormCompletely()
    }

    const getImageUrl = (path?: string) => {
        if (!path) return "/placeholder.svg"

        return `${path}`
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
            {/* Header */}
            <header className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Lightbulb className="w-8 h-8 text-blue-400" />
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Daily Tips</h1>
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
                            Add Tip
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
                            Add Tip
                        </button>
                    </div>
                )}
            </header>

            <main className="p-4 sm:p-6 space-y-6">
                {/* Search */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search daily tips..."
                            className="w-full h-12 pl-10 pr-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Daily Tips Grid */}
                <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700">
                    {isSearching ? (
                        <LoadingSpinner />
                    ) : dailyTips.length === 0 ? (
                        <EmptyState message="No daily tips found" />
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden sm:block">
                                <table className="min-w-full divide-y divide-gray-700">
                                    <thead className="bg-gray-900">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Tip
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Subscription
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                                        {dailyTips.map((tip) => (
                                            <tr key={tip._id} className="hover:bg-gray-750">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {tip.imageUrl ? (
                                                            <img
                                                                src={getImageUrl(tip.imageUrl) || "/placeholder.svg"}
                                                                alt={tip.title}
                                                                className="w-10 h-10 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                                                <Lightbulb className="w-5 h-5 text-gray-400" />
                                                            </div>
                                                        )}
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-100">{tip.title}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 text-sm rounded-full ${tip.subscription === "paid"
                                                        ? "bg-green-500/20 text-green-400"
                                                        : "bg-gray-700 text-gray-300"
                                                        }`}>
                                                        {tip.subscription}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        className="text-blue-400 hover:text-blue-300 mr-4 transition-colors"
                                                        onClick={() => handleEdit(tip)}
                                                        disabled={isLoading}
                                                    >
                                                        <Pencil className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        className="text-red-400 hover:text-red-300 transition-colors"
                                                        onClick={() => handleDelete(tip._id)}
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
                                {dailyTips.map((tip) => (
                                    <div key={tip._id} className="p-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                {tip.imageUrl ? (
                                                    <img
                                                        src={getImageUrl(tip.imageUrl) || "/placeholder.svg"}
                                                        alt={tip.title}
                                                        className="w-12 h-12 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                                                        <Lightbulb className="w-6 h-6 text-gray-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-100">{tip.title}</h3>
                                                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${tip.subscription === "paid"
                                                        ? "bg-green-500/20 text-green-400"
                                                        : "bg-gray-700 text-gray-300"
                                                        }`}>
                                                        {tip.subscription}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <button
                                                    className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                                                    onClick={() => handleEdit(tip)}
                                                    disabled={isLoading}
                                                    aria-label="Edit tip"
                                                >
                                                    <Pencil className="w-5 h-5" />
                                                </button>
                                                <button
                                                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                                                    onClick={() => handleDelete(tip._id)}
                                                    disabled={isLoading}
                                                    aria-label="Delete tip"
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

            {/* Daily Tip Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-800">
                        <div className="sticky top-0 bg-gray-900 px-6 py-4 border-b border-gray-800 z-10">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-gray-100">
                                    {editingTip ? "Edit Daily Tip" : "Add New Daily Tip"}
                                </h2>
                                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-200 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                                <input
                                    {...register("title")}
                                    className="w-full h-12 px-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {errors.title && <p className="mt-2 text-sm text-red-400">{errors.title.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Subscription Type</label>
                                <select
                                    {...register("subscription")}
                                    className="w-full h-12 px-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="free">Free</option>
                                    <option value="paid">Paid</option>
                                </select>
                                {errors.subscription && <p className="mt-2 text-sm text-red-400">{errors.subscription.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Image</label>
                                <div className="flex items-center space-x-4">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-gray-900 hover:file:bg-blue-600"
                                    />
                                    {imagePreview && (
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="p-2 bg-red-500 rounded-full text-gray-900 hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                {imagePreview && (
                                    <div className="mt-4">
                                        <img
                                            src={imagePreview.preview || "/placeholder.svg"}
                                            alt="Preview"
                                            className="h-40 object-contain rounded-lg"
                                        />
                                    </div>
                                )}
                                {editingTip && editingTip.imageUrl && !imagePreview && (
                                    <div className="mt-4">
                                        <p className="text-sm text-gray-400 mb-2">Current image:</p>
                                        <img
                                            src={getImageUrl(editingTip.imageUrl) || "/placeholder.svg"}
                                            alt="Current"
                                            className="h-40 object-contain rounded-lg"
                                        />
                                    </div>
                                )}
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
                                        "Save Tip"
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
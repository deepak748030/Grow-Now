"use client"
// image
import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import axios from "axios"
import { Package, Plus, Pencil, Trash2, X, Menu, Loader2, IndianRupee, Search } from "lucide-react"
// Small Description
// Types and Interfaces
interface SubscriptionType {
    title: string
    price: number
    withoutDiscountPrice: number
    smallDescription: string
}

// Add the Franchise interface after the SubscriptionType interface
interface Location {
    locationName: string
    lat: number
    lang: number
}

interface Manager {
    _id: string
    name: string
    mobileNumber: string
    role: string
}

interface Franchise {
    _id: string
    name: string
    cityName: string
    branchName: string
    location: Location
    assignedManager: Manager | null
}

// Update the Subscription interface to include franchiseIds
interface Subscription {
    _id: string
    title: string
    description: string
    category: string
    weightOrCount: string
    tag: string
    imageUrl?: string[]
    franchiseIds?: string[]
    types: SubscriptionType[]
    createdAt: string
    updatedAt: string
}

interface ApiResponse<T> {
    success: boolean
    data: T[]
}

// API Configuration
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
})

// API Functions
const getSubscriptions = async () => {
    const response = await api.get<ApiResponse<Subscription>>("/subscriptions")
    return response.data.data
}

const getSubscriptionById = async (id: string) => {
    const response = await api.get<Subscription>(`/subscriptions/${id}`)
    return response.data
}

const createSubscription = async (formData: FormData) => {
    const response = await api.post<ApiResponse<Subscription>>("/subscriptions", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    })
    console.log(response.data)
    return response.data.data[0]
}

const updateSubscription = async (id: string, formData: FormData) => {
    const response = await api.patch<ApiResponse<Subscription>>(`/subscriptions/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data.data[0]
}

const deleteSubscription = async (id: string) => {
    await api.delete(`/subscriptions/${id}`)
}

const searchSubscriptions = async (query: string, category?: string) => {
    const response = await api.get<ApiResponse<Subscription>>("/subscriptions/search", {
        params: { q: query, category },
    })
    return response.data.data
}

// Add the API function to fetch franchises after the searchSubscriptions function
const getFranchises = async () => {
    const response = await api.get<{ data: Franchise[] }>("/franchises")
    return response.data.data
}

// Zod Schema for Subscription Type
const subscriptionTypeSchema = z.object({
    title: z.string().min(1, "Title is required"),
    price: z.number().min(0, "Price must be a positive number"),
    withoutDiscountPrice: z.number().min(0, "Without discount price must be a positive number"),
    smallDescription: z.string().max(200, "Small description cannot exceed 200 characters"),
})

// Zod Schema for Subscription
const subscriptionSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    category: z.string().min(1, "Category is required"),
    weightOrCount: z.string().min(1, "Weight or count is required"),
    tag: z.string().min(1, "Tag is required"),
    types: z.array(subscriptionTypeSchema).min(1, "At least one subscription type is required"),
})

type SubscriptionFormData = z.infer<typeof subscriptionSchema>

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

export default function SubscriptionPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [imageFiles, setImageFiles] = useState<Array<{ file: File; preview: string }>>([])
    const [mainImageIndex, setMainImageIndex] = useState<number>(0)
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("")
    const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)
    const [showMobileMenu, setShowMobileMenu] = useState(false)
    const [categories, setCategories] = useState<string[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [subscriptionTypes, setSubscriptionTypes] = useState([
        { title: "", price: 0, withoutDiscountPrice: 0, smallDescription: "" },
    ])

    // Add state for franchises and selected franchises after the other state declarations
    const [franchises, setFranchises] = useState<Franchise[]>([])
    const [selectedFranchiseIds, setSelectedFranchiseIds] = useState<string[]>([])
    const [selectAllFranchises, setSelectAllFranchises] = useState(false)

    // Reference to file input for resetting
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Form for the main subscription
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
        setValue,

    } = useForm<SubscriptionFormData>({
        resolver: zodResolver(subscriptionSchema),
        defaultValues: {
            types: [{ title: "", price: 0, withoutDiscountPrice: 0, smallDescription: "" }],
        },
    })

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const subscriptionsData = await getSubscriptions()
                setSubscriptions(subscriptionsData)

                // Extract unique categories
                const uniqueCategories = Array.from(new Set(subscriptionsData.map((sub) => sub.category)))
                setCategories(uniqueCategories)

                // Fetch franchises
                const franchisesData = await getFranchises()
                setFranchises(franchisesData)
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
            if (!searchQuery && !selectedCategory) {
                const data = await getSubscriptions()
                setSubscriptions(data)
                return
            }

            setIsSearching(true)
            try {
                const data = await searchSubscriptions(searchQuery, selectedCategory || undefined)
                setSubscriptions(data)
            } catch (error) {
                console.error("Failed to search subscriptions:", error)
            } finally {
                setIsSearching(false)
            }
        }

        const debounceTimeout = setTimeout(handleSearch, 300)
        return () => clearTimeout(debounceTimeout)
    }, [searchQuery, selectedCategory])

    const resetFormCompletely = () => {
        reset({
            title: "",
            description: "",
            category: "",
            weightOrCount: "",
            tag: "",
            types: [{ title: "", price: 0, withoutDiscountPrice: 0, smallDescription: "" }],
        })
        setImageFiles([])
        setMainImageIndex(0)
        setEditingSubscription(null)
        setSelectedFranchiseIds([])
        setSelectAllFranchises(false)
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const onSubmit = async (data: SubscriptionFormData) => {
        setIsLoading(true)
        try {
            const formData = new FormData()

            // Append subscription data
            Object.entries(data).forEach(([key, value]) => {
                if (key !== "types" && key !== "image") {
                    formData.append(key, String(value))
                }
            })

            // Append types as JSON
            formData.append("types", JSON.stringify(data.types))

            // Append main image index
            formData.append("mainImageIndex", String(mainImageIndex))

            // Append all images
            if (imageFiles.length > 0) {
                imageFiles.forEach((image) => {
                    formData.append(`images`, image.file)
                })
            }

            // Append franchise IDs
            if (selectAllFranchises) {
                // If "All" is selected, send all franchise IDs
                formData.append("franchiseIds", JSON.stringify(franchises.map((f) => f._id)))
            } else if (selectedFranchiseIds.length > 0) {
                // Otherwise, send selected franchise IDs
                formData.append("franchiseIds", JSON.stringify(selectedFranchiseIds))
            }

            let updatedSubscription: Subscription
            if (editingSubscription) {
                updatedSubscription = await updateSubscription(editingSubscription._id, formData)

                // Update the subscription in the list
                setSubscriptions((prevSubscriptions) =>
                    prevSubscriptions.map((sub) => (sub._id === editingSubscription._id ? updatedSubscription : sub)),
                )
            } else {
                const newSubscription = await createSubscription(formData)

                // Add the new subscription to the list
                setSubscriptions((prevSubscriptions) => [...prevSubscriptions, newSubscription])

                // Update categories if a new category was added
                if (!categories.includes(newSubscription.category)) {
                    setCategories((prevCategories) => [...prevCategories, newSubscription.category])
                }
            }

            // Reset form and state
            resetFormCompletely()

            // Close the form modal
            setShowForm(false)
        } catch (error) {
            console.error("Failed to save subscription:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this subscription?")) {
            setIsLoading(true)
            try {
                await deleteSubscription(id)

                // Remove the deleted subscription from the list
                setSubscriptions((prevSubscriptions) => prevSubscriptions.filter((sub) => sub._id !== id))

                // Refresh categories if needed
                const remainingCategories = Array.from(
                    new Set(subscriptions.filter((sub) => sub._id !== id).map((sub) => sub.category)),
                )
                setCategories(remainingCategories)
            } catch (error) {
                console.error("Failed to delete subscription:", error)
            } finally {
                setIsLoading(false)
            }
        }
    }

    // Update the handleEdit function to properly handle the imageUrl array
    const handleEdit = async (subscription: Subscription) => {
        try {
            // First reset the form to clear any previous data
            resetFormCompletely()

            // Fetch the full subscription details
            const fullSubscription = await getSubscriptionById(subscription._id)

            // Set the editing subscription state
            setEditingSubscription(fullSubscription)

            // Set form values
            setValue("title", fullSubscription.title)
            setValue("description", fullSubscription.description)
            setValue("category", fullSubscription.category)
            setValue("weightOrCount", fullSubscription.weightOrCount)
            setValue("tag", fullSubscription.tag)

            // Set main image index to 0 by default (first image is the main one)
            setMainImageIndex(0)

            // Set franchise selection
            if (fullSubscription.franchiseIds) {
                // Check if all franchises are selected
                const allFranchiseIds = franchises.map((f) => f._id)
                const hasAllFranchises =
                    allFranchiseIds.length > 0 && allFranchiseIds.every((id) => fullSubscription.franchiseIds?.includes(id))

                if (hasAllFranchises) {
                    setSelectAllFranchises(true)
                    setSelectedFranchiseIds([])
                } else {
                    setSelectAllFranchises(false)
                    setSelectedFranchiseIds(fullSubscription.franchiseIds)
                }
            } else {
                setSelectAllFranchises(false)
                setSelectedFranchiseIds([])
            }

            // Ensure types is properly set with all required fields
            if (fullSubscription.types && fullSubscription.types.length > 0) {
                setValue(
                    "types",
                    fullSubscription.types.map((type) => ({
                        title: type.title || "",
                        price: type.price || 0,
                        withoutDiscountPrice: type.withoutDiscountPrice || 0,
                        smallDescription: type.smallDescription || "",
                    })),
                )
            }

            // Open the form modal
            setShowForm(true)
        } catch (error) {
            console.error("Failed to fetch subscription details:", error)
        }
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (files && files.length > 0) {
            const newImageFiles = [...imageFiles]

            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                // Create a new object URL for the preview
                const previewUrl = URL.createObjectURL(file)

                newImageFiles.push({
                    file,
                    preview: previewUrl,
                })
            }

            setImageFiles(newImageFiles)
        }
    }

    const removeImage = (index: number) => {
        const newImageFiles = [...imageFiles]

        // Revoke the object URL to avoid memory leaks 
        URL.revokeObjectURL(newImageFiles[index].preview)

        // Remove the image
        newImageFiles.splice(index, 1)
        setImageFiles(newImageFiles)

        // Update main image index if needed
        if (mainImageIndex >= newImageFiles.length) {
            setMainImageIndex(Math.max(0, newImageFiles.length - 1))
        } else if (index === mainImageIndex && newImageFiles.length > 0) {
            setMainImageIndex(0)
        }
    }

    // Add a function to set the main image
    const setMainImage = (index: number) => {
        setMainImageIndex(index)
    }

    // Clean up object URLs when component unmounts or when imageFiles changes
    useEffect(() => {
        return () => {
            // Clean up all preview URLs when component unmounts
            imageFiles.forEach((image) => {
                URL.revokeObjectURL(image.preview)
            })
        }
    }, [])



    const handleCloseModal = () => {
        setShowForm(false)
        resetFormCompletely()
    }

    const addSubscriptionType = () => {
        setSubscriptionTypes([...subscriptionTypes, { title: "", price: 0, withoutDiscountPrice: 0, smallDescription: "" }])
    }

    const removeSubscriptionType = (index: number) => {
        const newSubscriptionTypes = [...subscriptionTypes]
        newSubscriptionTypes.splice(index, 1)
        setSubscriptionTypes(newSubscriptionTypes)
    }



    // Add a function to handle "Select All" option
    const handleSelectAllFranchises = () => {
        setSelectAllFranchises(!selectAllFranchises)
        setSelectedFranchiseIds([])
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
                        <Package className="w-8 h-8 text-blue-400" />
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Subscriptions</h1>
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
                            Add Subscription
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
                            Add Subscription
                        </button>
                    </div>
                )}
            </header>

            <main className="p-4 sm:p-6 space-y-6">
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search subscriptions..."
                            className="w-full h-12 pl-10 pr-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="h-12 px-6 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {categories.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Subscriptions List/Grid */}
                <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700">
                    {isSearching ? (
                        <LoadingSpinner />
                    ) : subscriptions.length === 0 ? (
                        <EmptyState message="No subscriptions found" />
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden sm:block">
                                <table className="min-w-full divide-y divide-gray-700">
                                    <thead className="bg-gray-900">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Subscription
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Category
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Tag
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Plans
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                                        {subscriptions.map((subscription) => (
                                            <tr key={subscription._id} className="hover:bg-gray-750">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {subscription.imageUrl &&
                                                            Array.isArray(subscription.imageUrl) &&
                                                            subscription.imageUrl.length > 0 ? (
                                                            <img
                                                                src={subscription.imageUrl[0] || "/placeholder.svg"}
                                                                alt={subscription.title}
                                                                className="w-10 h-10 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                                                <Package className="w-5 h-5 text-gray-400" />
                                                            </div>
                                                        )}
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-100">{subscription.title}</div>
                                                            <div className="text-xs text-gray-400">{subscription.weightOrCount}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-300">{subscription.category}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        {subscription.tag}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-300">{subscription.types?.length || 0} plans</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        className="text-blue-400 hover:text-blue-300 mr-4 transition-colors"
                                                        onClick={() => handleEdit(subscription)}
                                                        disabled={isLoading}
                                                    >
                                                        <Pencil className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        className="text-red-400 hover:text-red-300 transition-colors"
                                                        onClick={() => handleDelete(subscription._id)}
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
                                {subscriptions.map((subscription) => (
                                    <div key={subscription._id} className="p-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                {subscription.imageUrl &&
                                                    Array.isArray(subscription.imageUrl) &&
                                                    subscription.imageUrl.length > 0 ? (
                                                    <img
                                                        src={subscription.imageUrl[0] || "/placeholder.svg"}
                                                        alt={subscription.title}
                                                        className="w-12 h-12 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                                                        <Package className="w-6 h-6 text-gray-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-100">{subscription.title}</h3>
                                                    <p className="text-xs text-gray-400">{subscription.category}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <button
                                                    className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                                                    onClick={() => handleEdit(subscription)}
                                                    disabled={isLoading}
                                                    aria-label="Edit subscription"
                                                >
                                                    <Pencil className="w-5 h-5" />
                                                </button>
                                                <button
                                                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                                                    onClick={() => handleDelete(subscription._id)}
                                                    disabled={isLoading}
                                                    aria-label="Delete subscription"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <div>
                                                <span className="text-gray-400">Tag:</span>
                                                <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {subscription.tag}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Plans:</span>
                                                <span className="ml-2 text-gray-100">{subscription.types?.length || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Subscription Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-800">
                        <div className="sticky top-0 bg-gray-900 px-6 py-4 border-b border-gray-800 z-10">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-gray-100">
                                    {editingSubscription ? "Edit Subscription" : "Add New Subscription"}
                                </h2>
                                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-200 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                                    <input
                                        {...register("title")}
                                        className="w-full h-12 px-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {errors.title && <p className="mt-2 text-sm text-red-400">{errors.title.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                                    <div className="relative">
                                        <input
                                            {...register("category")}
                                            list="categories"
                                            className="w-full h-12 px-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Select or type a category"
                                        />
                                        <datalist id="categories">
                                            {categories.map((category) => (
                                                <option key={category} value={category}>
                                                    {category}
                                                </option>
                                            ))}
                                        </datalist>
                                    </div>
                                    {errors.category && <p className="mt-2 text-sm text-red-400">{errors.category.message}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                <textarea
                                    {...register("description")}
                                    className="w-full h-32 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                />
                                {errors.description && <p className="mt-2 text-sm text-red-400">{errors.description.message}</p>}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Weight or Count</label>
                                    <input
                                        {...register("weightOrCount")}
                                        className="w-full h-12 px-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., 500g, 1kg, 5 pieces"
                                    />
                                    {errors.weightOrCount && <p className="mt-2 text-sm text-red-400">{errors.weightOrCount.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Tag</label>
                                    <input
                                        {...register("tag")}
                                        className="w-full h-12 px-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., new, popular, limited"
                                    />
                                    {errors.tag && <p className="mt-2 text-sm text-red-400">{errors.tag.message}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Images</label>
                                <div className="flex items-center space-x-4">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        multiple
                                        className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-gray-900 hover:file:bg-blue-600"
                                    />
                                </div>

                                {/* Image previews */}
                                {imageFiles.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-sm text-gray-300 mb-2">Selected images (click to set as main image):</p>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                            {imageFiles.map((image, index) => (
                                                <div
                                                    key={index}
                                                    className={`relative group ${mainImageIndex === index ? "ring-2 ring-blue-500" : ""}`}
                                                >
                                                    <img
                                                        src={image.preview || "/placeholder.svg"}
                                                        alt={`Preview ${index + 1}`}
                                                        className="h-24 w-full object-cover rounded-lg cursor-pointer"
                                                        onClick={() => setMainImage(index)}
                                                    />
                                                    {mainImageIndex === index && (
                                                        <div className="absolute top-0 left-0 bg-blue-500 text-xs text-white px-2 py-1 rounded-tl-lg rounded-br-lg">
                                                            Main
                                                        </div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(index)}
                                                        className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-gray-900 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Show existing images when editing */}
                                {editingSubscription &&
                                    editingSubscription.imageUrl &&
                                    Array.isArray(editingSubscription.imageUrl) &&
                                    editingSubscription.imageUrl.length > 0 &&
                                    imageFiles.length === 0 && (
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-400 mb-2">Current images:</p>
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                                {editingSubscription.imageUrl.map((imageUrl, index) => (
                                                    <div
                                                        key={index}
                                                        className={`relative ${mainImageIndex === index ? "ring-2 ring-blue-500" : ""}`}
                                                    >
                                                        <img
                                                            src={imageUrl || "/placeholder.svg"}
                                                            alt={`Current ${index + 1}`}
                                                            className="h-24 w-full object-cover rounded-lg cursor-pointer"
                                                            onClick={() => setMainImage(index)}
                                                        />
                                                        {index === 0 && (
                                                            <div className="absolute top-0 left-0 bg-blue-500 text-xs text-white px-2 py-1 rounded-tl-lg rounded-br-lg">
                                                                Main
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Franchises</label>
                                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                                    <div className="flex items-center mb-3">
                                        <input
                                            type="checkbox"
                                            id="select-all-franchises"
                                            checked={selectAllFranchises}
                                            onChange={handleSelectAllFranchises}
                                            className="h-4 w-4 rounded border-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                                        />
                                        <label htmlFor="select-all-franchises" className="ml-2 text-sm text-gray-300">
                                            Select All Franchises
                                        </label>
                                    </div>

                                    {franchises.length === 0 ? (
                                        <p className="text-sm text-gray-400">No franchises available</p>
                                    ) : (
                                        <div className="relative">
                                            <select
                                                multiple
                                                className="w-full h-60 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                value={selectedFranchiseIds}
                                                onChange={(e) => {
                                                    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value)
                                                    setSelectAllFranchises(false)
                                                    setSelectedFranchiseIds(selectedOptions)
                                                }}
                                                disabled={selectAllFranchises}
                                            >
                                                {franchises.map((franchise) => (
                                                    <option key={franchise._id} value={franchise._id}>
                                                        {franchise.name} - {franchise.cityName}, {franchise.branchName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="mt-3 text-sm text-gray-400">
                                        {selectAllFranchises
                                            ? "All franchises will be selected"
                                            : `Selected ${selectedFranchiseIds.length} franchise${selectedFranchiseIds.length !== 1 ? "s" : ""}`}
                                    </div>

                                    {selectedFranchiseIds.length > 0 && !selectAllFranchises && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {selectedFranchiseIds.map((id) => {
                                                const franchise = franchises.find((f) => f._id === id)
                                                return franchise ? (
                                                    <div
                                                        key={id}
                                                        className="bg-gray-700 text-gray-200 px-2 py-1 rounded-md text-sm flex items-center"
                                                    >
                                                        {franchise.name}
                                                        <button
                                                            type="button"
                                                            className="ml-2 text-gray-400 hover:text-gray-200"
                                                            onClick={() => setSelectedFranchiseIds((prev) => prev.filter((fId) => fId !== id))}
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ) : null
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Subscription Types Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium text-gray-200">Subscription Plans</h3>
                                    <button
                                        type="button"
                                        onClick={addSubscriptionType}
                                        className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-blue-400 hover:bg-blue-500 transition-colors"
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add Plan
                                    </button>
                                </div>

                                {errors.types && <p className="text-sm text-red-400">{errors.types.message}</p>}

                                <div className="space-y-6">
                                    {subscriptionTypes.map((_, index) => (
                                        <div key={index} className="p-4 border border-gray-700 rounded-lg space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-sm font-medium text-gray-300">Plan {index + 1}</h4>
                                                {subscriptionTypes.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSubscriptionType(index)}
                                                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">Month</label>
                                                <input
                                                    {...register(`types.${index}.title`)}
                                                    className="w-full h-10 px-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="e.g., 1, 3, 6, 12"
                                                />
                                                {errors.types?.[index]?.title && (
                                                    <p className="mt-1 text-xs text-red-400">{errors.types[index]?.title?.message}</p>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">Price</label>
                                                    <div className="relative">
                                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        <input
                                                            type="number"
                                                            step="1"
                                                            {...register(`types.${index}.price`, { valueAsNumber: true })}
                                                            className="w-full h-10 pl-9 px-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                    </div>
                                                    {errors.types?.[index]?.price && (
                                                        <p className="mt-1 text-xs text-red-400">{errors.types[index]?.price?.message}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">Without Discount Price</label>
                                                    <div className="relative">
                                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            {...register(`types.${index}.withoutDiscountPrice`, { valueAsNumber: true })}
                                                            className="w-full h-10 pl-9 px-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                    </div>
                                                    {errors.types?.[index]?.withoutDiscountPrice && (
                                                        <p className="mt-1 text-xs text-red-400">
                                                            {errors.types[index]?.withoutDiscountPrice?.message}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">Small Description</label>
                                                <textarea
                                                    {...register(`types.${index}.smallDescription`)}
                                                    className="w-full h-20 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                                    placeholder="Brief description of this subscription plan"
                                                />
                                                {errors.types?.[index]?.smallDescription && (
                                                    <p className="mt-1 text-xs text-red-400">{errors.types[index]?.smallDescription?.message}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
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
                                        "Save Subscription"
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

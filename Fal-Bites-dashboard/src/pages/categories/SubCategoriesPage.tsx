"use client"

import { useEffect, useState } from "react"
import type React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import axios from "axios"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Tags, Plus, Pencil, Trash2, X, Loader2, Upload, AlertCircle } from "lucide-react"

const subCategorySchema = z.object({
    title: z.string().min(1, "Title is required").max(100),
    topCategory: z.string().min(1, "Top Category is required"),
    image: z.any().optional(),
})

type SubCategoryFormData = z.infer<typeof subCategorySchema>

type TopCategory = {
    _id: string
    title: string
    category?: {
        _id: string
        title: string
    } | null
    createdAt?: string
    updatedAt?: string
}

type SubCategory = {
    _id: string
    title: string
    image?: string
    topCategory: {
        _id: string
        title: string
    } | null
    createdAt?: string
    updatedAt?: string
}

export default function SubCategoriesPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [topCategories, setTopCategories] = useState<TopCategory[]>([])
    const [subCategories, setSubCategories] = useState<SubCategory[]>([])
    const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isTopCategoriesLoading, setIsTopCategoriesLoading] = useState(false)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<SubCategoryFormData>({
        resolver: zodResolver(subCategorySchema),
    })

    useEffect(() => {
        fetchTopCategories()
        fetchSubCategories()
    }, [])

    useEffect(() => {
        // Set preview URL when editing a sub category with an existing image
        if (editingSubCategory?.image && !selectedFile) {
            setPreviewUrl(editingSubCategory.image)
        }
        // Clean up preview URL when component unmounts
        return () => {
            if (previewUrl && selectedFile) {
                URL.revokeObjectURL(previewUrl)
            }
        }
    }, [editingSubCategory, selectedFile, previewUrl])

    const fetchTopCategories = async () => {
        setIsTopCategoriesLoading(true)
        setError(null)
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/top-categories`)
            const data = response.data?.data || []

            // Filter out any invalid entries and ensure we have valid top categories
            const validTopCategories = data.filter(
                (item: any) => item && item._id && item.title && typeof item._id === "string" && typeof item.title === "string",
            )

            setTopCategories(validTopCategories)

            if (validTopCategories.length === 0) {
                setError("No valid top categories found. Please create some top categories first.")
            }
        } catch (error) {
            console.error("Failed to fetch top categories:", error)
            setError("Failed to load top categories. Please try again.")
            setTopCategories([])
        } finally {
            setIsTopCategoriesLoading(false)
        }
    }

    const fetchSubCategories = async () => {
        setIsFetching(true)
        setError(null)
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/sub-categories`)
            const data = response.data?.data || []

            // Filter out any invalid entries
            const validSubCategories = data.filter(
                (item: any) => item && item._id && item.title && typeof item._id === "string" && typeof item.title === "string",
            )

            setSubCategories(validSubCategories)
        } catch (error) {
            console.error("Failed to fetch sub categories:", error)
            setError("Failed to load sub categories. Please try again.")
            setSubCategories([])
        } finally {
            setIsFetching(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file type
            if (!file.type.startsWith("image/")) {
                setError("Please select a valid image file.")
                return
            }

            // Validate file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                setError("File size must be less than 10MB.")
                return
            }

            setSelectedFile(file)
            setError(null)

            // Clean up previous preview URL
            if (previewUrl && selectedFile) {
                URL.revokeObjectURL(previewUrl)
            }

            // Create preview URL for the selected image
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
        }
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()

        const file = e.dataTransfer.files?.[0]
        if (file) {
            if (!file.type.startsWith("image/")) {
                setError("Please select a valid image file.")
                return
            }

            if (file.size > 10 * 1024 * 1024) {
                setError("File size must be less than 10MB.")
                return
            }

            setSelectedFile(file)
            setError(null)

            // Clean up previous preview URL
            if (previewUrl && selectedFile) {
                URL.revokeObjectURL(previewUrl)
            }

            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
        }
    }

    const closeModal = () => {
        setShowForm(false)
        setSelectedFile(null)

        // Clean up preview URL
        if (previewUrl && selectedFile) {
            URL.revokeObjectURL(previewUrl)
        }

        setPreviewUrl(null)
        reset()
        setEditingSubCategory(null)
        setError(null)
    }

    const onSubmit = async (data: SubCategoryFormData) => {
        if (topCategories.length === 0) {
            setError("No top categories available. Please create some top categories first.")
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append("title", data.title.trim())
            formData.append("topCategory", data.topCategory)

            if (selectedFile) {
                formData.append("image", selectedFile)
            }

            const url = editingSubCategory
                ? `${import.meta.env.VITE_API_URL}/sub-categories/${editingSubCategory._id}`
                : `${import.meta.env.VITE_API_URL}/sub-categories`

            const method = editingSubCategory ? axios.put : axios.post

            const response = await method(url, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })

            if (response.data?.success) {
                await fetchSubCategories()
                closeModal()
            } else {
                throw new Error(response.data?.message || "Failed to save sub category")
            }
        } catch (error: any) {
            console.error("Error saving sub category:", error)
            const errorMessage =
                error.response?.data?.message || error.message || "Failed to save sub category. Please try again."
            setError(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this sub category?")) {
            return
        }

        setError(null)
        try {
            const response = await axios.delete(`${import.meta.env.VITE_API_URL}/sub-categories/${id}`)

            if (response.data?.success) {
                setSubCategories(subCategories.filter((subCategory) => subCategory._id !== id))
            } else {
                throw new Error(response.data?.message || "Failed to delete sub category")
            }
        } catch (error: any) {
            console.error("Error deleting sub category:", error)
            const errorMessage =
                error.response?.data?.message || error.message || "Failed to delete sub category. Please try again."
            setError(errorMessage)
        }
    }

    const handleEdit = (subCategory: SubCategory) => {
        setEditingSubCategory(subCategory)
        setError(null)

        reset({
            title: subCategory.title,
            topCategory: subCategory.topCategory?._id || "",
        })

        if (subCategory.image) {
            setPreviewUrl(subCategory.image)
        } else {
            setPreviewUrl(null)
        }

        setSelectedFile(null)
        setShowForm(true)
    }

    // Helper function to get top category name
    // const getTopCategoryName = (topCategoryId: string | undefined): string => {
    //     if (!topCategoryId) return "No top category"
    //     const topCategory = topCategories.find((cat) => cat._id === topCategoryId)
    //     return topCategory ? topCategory.title : "Unknown top category"
    // }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Error Banner */}
                {error && (
                    <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                            <span className="text-red-800 dark:text-red-200">{error}</span>
                            <button
                                onClick={() => setError(null)}
                                className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                        <Tags className="h-8 w-8 text-blue-600" />
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sub Categories</h1>
                    </div>
                    <Button
                        onClick={() => setShowForm(true)}
                        disabled={topCategories.length === 0}
                        className="flex items-center space-x-2"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add Sub Category</span>
                    </Button>
                </div>

                {showForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    {editingSubCategory ? "Edit" : "Add"} Sub Category
                                </h2>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    disabled={isLoading}
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Sub Category Title
                                    </label>
                                    <Input
                                        {...register("title")}
                                        placeholder="Enter sub category title"
                                        className="w-full"
                                        disabled={isLoading}
                                    />
                                    {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Select Top Category
                                    </label>
                                    {isTopCategoriesLoading ? (
                                        <div className="flex items-center justify-center py-4">
                                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading top categories...</span>
                                        </div>
                                    ) : topCategories.length === 0 ? (
                                        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                            <p className="text-sm">No top categories available.</p>
                                            <p className="text-xs">Please create some top categories first.</p>
                                        </div>
                                    ) : (
                                        <select
                                            {...register("topCategory")}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            disabled={isLoading}
                                        >
                                            <option value="">Select a top category</option>
                                            {topCategories.map((topCategory) => (
                                                <option key={topCategory._id} value={topCategory._id}>
                                                    {topCategory.title}
                                                    {topCategory.category?.title ? ` (${topCategory.category.title})` : ""}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    {errors.topCategory && <p className="mt-1 text-sm text-red-600">{errors.topCategory.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Sub Category Image
                                    </label>
                                    <div
                                        className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors cursor-pointer"
                                        onDragOver={handleDragOver}
                                        onDrop={handleDrop}
                                        onClick={() => !isLoading && document.getElementById("file-upload")?.click()}
                                    >
                                        {previewUrl ? (
                                            <div className="space-y-2 text-center">
                                                <img
                                                    src={previewUrl || "/placeholder.svg"}
                                                    alt="Preview"
                                                    className="mx-auto h-32 w-32 object-cover rounded-md"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement
                                                        target.src = "/placeholder.svg"
                                                    }}
                                                />
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    <p className="font-medium">Click or drag to change image</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2 text-center">
                                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    <p className="font-medium">Drag and drop your image here, or click to select</p>
                                                    <p className="text-xs">PNG, JPG up to 10MB</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="flex space-x-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={closeModal}
                                        className="flex-1 bg-transparent"
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isLoading || topCategories.length === 0} className="flex-1">
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                Saving...
                                            </>
                                        ) : editingSubCategory ? (
                                            "Update Sub Category"
                                        ) : (
                                            "Create Sub Category"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isFetching ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading sub categories...</span>
                    </div>
                ) : subCategories.length === 0 ? (
                    <div className="text-center py-12">
                        <Tags className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No Sub Categories Found</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {topCategories.length === 0
                                ? "Create some top categories first, then add sub categories."
                                : "Get started by creating your first sub category."}
                        </p>
                        {topCategories.length > 0 && (
                            <Button onClick={() => setShowForm(true)} className="mt-4 flex items-center space-x-2">
                                <Plus className="h-4 w-4" />
                                <span>Add Sub Category</span>
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {subCategories.map((subCategory) => (
                            <div
                                key={subCategory._id}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                            >
                                <div className="aspect-w-16 aspect-h-9">
                                    {subCategory.image ? (
                                        <img
                                            src={subCategory.image || "/placeholder.svg"}
                                            alt={subCategory.title}
                                            className="w-full h-48 object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement
                                                target.src = "/placeholder.svg"
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                            <Tags className="h-12 w-12 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                                {subCategory.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                Top Category: {subCategory.topCategory ? subCategory.topCategory.title : "No top category"}
                                            </p>
                                        </div>
                                        <div className="flex space-x-2 ml-2">
                                            <button
                                                onClick={() => handleEdit(subCategory)}
                                                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                title="Edit sub category"
                                            >
                                                <Pencil className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(subCategory._id)}
                                                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                title="Delete sub category"
                                            >
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

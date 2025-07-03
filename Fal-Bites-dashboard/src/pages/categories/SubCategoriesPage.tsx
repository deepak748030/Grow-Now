"use client"
import { useEffect, useState } from "react"
import type React from "react"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import axios from "axios"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Tags, Plus, Pencil, Trash2, X, Loader2, Upload } from "lucide-react"

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
    }
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
    }
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
    }, [editingSubCategory, selectedFile])

    const fetchTopCategories = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/top-categories`)
            const data = response.data?.data || []
            // Filter out any invalid entries
            const validTopCategories = data.filter((item: any) => item && item._id && item.title)
            setTopCategories(validTopCategories)
        } catch (error) {
            console.error("Failed to fetch top categories:", error)
            setTopCategories([]) // Set empty array on error
        }
    }

    const fetchSubCategories = async () => {
        setIsFetching(true)
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/sub-categories`)
            setSubCategories(response.data?.data || [])
        } catch (error) {
            console.error("Failed to fetch sub categories:", error)
        } finally {
            setIsFetching(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
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
        if (file && file.type.startsWith("image/")) {
            setSelectedFile(file)
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
        }
    }

    const closeModal = () => {
        setShowForm(false)
        setSelectedFile(null)
        setPreviewUrl(null)
        reset()
        setEditingSubCategory(null)
    }

    const onSubmit = async (data: SubCategoryFormData) => {
        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append("title", data.title)
            formData.append("topCategory", data.topCategory)
            if (selectedFile) formData.append("image", selectedFile)

            const url = editingSubCategory
                ? `${import.meta.env.VITE_API_URL}/sub-categories/${editingSubCategory._id}`
                : `${import.meta.env.VITE_API_URL}/sub-categories`

            const method = editingSubCategory ? axios.put : axios.post
            await method(url, formData)

            fetchSubCategories()
            closeModal()
        } catch (error) {
            console.error("Error saving sub category:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/sub-categories/${id}`)
            setSubCategories(subCategories.filter((subCategory) => subCategory._id !== id))
        } catch (error) {
            console.error("Error deleting sub category:", error)
        }
    }

    const handleEdit = (subCategory: SubCategory) => {
        setEditingSubCategory(subCategory)
        reset({
            title: subCategory.title,
            topCategory: subCategory.topCategory._id,
        })
        if (subCategory.image) {
            setPreviewUrl(subCategory.image)
        } else {
            setPreviewUrl(null)
        }
        setSelectedFile(null)
        setShowForm(true)
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                        <Tags className="h-8 w-8 text-blue-600" />
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sub Categories</h1>
                    </div>
                    <Button onClick={() => setShowForm(true)} icon={<Plus />}>
                        Add Sub Category
                    </Button>
                </div>

                {showForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    {editingSubCategory ? "Edit" : "Add"} Sub Category
                                </h2>
                                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Sub Category Title
                                    </label>
                                    <Input {...register("title")} placeholder="Enter sub category title" className="w-full" />
                                    {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Select Top Category
                                    </label>
                                    <select
                                        {...register("topCategory")}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        <option value="">Select a top category</option>
                                        {topCategories
                                            .filter((topCategory) => topCategory && topCategory._id && topCategory.title)
                                            .map((topCategory) => (
                                                <option key={topCategory._id} value={topCategory._id}>
                                                    {topCategory.title} {topCategory.category?.title ? `(${topCategory.category.title})` : ""}
                                                </option>
                                            ))}
                                    </select>
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
                                        onClick={() => document.getElementById("file-upload")?.click()}
                                    >
                                        {previewUrl ? (
                                            <div className="space-y-2 text-center">
                                                <img
                                                    src={previewUrl || "/placeholder.svg"}
                                                    alt="Preview"
                                                    className="mx-auto h-32 w-32 object-cover rounded-md"
                                                />
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    <p className="font-medium">Click or drag to change image</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="space-y-2 text-center">
                                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                        <p className="font-medium">Drag and drop your image here, or click to select</p>
                                                        <p className="text-xs">PNG, JPG up to 10MB</p>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </div>

                                <div className="flex space-x-3 pt-4">
                                    <Button type="button" variant="outline" onClick={closeModal} className="flex-1 bg-transparent">
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isLoading} className="flex-1">
                                        {isLoading ? "Saving..." : editingSubCategory ? "Update Sub Category" : "Create Sub Category"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isFetching ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : subCategories.length === 0 ? (
                    <div className="text-center py-12">
                        <Tags className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No Sub Categories Found</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Get started by creating your first sub category.
                        </p>
                        <Button onClick={() => setShowForm(true)} icon={<Plus />} className="mt-4">
                            Add Sub Category
                        </Button>
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
                                        />
                                    ) : (
                                        <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                            <Tags className="h-12 w-12 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{subCategory.title}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Top Category: {subCategory.topCategory.title}
                                            </p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleEdit(subCategory)}
                                                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <Pencil className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(subCategory._id)}
                                                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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

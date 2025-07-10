"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import axios from "axios"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Tags, Plus, Pencil, Trash2, X, Loader2 } from "lucide-react"

const topCategorySchema = z.object({
    title: z.string().min(1, "Title is required").max(100),
    category: z.string().optional(),
})

type TopCategoryFormData = z.infer<typeof topCategorySchema>

type Category = {
    _id: string
    title: string
    image?: string
}

type TopCategory = {
    _id: string
    title: string
    category: {
        _id: string
        title: string
        image?: string
    } | null
}

export default function TopCategoriesPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [topCategories, setTopCategories] = useState<TopCategory[]>([])
    const [editingTopCategory, setEditingTopCategory] = useState<TopCategory | null>(null)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<TopCategoryFormData>({
        resolver: zodResolver(topCategorySchema),
    })

    useEffect(() => {
        fetchCategories()
        fetchTopCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/categories`)
            setCategories(response.data?.data || [])
        } catch (error) {
            console.error("Failed to fetch categories:", error)
        }
    }

    const fetchTopCategories = async () => {
        setIsFetching(true)
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/top-categories`)
            setTopCategories(response.data?.data || [])
        } catch (error) {
            console.error("Failed to fetch top categories:", error)
        } finally {
            setIsFetching(false)
        }
    }

    const closeModal = () => {
        setShowForm(false)
        reset()
        setEditingTopCategory(null)
    }

    const onSubmit = async (data: TopCategoryFormData) => {
        setIsLoading(true)
        try {
            const payload = {
                title: data.title,
                category: data.category || null,
            }

            const url = editingTopCategory
                ? `${import.meta.env.VITE_API_URL}/top-categories/${editingTopCategory._id}`
                : `${import.meta.env.VITE_API_URL}/top-categories`

            const method = editingTopCategory ? axios.put : axios.post
            await method(url, payload)
            fetchTopCategories()
            closeModal()
        } catch (error) {
            console.error("Error saving top category:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this top category?")) {
            return
        }

        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/top-categories/${id}`)
            setTopCategories(topCategories.filter((topCategory) => topCategory._id !== id))
        } catch (error) {
            console.error("Error deleting top category:", error)
        }
    }

    const handleEdit = (topCategory: TopCategory) => {
        setEditingTopCategory(topCategory)
        reset({
            title: topCategory.title,
            category: topCategory.category?._id || "",
        })
        setShowForm(true)
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                        <Tags className="h-8 w-8 text-blue-600" />
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Top Categories</h1>
                    </div>
                    <Button onClick={() => setShowForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Top Category
                    </Button>
                </div>

                {showForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    {editingTopCategory ? "Edit" : "Add"} Top Category
                                </h2>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Top Category Title
                                    </label>
                                    <Input {...register("title")} placeholder="Enter top category title" className="w-full" />
                                    {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Select Category (Optional)
                                    </label>
                                    <select
                                        {...register("category")}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        <option value="">No category selected</option>
                                        {categories.map((category) => (
                                            <option key={category._id} value={category._id}>
                                                {category.title}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
                                </div>
                                <div className="flex space-x-3 pt-4">
                                    <Button type="button" variant="outline" onClick={closeModal} className="flex-1 bg-transparent">
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isLoading} className="flex-1">
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : editingTopCategory ? (
                                            "Update Top Category"
                                        ) : (
                                            "Create Top Category"
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
                        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading top categories...</span>
                    </div>
                ) : topCategories.length === 0 ? (
                    <div className="text-center py-12">
                        <Tags className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No Top Categories Found</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Get started by creating your first top category.
                        </p>
                        <Button onClick={() => setShowForm(true)} className="mt-4">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Top Category
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {topCategories.map((topCategory) => (
                            <div
                                key={topCategory._id}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                            >
                                <div className="aspect-w-16 aspect-h-9">
                                    {topCategory.category?.image ? (
                                        <img
                                            src={`${import.meta.env.VITE_API_URL}/${topCategory.category.image}`}
                                            alt={topCategory.category.title}
                                            className="w-full h-48 object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                                            <Tags className="h-12 w-12 text-blue-500 dark:text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                                {topCategory.title}
                                            </h3>
                                            <div className="mt-1">
                                                {topCategory.category ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                        {topCategory.category.title}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                        No category
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex space-x-2 ml-2">
                                            <button
                                                onClick={() => handleEdit(topCategory)}
                                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                title="Edit top category"
                                            >
                                                <Pencil className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(topCategory._id)}
                                                className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                title="Delete top category"
                                            >
                                                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
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

"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import axios from "axios"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Tags, Plus, Pencil, Trash2, X, Loader2, Upload } from "lucide-react"

// Define the schema for form validation
const itemSchema = z.object({
    title: z.string().min(1, "Title is required").max(100, "Title cannot exceed 100 characters"),
    image: z.any().optional(),
    types: z.enum(["product", "subscription"]),
    productId: z.string().optional(),
    category: z.string().optional(),
})

type ItemFormData = z.infer<typeof itemSchema>

// Define types for our data structures image
type Product = {
    _id: string
    title: string
    description: string
    category: string
    imageUrl?: string
    types: Array<{
        _id: string
        title: string
        price: number
        withoutDiscountPrice: number
        smallDescription: string
    }>
}

type Item = {
    _id: string
    title: string
    image?: string
    types: "product" | "subscription"
    productId?: string
    category?: string
}

export default function CategoryChoice() {
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [items, setItems] = useState<Item[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [editingItem, setEditingItem] = useState<Item | null>(null)

    const apiUrl = import.meta.env.VITE_API_URL
    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<ItemFormData>({
        resolver: zodResolver(itemSchema),
        defaultValues: {
            types: "product",
        },
    })

    // Watch the types field to conditionally render form elements
    const selectedType = watch("types")

    useEffect(() => {
        fetchItems()
        fetchProducts()
    }, [])

    useEffect(() => {
        // Set preview URL when editing an item with an existing image
        if (editingItem?.image && !selectedFile) {
            setPreviewUrl(editingItem.image ? editingItem.image : `${editingItem.image}`)
        }

        // Clean up preview URL when component unmounts
        return () => {
            if (previewUrl && selectedFile) {
                URL.revokeObjectURL(previewUrl)
            }
        }
    }, [editingItem, selectedFile])

    const fetchItems = async () => {
        setIsFetching(true)
        try {
            const response = await axios.get(`${apiUrl}/category-choices`)
            setItems(response.data?.data || [])
        } catch (error) {
            console.error("Failed to fetch items:", error)
        } finally {
            setIsFetching(false)
        }
    }

    const fetchProducts = async () => {
        try {
            const response = await axios.get(`${apiUrl}/products`)
            setProducts(response.data?.data || [])
        } catch (error) {
            console.error("Failed to fetch products:", error)
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
        setEditingItem(null)
    }

    const onSubmit = async (data: ItemFormData) => {
        setIsLoading(true)
        try {
            // Only allow updates, not new items
            if (!editingItem) {
                alert("Adding new items is not allowed")
                setIsLoading(false)
                return
            }

            const formData = new FormData()
            formData.append("title", data.title)
            formData.append("types", data.types)

            if (data.types === "product" && data.productId) {
                formData.append("productId", data.productId)
            }

            if (data.types === "subscription" && data.category) {
                formData.append("category", data.category)
            }

            if (selectedFile) {
                formData.append("image", selectedFile)
            }

            const url = `${apiUrl}/category-choices/${editingItem._id}`

            await axios.put(url, formData)
            fetchItems()
            closeModal()
        } catch (error) {
            console.error("Error saving item:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        alert("Deleting items is not allowed")
        return
    }

    const handleEdit = (item: Item) => {
        setEditingItem(item)
        reset({
            title: item.title,
            types: item.types,
            productId: item.productId,
            category: item.category,
        })

        if (item.image) {
            setPreviewUrl(item.image.startsWith("http") ? item.image : `${apiUrl}/${item.image}`)
        } else {
            setPreviewUrl(null)
        }

        setSelectedFile(null)
        setShowForm(true)
    }

    const getProductTitle = (productId: string) => {
        const product = products.find((p) => p._id === productId)
        return product ? product.title : "Unknown Product"
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Tags className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products & Subscriptions</h1>
                </div>
                <Button onClick={() => setShowForm(true)} disabled>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                </Button>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                                {editingItem ? "Edit" : "Add"} Item
                            </h2>
                            <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Title</label>
                                <Input {...register("title")} placeholder="Enter title" className="w-full" />
                                {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Type</label>
                                <div className="flex space-x-4">
                                    <div className="flex items-center">
                                        <input type="radio" id="product" value="product" {...register("types")} className="mr-2" />
                                        <label htmlFor="product" className="text-sm text-gray-700 dark:text-gray-200">
                                            Product
                                        </label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="radio"
                                            id="subscription"
                                            value="subscription"
                                            {...register("types")}
                                            className="mr-2"
                                        />
                                        <label htmlFor="subscription" className="text-sm text-gray-700 dark:text-gray-200">
                                            Subscription
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {selectedType === "product" && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Select Product</label>
                                    <select
                                        {...register("productId")}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                    >
                                        <option value="">Select a product</option>
                                        {products.map((product) => (
                                            <option key={product._id} value={product._id}>
                                                {product.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {selectedType === "subscription" && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Category</label>
                                    <Input {...register("category")} placeholder="Enter category" className="w-full" />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Image</label>
                                <div
                                    className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${previewUrl
                                        ? "border-green-500 bg-green-50 dark:bg-green-900/10"
                                        : "border-gray-300 hover:border-gray-400"
                                        }`}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />

                                    <div className="flex flex-col items-center justify-center space-y-4">
                                        {previewUrl ? (
                                            <div className="relative group">
                                                <img
                                                    src={previewUrl || "/placeholder.svg"}
                                                    alt="Preview"
                                                    className="w-full h-48 object-cover rounded-lg"
                                                />
                                                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                                    <p className="text-white text-sm">Click or drag to change image</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-900/20">
                                                    <Upload className="w-8 h-8 text-blue-500" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                                        Drag and drop your image here, or click to select
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-4 mt-8">
                                <Button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" className="px-4 py-2 bg-blue-600 text-white">
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>{editingItem ? "Update" : "Create"}</>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isFetching ? (
                <div className="flex items-center justify-center min-h-[200px]">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[200px] bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
                    <Tags className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Items Found</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-center mb-4">Get started by creating your first item.</p>
                    <Button onClick={() => setShowForm(true)} disabled>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item) => (
                        <div key={item._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden group">
                            <div className="relative">
                                <img
                                    src={
                                        item.image
                                            ? item.image.startsWith("http")
                                                ? item.image
                                                : `${item.image}`
                                            : "/placeholder.svg?height=200&width=400"
                                    }
                                    alt={item.title}
                                    className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute top-2 right-2">
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.types === "product"
                                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                            : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                                            }`}
                                    >
                                        {item.types}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                                        {item.types === "product" && item.productId && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Product: {getProductTitle(item.productId)}
                                            </p>
                                        )}
                                        {item.types === "subscription" && item.category && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Category: {item.category}</p>
                                        )}
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <Pencil className="w-4 h-4 text-blue-600" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete()}
                                            disabled={true}
                                            className="p-1 rounded-full transition-colors cursor-not-allowed opacity-50"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

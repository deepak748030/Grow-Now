"use client"
import React, { useState, useEffect, useRef, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import axios from "axios"
import {
    Package,
    Plus,
    Pencil,
    Trash2,
    X,
    Search,
    Loader2,
    AlertCircle,
    CheckCircle
} from "lucide-react"

// Types
interface Brand {
    _id: string
    title: string
    image: string
    createdAt: string
    updatedAt: string
}

interface ApiResponse {
    success: boolean
    data?: Brand[]
    message?: string
    error?: string
    pagination?: {
        current: number
        pages: number
        total: number
    }
}

// Validation Schema
const brandSchema = z.object({
    title: z.string()
        .min(1, 'Brand title is required')
        .max(100, 'Brand title cannot exceed 100 characters')
        .trim(),
    image: z.any().optional()
})

type BrandFormData = z.infer<typeof brandSchema>

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const BrandPage: React.FC = () => {
    // State Management
    const [brands, setBrands] = useState<Brand[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
    const [notification, setNotification] = useState<{
        type: 'success' | 'error'
        message: string
    } | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
    const [hasMore, setHasMore] = useState(true)
    const [page, setPage] = useState(1)
    const [loadingMore, setLoadingMore] = useState(false)

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null)
    const observerRef = useRef<IntersectionObserver | null>(null)

    // Form Setup
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors }
    } = useForm<BrandFormData>({
        resolver: zodResolver(brandSchema)
    })

    const watchedImage = watch('image')

    // API Functions
    const fetchBrands = async (searchQuery?: string, pageNum = 1, append = false) => {
        try {
            if (!append) setLoading(true)
            else setLoadingMore(true)

            const params: any = { page: pageNum, limit: 20 }
            if (searchQuery) params.search = searchQuery

            const response = await axios.get<ApiResponse>(`${API_BASE_URL}/brand`, { params })

            if (response.data.success && Array.isArray(response.data.data)) {
                if (append) {
                    setBrands(prev => [...prev, ...response.data.data!])
                } else {
                    setBrands(response.data.data)
                }

                // Check if there are more pages
                if (response.data.pagination) {
                    setHasMore(pageNum < response.data.pagination.pages)
                } else {
                    setHasMore(response.data.data.length === 20)
                }
            }
        } catch (error) {
            showNotification('error', 'Failed to fetch brands')
            console.error('Fetch brands error:', error)
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    const createBrand = async (data: BrandFormData) => {
        const formData = new FormData()
        formData.append('title', data.title)

        if (data.image && data.image[0]) {
            formData.append('image', data.image[0])
        }

        const response = await axios.post<ApiResponse>(`${API_BASE_URL}/brand`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })

        return response.data
    }

    const updateBrand = async (id: string, data: BrandFormData) => {
        const formData = new FormData()
        formData.append('title', data.title)

        if (data.image && data.image[0]) {
            formData.append('image', data.image[0])
        }

        const response = await axios.patch<ApiResponse>(`${API_BASE_URL}/brand/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })

        return response.data
    }

    const deleteBrand = async (id: string) => {
        const response = await axios.delete<ApiResponse>(`${API_BASE_URL}/brand/${id}`)
        return response.data
    }

    // Utility Functions
    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message })
        setTimeout(() => setNotification(null), 5000)
    }

    const resetForm = () => {
        reset()
        setImagePreview(null)
        setEditingBrand(null)
    }

    const openModal = (brand?: Brand) => {
        if (brand) {
            setEditingBrand(brand)
            setValue('title', brand.title)
            setImagePreview(brand.image)
        } else {
            resetForm()
        }
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        resetForm()
    }

    // Event Handlers
    const onSubmit = async (data: BrandFormData) => {
        try {
            setSubmitting(true)

            if (editingBrand) {
                const result = await updateBrand(editingBrand._id, data)
                if (result.success) {
                    showNotification('success', 'Brand updated successfully')
                    // Refresh the list
                    setBrands([])
                    setPage(1)
                    setHasMore(true)
                    fetchBrands(searchTerm, 1, false)
                    closeModal()
                }
            } else {
                if (!data.image || !data.image[0]) {
                    showNotification('error', 'Please select an image')
                    return
                }

                const result = await createBrand(data)
                if (result.success) {
                    showNotification('success', 'Brand created successfully')
                    // Refresh the list
                    setBrands([])
                    setPage(1)
                    setHasMore(true)
                    fetchBrands(searchTerm, 1, false)
                    closeModal()
                }
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'An error occurred'
            showNotification('error', errorMessage)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            const result = await deleteBrand(id)
            if (result.success) {
                showNotification('success', 'Brand deleted successfully')
                setBrands(prev => prev.filter(brand => brand._id !== id))
                setDeleteConfirm(null)
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Failed to delete brand'
            showNotification('error', errorMessage)
        }
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSearch = useCallback((query: string) => {
        setSearchTerm(query)
        setBrands([])
        setPage(1)
        setHasMore(true)
        fetchBrands(query, 1, false)
    }, [])

    // Infinite Scroll Setup
    const lastBrandElementCallback = useCallback((node: HTMLDivElement | null) => {
        if (loading || loadingMore) return
        if (observerRef.current) observerRef.current.disconnect()

        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                const nextPage = page + 1
                setPage(nextPage)
                fetchBrands(searchTerm, nextPage, true)
            }
        })

        if (node) observerRef.current.observe(node)
    }, [loading, loadingMore, hasMore, page, searchTerm])

    // Effects
    useEffect(() => {
        fetchBrands()
    }, [])

    useEffect(() => {
        if (watchedImage && watchedImage[0]) {
            handleImageChange({ target: { files: [watchedImage[0]] } } as any)
        }
    }, [watchedImage])

    // Search debounce effect
    useEffect(() => {
        const debounceTimeout = setTimeout(() => {
            if (searchTerm !== '') {
                handleSearch(searchTerm)
            }
        }, 300)

        return () => clearTimeout(debounceTimeout)
    }, [searchTerm, handleSearch])

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-2 ${notification.type === 'success'
                    ? 'bg-green-600 text-white'
                    : 'bg-red-600 text-white'
                    }`}>
                    {notification.type === 'success' ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    <span>{notification.message}</span>
                    <button
                        onClick={() => setNotification(null)}
                        className="ml-2 hover:opacity-80"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Header */}
            <header className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Package className="w-8 h-8 text-blue-400" />
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Brand Management</h1>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-blue-400 hover:bg-blue-500 transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Brand
                    </button>
                </div>
            </header>

            <main className="p-4 sm:p-6 space-y-6">
                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search brands..."
                        className="w-full h-12 pl-10 pr-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Brands Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {brands.map((brand, index) => (
                        <div
                            key={brand._id}
                            ref={index === brands.length - 1 ? lastBrandElementCallback : null}
                            className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden group"
                        >
                            <div className="aspect-square relative overflow-hidden bg-gray-700">
                                <img
                                    src={brand.image}
                                    alt={brand.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/placeholder.svg'
                                    }}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                                    <button
                                        onClick={() => openModal(brand)}
                                        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(brand._id)}
                                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="text-lg font-semibold text-gray-100 truncate">{brand.title}</h3>
                                <p className="text-sm text-gray-400 mt-1">
                                    Created {new Date(brand.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Loading States */}
                {loading && (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                )}

                {loadingMore && (
                    <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                        <span className="ml-2 text-gray-400">Loading more brands...</span>
                    </div>
                )}

                {/* Empty State */}
                {!loading && brands.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                        <Package className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg">No brands found</p>
                        <p className="text-sm mt-2">
                            {searchTerm ? 'Try adjusting your search terms' : 'Create your first brand to get started'}
                        </p>
                    </div>
                )}
            </main>

            {/* Brand Form Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-lg w-full max-w-md border border-gray-800">
                        <div className="px-6 py-4 border-b border-gray-800">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-gray-100">
                                    {editingBrand ? 'Edit Brand' : 'Create New Brand'}
                                </h2>
                                <button onClick={closeModal} className="text-gray-400 hover:text-gray-200 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Brand Title</label>
                                <input
                                    {...register("title")}
                                    className="w-full h-12 px-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter brand title"
                                />
                                {errors.title && <p className="mt-2 text-sm text-red-400">{errors.title.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Brand Image {!editingBrand && '*'}
                                </label>
                                <input
                                    // ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    {...register("image")}
                                    className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-gray-900 hover:file:bg-blue-600"
                                />
                                {imagePreview && (
                                    <div className="mt-4 relative inline-block">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="h-24 w-24 object-cover rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setImagePreview(null)
                                                if (fileInputRef.current) fileInputRef.current.value = ""
                                            }}
                                            className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end space-x-4 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 rounded-lg bg-blue-500 text-gray-900 font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            {editingBrand ? 'Updating...' : 'Creating...'}
                                        </>
                                    ) : (
                                        editingBrand ? 'Update Brand' : 'Create Brand'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-lg w-full max-w-md border border-gray-800">
                        <div className="p-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <AlertCircle className="w-6 h-6 text-red-400" />
                                <h3 className="text-lg font-semibold text-gray-100">Delete Brand</h3>
                            </div>
                            <p className="text-gray-300 mb-6">
                                Are you sure you want to delete this brand? This action cannot be undone.
                            </p>
                            <div className="flex justify-end space-x-4">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
                                    className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default BrandPage
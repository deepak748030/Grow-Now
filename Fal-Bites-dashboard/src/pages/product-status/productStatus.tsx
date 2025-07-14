"use client"
import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { Package, Pencil, Trash2, X, Menu, Loader2, Search } from "lucide-react"

// Types and Interfaces
interface ProductType {
    title: string
    price: number
    withoutDiscountPrice: number
    smallDescription: string
    _id?: string
}

interface Category {
    _id: string
    title: string
    image: string
}

interface TopCategory {
    _id: string
    title: string
    category: {
        _id: string
        title: string
    } | null
}

interface SubCategory {
    _id: string
    title: string
    image?: string
    topCategory: {
        _id: string
        title: string
    }
}

interface Product {
    _id: string
    title: string
    description: string
    category: string | Category | null
    topCategory?: string | TopCategory
    subCategory?: string | SubCategory
    stock: number
    weightOrCount: string
    tag: string[]
    imageUrl: string[]
    types: ProductType[]
    status: "pending" | "success" | "failed" // Added status field
    createdAt?: string
    updatedAt?: string
}

interface ApiResponse<T> {
    success: boolean
    data: T[]
}

// API Configuration
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000", // Updated base URL to match the provided endpoint
})

// Existing API Functions (keeping only those relevant for fetching/updating existing data)
const getProducts = async () => {
    try {
        const response = await api.get<ApiResponse<Product>>("/products")
        return response.data.data || []
    } catch (error) {
        console.error("Failed to fetch products:", error)
        return []
    }
}

const deleteProduct = async (id: string) => {
    try {
        await api.delete(`/products/${id}`)
    } catch (error) {
        console.error("Failed to delete product:", error)
        throw error
    }
}


const getCategories = async () => {
    try {
        const response = await api.get<ApiResponse<Category>>("/categories")
        return response.data.data || []
    } catch (error) {
        console.error("Failed to fetch categories:", error)
        return []
    }
}

const getTopCategories = async () => {
    try {
        const response = await api.get<ApiResponse<TopCategory>>("/top-categories")
        return response.data.data || []
    } catch (error) {
        console.error("Failed to fetch top categories:", error)
        return []
    }
}

const getSubCategories = async () => {
    try {
        const response = await api.get<ApiResponse<SubCategory>>("/sub-categories")
        return response.data.data || []
    } catch (error) {
        console.error("Failed to fetch sub categories:", error)
        return []
    }
}

// API Function for updating product status
const updateProductStatus = async (id: string, status: "pending" | "success" | "failed") => {
    try {
        const response = await api.patch(
            `/products/status/${id}`,
            { status },
            {
                headers: { "Content-Type": "application/json" },
            },
        )
        return response.data
    } catch (error) {
        console.error(`Failed to update product status for ${id}:`, error)
        throw error
    }
}

// Helper functions
const getTopCategoryName = (topCategoryId: string | undefined, topCategories: TopCategory[]): string => {
    if (!topCategoryId) return "No top category"
    const topCategory = topCategories.find((cat) => cat._id === topCategoryId)
    return topCategory ? topCategory.title : topCategoryId
}

const getSubCategoryName = (subCategoryId: string | undefined, subCategories: SubCategory[]): string => {
    if (!subCategoryId) return "No sub category"
    const subCategory = subCategories.find((cat) => cat._id === subCategoryId)
    return subCategory ? subCategory.title : subCategoryId
}

const getCategoryName = (categoryId: string | null | undefined, categories: Category[]): string => {
    if (!categoryId || categoryId === "null") return "No category"
    const category = categories.find((cat) => cat._id === categoryId)
    return category ? category.title : categoryId
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
        <Package className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg">{message}</p>
    </div>
)

// Enhanced Category Dropdown Component (removed onCreateNew prop and related UI)
const CategoryDropdown = ({
    categories,
    value,
    onChange,
    isLoading,
    error,
    placeholder = "Select a category",
}: {
    categories: Category[]
    value: string
    onChange: (categoryId: string) => void
    isLoading?: boolean
    error?: string
    placeholder?: string
}) => {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const selectedCategory = categories.find((cat) => cat._id === value)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-12 px-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
                disabled={isLoading}
            >
                <div className="flex items-center space-x-3">
                    {selectedCategory ? (
                        <>
                            <img
                                src={selectedCategory.image || "/placeholder.svg"}
                                alt={selectedCategory.title}
                                className="w-6 h-6 rounded object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = "/placeholder.svg"
                                }}
                            />
                            <span>{selectedCategory.title}</span>
                        </>
                    ) : (
                        <span className="text-gray-400">{placeholder}</span>
                    )}
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 text-center text-gray-400">Loading categories...</div>
                    ) : error ? (
                        <div className="p-4 text-center text-red-400">Error loading categories</div>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => {
                                    onChange("")
                                    setIsOpen(false)
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-gray-700 flex items-center space-x-3"
                            >
                                <div className="w-6 h-6 rounded bg-gray-600 flex items-center justify-center">
                                    <Package className="w-4 h-4 text-gray-400" />
                                </div>
                                <span className="text-gray-400">No category</span>
                            </button>
                            {categories.map((category) => (
                                <button
                                    key={category._id}
                                    type="button"
                                    onClick={() => {
                                        onChange(category._id)
                                        setIsOpen(false)
                                    }}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-700 flex items-center space-x-3"
                                >
                                    <img
                                        src={category.image || "/placeholder.svg"}
                                        alt={category.title}
                                        className="w-6 h-6 rounded object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.src = "/placeholder.svg"
                                        }}
                                    />
                                    <span>{category.title}</span>
                                </button>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

export default function ProductStatusManagementPage() {
    const [products, setProducts] = useState<Product[]>([]) // Master list of all products
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]) // Products currently displayed
    const [isLoading, setIsLoading] = useState(false) // For deletion/status update
    const [isInitialLoading, setIsInitialLoading] = useState(true) // For initial data fetch
    const [searchQuery, setSearchQuery] = useState("")
    const [categories, setCategories] = useState<Category[]>([])
    const [allTopCategories, setAllTopCategories] = useState<TopCategory[]>([])
    const [allSubCategories, setAllSubCategories] = useState<SubCategory[]>([])
    const [selectedCategoryId, setSelectedCategoryId] = useState("")
    const [isCategoriesLoading, setIsCategoriesLoading] = useState(false)
    const [showMobileMenu, setShowMobileMenu] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [updatingProductId, setUpdatingProductId] = useState<string | null>(null) // State for tracking product being updated

    // Helper function to get stock status
    const getStockStatus = (stock: number) => {
        if (stock <= 0) return { label: "Out of Stock", color: "bg-red-100 text-red-800" }
        if (stock < 10) return { label: "Low Stock", color: "bg-yellow-100 text-yellow-800" }
        return { label: "In Stock", color: "bg-green-100 text-green-800" }
    }

    // Handler for changing product status
    const handleStatusChange = async (productId: string, newStatus: "pending" | "success" | "failed") => {
        setUpdatingProductId(productId)
        setError(null)
        try {
            await updateProductStatus(productId, newStatus)
            // Update the product in the local state
            setProducts((prevProducts) =>
                prevProducts.map((product) => (product._id === productId ? { ...product, status: newStatus } : product)),
            )
        } catch (err) {
            console.error("Failed to update product status:", err)
            setError("Failed to update product status. Please try again.")
        } finally {
            setUpdatingProductId(null)
        }
    }

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setIsCategoriesLoading(true)
                setError(null)
                const [productsData, categoriesData, topCategoriesData, subCategoriesData] = await Promise.all([
                    getProducts(),
                    getCategories(),
                    getTopCategories(),
                    getSubCategories(),
                ])
                setProducts(productsData)
                setFilteredProducts(productsData) // Initialize filtered products with all products
                setCategories(categoriesData)
                setAllTopCategories(topCategoriesData)
                setAllSubCategories(subCategoriesData)
            } catch (error) {
                console.error("Failed to fetch initial data:", error)
                setError("Failed to load data. Please refresh the page.")
            } finally {
                setIsInitialLoading(false)
                setIsCategoriesLoading(false)
            }
        }
        fetchInitialData()
    }, [])

    // Client-side filtering logic
    useEffect(() => {
        let currentFilteredProducts = products // Start with the master list

        if (selectedCategoryId) {
            currentFilteredProducts = currentFilteredProducts.filter(
                (product) =>
                    (typeof product.category === "object" && product.category?._id === selectedCategoryId) ||
                    (typeof product.category === "string" && product.category === selectedCategoryId),
            )
        }

        if (searchQuery) {
            const lowerCaseQuery = searchQuery.toLowerCase()
            currentFilteredProducts = currentFilteredProducts.filter(
                (product) =>
                    product.title.toLowerCase().includes(lowerCaseQuery) ||
                    product.description.toLowerCase().includes(lowerCaseQuery) ||
                    product.tag.some((tag) => tag.toLowerCase().includes(lowerCaseQuery)) ||
                    product.weightOrCount.toLowerCase().includes(lowerCaseQuery),
            )
        }

        setFilteredProducts(currentFilteredProducts)
    }, [searchQuery, selectedCategoryId, products]) // Re-run when query, category, or master products list changes

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            setIsLoading(true)
            setError(null)
            try {
                await deleteProduct(id)
                // Update the master products list directly, which will trigger the filtering useEffect
                setProducts((prevProducts) => prevProducts.filter((p) => p._id !== id))
            } catch (error) {
                console.error("Failed to delete product:", error)
                setError("Failed to delete product. Please try again.")
            } finally {
                setIsLoading(false)
            }
        }
    }

    // This function is no longer needed as the product editing form is removed.
    // Keeping it as a placeholder if the user decides to re-add editing functionality later.
    const handleEdit = (product: Product) => {
        console.log("Edit functionality removed from this page.", product)
        setError("Product editing is not available on this page.")
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
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Product Status Management</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="sm:hidden p-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                {/* Mobile Menu (empty as no actions are available) */}
                {showMobileMenu && <div className="sm:hidden mt-4 space-y-4"></div>}
            </header>

            <main className="p-4 sm:p-6 space-y-6">
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full h-12 pl-10 pr-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <CategoryDropdown
                        categories={categories}
                        value={selectedCategoryId}
                        onChange={(categoryId) => setSelectedCategoryId(categoryId)}
                        isLoading={isCategoriesLoading}
                    />
                </div>

                {/* Products List/Grid */}
                <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700">
                    {isLoading && !isInitialLoading ? ( // Use isLoading for general operations, isInitialLoading for first load
                        <LoadingSpinner />
                    ) : filteredProducts.length === 0 ? (
                        <EmptyState message="No products found" />
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden sm:block">
                                <table className="min-w-full divide-y divide-gray-700">
                                    <thead className="bg-gray-900">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Product
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Category
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Top Category
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Sub Category
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Tag
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Stock
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Variants
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                                        {filteredProducts.map((product) => {
                                            const stockStatus = getStockStatus(product.stock)
                                            return (
                                                <tr key={product._id} className="hover:bg-gray-750">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            {product.imageUrl && product.imageUrl.length > 0 ? (
                                                                <img
                                                                    src={product.imageUrl[0] || "/placeholder.svg"}
                                                                    alt={product.title}
                                                                    className="w-10 h-10 rounded-full object-cover"
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement
                                                                        target.src = "/placeholder.svg"
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                                                    <Package className="w-5 h-5 text-gray-400" />
                                                                </div>
                                                            )}
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-100">{product.title}</div>
                                                                <div className="text-xs text-gray-400">{product.weightOrCount}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-300">
                                                            {typeof product.category === "object" && product.category
                                                                ? product.category.title
                                                                : getCategoryName(product.category, categories)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-300">
                                                            {typeof product.topCategory === "object" && product.topCategory
                                                                ? product.topCategory.title
                                                                : getTopCategoryName(product.topCategory, allTopCategories)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-300">
                                                            {typeof product.subCategory === "object" && product.subCategory
                                                                ? product.subCategory.title
                                                                : getSubCategoryName(product.subCategory, allSubCategories)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {product.tag && (
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                                {product.tag}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <span
                                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${stockStatus.color}`}
                                                            >
                                                                {stockStatus.label}
                                                            </span>
                                                            <span className="ml-2 text-sm text-gray-300">{product.stock} units</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-300">{product.types?.length || 0} variants</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <select
                                                                value={product.status}
                                                                onChange={(e) =>
                                                                    handleStatusChange(product._id, e.target.value as "pending" | "success" | "failed")
                                                                }
                                                                className="bg-gray-700 border border-gray-600 text-gray-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                                                                disabled={updatingProductId === product._id || isLoading}
                                                            >
                                                                <option value="pending">Pending</option>
                                                                <option value="success">Success</option>
                                                                <option value="failed">Failed</option>
                                                            </select>
                                                            {updatingProductId === product._id && (
                                                                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            className="text-blue-400 hover:text-blue-300 mr-4 transition-colors"
                                                            onClick={() => handleEdit(product)}
                                                            disabled={isLoading}
                                                        >
                                                            <Pencil className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            className="text-red-400 hover:text-red-300 transition-colors"
                                                            onClick={() => handleDelete(product._id)}
                                                            disabled={isLoading}
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="sm:hidden divide-y divide-gray-700">
                                {filteredProducts.map((product) => {
                                    const stockStatus = getStockStatus(product.stock)
                                    return (
                                        <div key={product._id} className="p-4 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    {product.imageUrl && product.imageUrl.length > 0 ? (
                                                        <img
                                                            src={product.imageUrl[0] || "/placeholder.svg"}
                                                            alt={product.title}
                                                            className="w-12 h-12 rounded-full object-cover"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement
                                                                target.src = "/placeholder.svg"
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                                                            <Package className="w-6 h-6 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h3 className="text-sm font-medium text-gray-100">{product.title}</h3>
                                                        <p className="text-xs text-gray-400">
                                                            {typeof product.category === "object" && product.category
                                                                ? product.category.title
                                                                : getCategoryName(product.category, categories)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <button
                                                        className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                                                        onClick={() => handleEdit(product)}
                                                        disabled={isLoading}
                                                        aria-label="Edit product"
                                                    >
                                                        <Pencil className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        className="p-2 text-red-400 hover:text-red-300 transition-colors"
                                                        onClick={() => handleDelete(product._id)}
                                                        disabled={isLoading}
                                                        aria-label="Delete product"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <span className="text-gray-400">Top Category:</span>
                                                    <span className="ml-2 text-gray-100">
                                                        {typeof product.topCategory === "object" && product.topCategory
                                                            ? product.topCategory.title
                                                            : getTopCategoryName(product.topCategory, allTopCategories)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400">Sub Category:</span>
                                                    <span className="ml-2 text-gray-100">
                                                        {typeof product.subCategory === "object" && product.subCategory
                                                            ? product.subCategory.title
                                                            : getSubCategoryName(product.subCategory, allSubCategories)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400">Tag:</span>
                                                    {product.tag && (
                                                        <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                            {product.tag}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="text-gray-400">Variants:</span>
                                                    <span className="ml-2 text-gray-100">{product.types?.length || 0}</span>
                                                </div>
                                                <div className="col-span-2 mt-1">
                                                    <span className="text-gray-400">Stock:</span>
                                                    <span
                                                        className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${stockStatus.color}`}
                                                    >
                                                        {stockStatus.label} ({product.stock})
                                                    </span>
                                                </div>
                                                <div className="col-span-2 mt-1">
                                                    <span className="text-gray-400">Status:</span>
                                                    <div className="inline-flex items-center gap-2 ml-2">
                                                        <select
                                                            value={product.status}
                                                            onChange={(e) =>
                                                                handleStatusChange(product._id, e.target.value as "pending" | "success" | "failed")
                                                            }
                                                            className="bg-gray-700 border border-gray-600 text-gray-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                                                            disabled={updatingProductId === product._id || isLoading}
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="success">Success</option>
                                                            <option value="failed">Failed</option>
                                                        </select>
                                                        {updatingProductId === product._id && (
                                                            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    )
}

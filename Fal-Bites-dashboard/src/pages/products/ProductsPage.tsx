"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import axios from "axios"
import { Package, Plus, Pencil, Trash2, X, Menu, Loader2, IndianRupee, Search } from "lucide-react"

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
  category: string | Category | null // Add null as possible value
  topCategory?: string | TopCategory
  subCategory?: string | SubCategory
  stock: number
  weightOrCount: string
  tag: string[]
  imageUrl: string[]
  types: ProductType[]
  createdAt?: string
  updatedAt?: string
}

interface ApiResponse<T> {
  success: boolean
  data: T[]
}

// API Configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
})

// API Functions with error handling
const getProducts = async () => {
  try {
    const response = await api.get<ApiResponse<Product>>("/products")
    return response.data.data || []
  } catch (error) {
    console.error("Failed to fetch products:", error)
    return []
  }
}

const getProductById = async (id: string) => {
  try {
    const response = await api.get(`/products/${id}`)
    return response.data.data
  } catch (error) {
    console.error("Failed to fetch product by ID:", error)
    throw error
  }
}

const createProduct = async (formData: FormData) => {
  try {
    const response = await api.post<ApiResponse<Product>>("/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data.data[0]
  } catch (error) {
    console.error("Failed to create product:", error)
    throw error
  }
}

const updateProduct = async (id: string, formData: FormData) => {
  try {
    const response = await api.patch<ApiResponse<Product>>(`/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data.data[0]
  } catch (error) {
    console.error("Failed to update product:", error)
    throw error
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

const searchProducts = async (query: string, category?: string) => {
  try {
    const response = await api.get<ApiResponse<Product>>("/products/search", {
      params: { q: query, category },
    })
    return response.data.data || []
  } catch (error) {
    console.error("Failed to search products:", error)
    return []
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

// Helper functions to resolve IDs to names
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

// Zod Schema for Product Type
const productTypeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  price: z.number().min(0, "Price must be a positive number"),
  withoutDiscountPrice: z.number().min(0, "Without discount price must be a positive number"),
  smallDescription: z.string().max(200, "Small description cannot exceed 200 characters"),
})

// Zod Schema for Product
const productSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().optional(), // Make category optional
  topCategory: z.string().optional(),
  subCategory: z.string().optional(),
  stock: z.number().min(0, "Stock must be a positive number"),
  weightOrCount: z.string().min(1, "Weight or count is required"),
  tag: z
    .string()
    .optional()
    .transform((val) => (val ? [val] : [])),
  types: z.array(productTypeSchema).min(1, "At least one product type is required"),
})

type ProductFormData = z.infer<typeof productSchema>

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

// Custom Category Dropdown Component
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

  // Close dropdown when clicking outside
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
          ) : categories.length === 0 ? (
            <div className="p-4 text-center text-gray-400">No categories available</div>
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

// Custom Top Category Dropdown Component
const TopCategoryDropdown = ({
  topCategories,
  value,
  onChange,
  isLoading,
  placeholder = "Select a top category",
  disabled = false,
}: {
  topCategories: TopCategory[]
  value: string
  onChange: (topCategoryId: string) => void
  isLoading?: boolean
  placeholder?: string
  disabled?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const selectedTopCategory = topCategories.find((cat) => cat._id === value)

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
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full h-12 px-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
        disabled={isLoading || disabled}
      >
        <div className="flex items-center space-x-3">
          {selectedTopCategory ? (
            <span>
              {selectedTopCategory.title}
              {selectedTopCategory.category && ` (${selectedTopCategory.category.title})`}
            </span>
          ) : (
            <span className="text-gray-400">{disabled ? "Select a category first" : placeholder}</span>
          )}
        </div>
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-400">Loading top categories...</div>
          ) : topCategories.length === 0 ? (
            <div className="p-4 text-center text-gray-400">No top categories available for selected category</div>
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
                <span className="text-gray-400">No top category</span>
              </button>
              {topCategories.map((topCategory) => (
                <button
                  key={topCategory._id}
                  type="button"
                  onClick={() => {
                    onChange(topCategory._id)
                    setIsOpen(false)
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-700 flex items-center space-x-3"
                >
                  <span>
                    {topCategory.title}
                    {topCategory.category && ` (${topCategory.category.title})`}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// Custom Sub Category Dropdown Component
const SubCategoryDropdown = ({
  subCategories,
  value,
  onChange,
  isLoading,
  placeholder = "Select a sub category",
  disabled = false,
}: {
  subCategories: SubCategory[]
  value: string
  onChange: (subCategoryId: string) => void
  isLoading?: boolean
  placeholder?: string
  disabled?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const selectedSubCategory = subCategories.find((cat) => cat._id === value)

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
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full h-12 px-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
        disabled={isLoading || disabled}
      >
        <div className="flex items-center space-x-3">
          {selectedSubCategory ? (
            <>
              {selectedSubCategory.image && (
                <img
                  src={selectedSubCategory.image || "/placeholder.svg"}
                  alt={selectedSubCategory.title}
                  className="w-6 h-6 rounded object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg"
                  }}
                />
              )}
              <span>
                {selectedSubCategory.title} ({selectedSubCategory.topCategory.title})
              </span>
            </>
          ) : (
            <span className="text-gray-400">{disabled ? "Select a top category first" : placeholder}</span>
          )}
        </div>
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-400">Loading sub categories...</div>
          ) : subCategories.length === 0 ? (
            <div className="p-4 text-center text-gray-400">No sub categories available for selected top category</div>
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
                <span className="text-gray-400">No sub category</span>
              </button>
              {subCategories.map((subCategory) => (
                <button
                  key={subCategory._id}
                  type="button"
                  onClick={() => {
                    onChange(subCategory._id)
                    setIsOpen(false)
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-700 flex items-center space-x-3"
                >
                  {subCategory.image && (
                    <img
                      src={subCategory.image || "/placeholder.svg"}
                      alt={subCategory.title}
                      className="w-6 h-6 rounded object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg"
                      }}
                    />
                  )}
                  <span>
                    {subCategory.title} ({subCategory.topCategory.title})
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function ProductPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [imageFiles, setImageFiles] = useState<Array<{ file: File; preview: string }>>([])
  const [mainImageIndex, setMainImageIndex] = useState<number>(0)
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [topCategories, setTopCategories] = useState<TopCategory[]>([])
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [allTopCategories, setAllTopCategories] = useState<TopCategory[]>([])
  const [allSubCategories, setAllSubCategories] = useState<SubCategory[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reference to file input for resetting
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form for the main product
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      stock: 0,
      types: [{ title: "", price: 0, withoutDiscountPrice: 0, smallDescription: "" }],
    },
  })

  // Memoized callback for handling category changes
  const handleCategoryChange = useCallback(
    (categoryId: string) => {
      try {
        setValue("category", categoryId)

        if (categoryId) {
          // Filter top categories that belong to the selected category
          const filteredTopCategories = allTopCategories.filter((topCat) => {
            return topCat.category && topCat.category._id === categoryId
          })
          setTopCategories(filteredTopCategories)

          // Reset dependent fields
          setValue("topCategory", "")
          setValue("subCategory", "")
          setSubCategories([])
        } else {
          // If no category selected, clear all dependent dropdowns
          setTopCategories([])
          setSubCategories([])
          setValue("topCategory", "")
          setValue("subCategory", "")
        }
      } catch (error) {
        console.error("Error handling category change:", error)
        setError("Failed to update categories")
      }
    },
    [allTopCategories, setValue],
  )

  // Memoized callback for handling top category changes
  const handleTopCategoryChange = useCallback(
    (topCategoryId: string) => {
      try {
        setValue("topCategory", topCategoryId)

        if (topCategoryId) {
          // Filter sub categories that belong to the selected top category
          const filteredSubCategories = allSubCategories.filter((subCat) => {
            return subCat.topCategory && subCat.topCategory._id === topCategoryId
          })
          setSubCategories(filteredSubCategories)

          // Reset sub category
          setValue("subCategory", "")
        } else {
          // If no top category selected, clear sub categories
          setSubCategories([])
          setValue("subCategory", "")
        }
      } catch (error) {
        console.error("Error handling top category change:", error)
        setError("Failed to update sub categories")
      }
    },
    [allSubCategories, setValue],
  )

  // Memoized callback for handling sub category changes
  const handleSubCategoryChange = useCallback(
    (subCategoryId: string) => {
      try {
        setValue("subCategory", subCategoryId)
      } catch (error) {
        console.error("Error handling sub category change:", error)
        setError("Failed to update sub category")
      }
    },
    [setValue],
  )

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

  // Handle search with debouncing
  useEffect(() => {
    const handleSearch = async () => {
      if (!searchQuery && !selectedCategoryId) {
        const data = await getProducts()
        setProducts(data)
        return
      }
      setIsSearching(true)
      try {
        const data = await searchProducts(searchQuery, selectedCategoryId || undefined)
        setProducts(data)
      } catch (error) {
        console.error("Failed to search products:", error)
        setError("Search failed. Please try again.")
      } finally {
        setIsSearching(false)
      }
    }
    const debounceTimeout = setTimeout(handleSearch, 300)
    return () => clearTimeout(debounceTimeout)
  }, [searchQuery, selectedCategoryId])

  // Reset form completely
  const resetFormCompletely = () => {
    reset({
      title: "",
      description: "",
      category: "",
      topCategory: "",
      subCategory: "",
      stock: 0,
      weightOrCount: "",
      tag: [],
      types: [{ title: "", price: 0, withoutDiscountPrice: 0, smallDescription: "" }],
    })
    setImageFiles([])
    setMainImageIndex(0)
    setEditingProduct(null)
    setTopCategories([])
    setSubCategories([])
    setError(null)
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Update the onSubmit function to handle multiple images
  const onSubmit = async (data: ProductFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      // Append product data
      Object.entries(data).forEach(([key, value]) => {
        if (key !== "types" && key !== "image") {
          if (value !== undefined && value !== "") {
            // Handle category - if empty string, send null
            if (key === "category" && value === "") {
              formData.append(key, "null")
            } else {
              formData.append(key, String(value))
            }
          }
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

      if (editingProduct) {
        await updateProduct(editingProduct._id, formData)
      } else {
        await createProduct(formData)
      }
      // Refresh products list
      const productsData = await getProducts()
      setProducts(productsData)
      // Extract unique categories
      const categoriesData = await getCategories()
      setCategories(categoriesData)
      // Reset form and state
      resetFormCompletely()
      // Close the form modal
      setShowForm(false)
    } catch (error) {
      console.error("Failed to save product:", error)
      setError("Failed to save product. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setIsLoading(true)
      setError(null)
      try {
        await deleteProduct(id)
        const data = await getProducts()
        setProducts(data)
      } catch (error) {
        console.error("Failed to delete product:", error)
        setError("Failed to delete product. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Update the handleEdit function to load multiple images
  const handleEdit = async (product: Product) => {
    try {
      setError(null)
      // First reset the form to clear any previous data
      resetFormCompletely()
      // Fetch the full product details
      const fullProduct = await getProductById(product._id)
      console.log(fullProduct)
      // Set the editing product state
      setEditingProduct(fullProduct)
      // Set form values
      setValue("title", fullProduct.title)
      setValue("description", fullProduct.description)

      // Handle category selection and filtering
      const categoryId = fullProduct.category
        ? typeof fullProduct.category === "object"
          ? fullProduct.category._id
          : fullProduct.category
        : ""
      setValue("category", categoryId)

      // Filter top categories based on selected category
      if (categoryId && categoryId !== "null") {
        const filteredTopCategories = allTopCategories.filter((topCat) => {
          return topCat.category && topCat.category._id === categoryId
        })
        setTopCategories(filteredTopCategories)
      } else {
        setTopCategories([])
      }

      // Handle top category selection and filtering
      const topCategoryId =
        typeof fullProduct.topCategory === "object" ? fullProduct.topCategory._id : fullProduct.topCategory || ""
      setValue("topCategory", topCategoryId)

      // Filter sub categories based on selected top category
      if (topCategoryId) {
        const filteredSubCategories = allSubCategories.filter((subCat) => {
          return subCat.topCategory && subCat.topCategory._id === topCategoryId
        })
        setSubCategories(filteredSubCategories)

        const subCategoryId =
          typeof fullProduct.subCategory === "object" ? fullProduct.subCategory._id : fullProduct.subCategory || ""
        setValue("subCategory", subCategoryId)
      } else {
        setSubCategories([])
        setValue("subCategory", "")
      }

      setValue("stock", fullProduct.stock)
      setValue("weightOrCount", fullProduct.weightOrCount)
      setValue("tag", fullProduct.tag ? fullProduct.tag[0] : "")
      // Set main image index to 0 by default (first image is the main one)
      setMainImageIndex(0)
      // Ensure types is properly set with all required fields
      if (fullProduct.types && fullProduct.types.length > 0) {
        setValue(
          "types",
          fullProduct.types.map((type: any) => ({
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
      console.error("Failed to fetch product details:", error)
      setError("Failed to load product details. Please try again.")
    }
  }

  // Update the handleFileChange function to handle multiple files
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

  // Update the removeImage function to remove a specific image
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

  // Clean up object URLs when component unmounts or when imagePreview changes
  useEffect(() => {
    return () => {
      // Clean up all preview URLs when component unmounts
      imageFiles.forEach((image) => {
        URL.revokeObjectURL(image.preview)
      })
    }
  }, [])

  // Watch product types for form validation
  const productTypes = watch("types")

  // Add a new product type
  const addProductType = () => {
    const currentTypes = watch("types") || []
    setValue("types", [...currentTypes, { title: "", price: 0, withoutDiscountPrice: 0, smallDescription: "" }])
  }

  // Remove a product type
  const removeProductType = (index: number) => {
    const currentTypes = watch("types") || []
    if (currentTypes.length > 1) {
      setValue(
        "types",
        currentTypes.filter((_, i) => i !== index),
      )
    }
  }

  // Close modal and reset form
  const handleCloseModal = () => {
    setShowForm(false)
    resetFormCompletely()
  }

  // Stock status indicator
  const getStockStatus = (stock: number) => {
    if (stock <= 0) return { label: "Out of Stock", color: "bg-red-100 text-red-800" }
    if (stock < 10) return { label: "Low Stock", color: "bg-yellow-100 text-yellow-800" }
    return { label: "In Stock", color: "bg-green-100 text-green-800" }
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
            <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Products</h1>
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
              Add Product
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
              Add Product
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
          {isSearching ? (
            <LoadingSpinner />
          ) : products.length === 0 ? (
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
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {products.map((product) => {
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
                {products.map((product) => {
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
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-800">
            <div className="sticky top-0 bg-gray-900 px-6 py-4 border-b border-gray-800 z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-100">
                  {editingProduct ? "Edit Product" : "Add New Product"}
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
                  <CategoryDropdown
                    categories={categories}
                    value={watch("category") || ""}
                    onChange={handleCategoryChange}
                    isLoading={isCategoriesLoading}
                  />
                  {errors.category && <p className="mt-2 text-sm text-red-400">{errors.category.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Top Category</label>
                  <TopCategoryDropdown
                    topCategories={topCategories}
                    value={watch("topCategory") || ""}
                    onChange={handleTopCategoryChange}
                    isLoading={isCategoriesLoading}
                    disabled={!watch("category") || watch("category") === ""}
                    placeholder={
                      !watch("category") || watch("category") === ""
                        ? "Select a category first"
                        : "Select a top category"
                    }
                  />
                  {errors.topCategory && <p className="mt-2 text-sm text-red-400">{errors.topCategory.message}</p>}
                  {watch("category") && topCategories.length === 0 && (
                    <p className="mt-2 text-sm text-yellow-400">
                      No top categories available for the selected category.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sub Category</label>
                  <SubCategoryDropdown
                    subCategories={subCategories}
                    value={watch("subCategory") || ""}
                    onChange={handleSubCategoryChange}
                    isLoading={isCategoriesLoading}
                    disabled={!watch("topCategory") || watch("topCategory") === ""}
                    placeholder={
                      !watch("topCategory") || watch("topCategory") === ""
                        ? "Select a top category first"
                        : "Select a sub category"
                    }
                  />
                  {errors.subCategory && <p className="mt-2 text-sm text-red-400">{errors.subCategory.message}</p>}
                  {watch("topCategory") && subCategories.length === 0 && (
                    <p className="mt-2 text-sm text-yellow-400">
                      No sub categories available for the selected top category.
                    </p>
                  )}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Stock</label>
                  <input
                    type="number"
                    {...register("stock", { valueAsNumber: true })}
                    className="w-full h-12 px-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Available quantity"
                  />
                  {errors.stock && <p className="mt-2 text-sm text-red-400">{errors.stock.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tag</label>
                  <input
                    {...register("tag")}
                    className="w-full h-12 px-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., new, popular, limited"
                  />
                </div>
              </div>
              {/* Replace the image upload UI section in the form with this updated version */}
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
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg"
                            }}
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
                {editingProduct &&
                  editingProduct.imageUrl &&
                  editingProduct.imageUrl.length > 0 &&
                  imageFiles.length === 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-400 mb-2">Current images:</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                        {editingProduct.imageUrl.map((imageUrl, index) => (
                          <div
                            key={index}
                            className={`relative ${mainImageIndex === index ? "ring-2 ring-blue-500" : ""}`}
                          >
                            <img
                              src={imageUrl || "/placeholder.svg"}
                              alt={`Current ${index + 1}`}
                              className="h-24 w-full object-cover rounded-lg cursor-pointer"
                              onClick={() => setMainImage(index)}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "/placeholder.svg"
                              }}
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
              {/* Product Types Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-200">Product Variants</h3>
                  <button
                    type="button"
                    onClick={addProductType}
                    className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-blue-400 hover:bg-blue-500 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Variant
                  </button>
                </div>
                {errors.types && <p className="text-sm text-red-400">{errors.types.message}</p>}
                <div className="space-y-6">
                  {productTypes.map((_, index) => (
                    <div key={index} className="p-4 border border-gray-700 rounded-lg space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-gray-300">Variant {index + 1}</h4>
                        {productTypes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeProductType(index)}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                        <input
                          {...register(`types.${index}.title`)}
                          className="w-full h-10 px-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Standard, Premium, Pro"
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
                          placeholder="Brief description of this product variant"
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
                    "Save Product"
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

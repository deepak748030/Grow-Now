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

const categorySchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  image: z.any().optional(),
})

type CategoryFormData = z.infer<typeof categorySchema>

type Category = {
  _id: string
  title: string
  image?: string
}

export default function CategoriesPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    // Set preview URL when editing a category with an existing image
    if (editingCategory?.image && !selectedFile) {
      setPreviewUrl(`${import.meta.env.VITE_API_URL}/${editingCategory.image}`)
    }

    // Clean up preview URL when component unmounts
    return () => {
      if (previewUrl && selectedFile) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [editingCategory, selectedFile])

  const fetchCategories = async () => {
    setIsFetching(true)
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/categories`)
      setCategories(response.data?.data)
    } catch (error) {
      console.error("Failed to fetch categories:", error)
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
    setEditingCategory(null)
  }

  const onSubmit = async (data: CategoryFormData) => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("title", data.title)
      if (selectedFile) formData.append("image", selectedFile)

      const url = editingCategory
        ? `${import.meta.env.VITE_API_URL}/categories/${editingCategory._id}`
        : `${import.meta.env.VITE_API_URL}/categories`
      const method = editingCategory ? axios.put : axios.post

      await method(url, formData)
      fetchCategories()
      closeModal()
    } catch (error) {
      console.error("Error saving category:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/categories/${id}`)
      setCategories(categories.filter((category) => category._id !== id))
    } catch (error) {
      console.error("Error deleting category:", error)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    reset({ title: category.title })
    if (category.image) {
      setPreviewUrl(`${import.meta.env.VITE_API_URL}/${category.image}`)
    } else {
      setPreviewUrl(null)
    }
    setSelectedFile(null)
    setShowForm(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Tags className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
        </div>
        <Button onClick={() => setShowForm(true)} icon={<Plus className="w-4 h-4" />}>
          Add Category
        </Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {editingCategory ? "Edit" : "Add"} Category
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Category Title</label>
                <Input
                  {...register("title")}
                  placeholder="Enter category title"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  error={errors.title?.message}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Category Image</label>
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
                <Button type="button" variant="ghost" onClick={closeModal} className="px-4 py-2">
                  Cancel
                </Button>
                <Button type="submit" isLoading={isLoading} className="px-4 py-2 bg-blue-600 text-white">
                  {isLoading ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
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
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[200px] bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
          <Tags className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Categories Found</h3>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
            Get started by creating your first category.
          </p>
          <Button onClick={() => setShowForm(true)} icon={<Plus className="w-4 h-4" />}>
            Add Category
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden group">
              <div className="relative">
                <img
                  src={
                    category.image
                      ? `${category.image}`
                      : "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&auto=format&fit=crop&q=60"
                  }
                  alt={category.title}
                  className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300" />
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{category.title}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(category._id)}
                      className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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


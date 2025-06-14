"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Settings, Link, Clock, DollarSign, Users, ImageIcon, AlertCircle, CheckCircle } from "lucide-react"
import axios from "axios"

// Import environment variables (for Vite)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

// Define the schema for recharge options including the MongoDB _id field
const rechargeOptionSchema = z.object({
  _id: z.string().optional(), // MongoDB ID, optional for new items
  amount: z.number().min(1, "Amount must be at least 1"),
  cashback: z.number().min(0, "Cashback must be non-negative"),
})

// Define the main settings schema including MongoDB fields
const settingsSchema = z.object({
  _id: z.string().optional(), // MongoDB ID
  maintenance: z.boolean(),
  links: z.object({
    website: z.string().url("Invalid website URL").max(255),
    about: z.string().max(500),
    privacy: z.string().max(500),
    termsAndConditions: z.string().max(500),
    thirdPartyLicense: z.string().max(500),
    refundAndCancelation: z.string().max(500),
    shippingPolicy: z.string().max(500),
  }),
  rechargeOptions: z.array(rechargeOptionSchema),
  minAddMoney: z.number().min(1),
  maxRefers: z.number().min(0),
  referReward: z.number().min(0),
  deliveryTiming: z.string().max(50),
  maxSubscriptionUpdateOrCancelTime: z.string().max(10),
  bottomImage: z.string().optional(),
  referImage: z.string().optional(),
  healthyBanner: z.string().optional(),
  searchBackgroundImage: z.string().optional(),
  topBannerImage: z.string().optional(),
  referPageImageAttachment: z.string().optional(),
  createdAt: z.string().optional(), // MongoDB timestamps
  updatedAt: z.string().optional(), // MongoDB timestamps
})

type SettingsFormData = z.infer<typeof settingsSchema>

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)
  const [apiSuccess, setApiSuccess] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [pendingData, setPendingData] = useState<SettingsFormData | null>(null)
  const [originalData, setOriginalData] = useState<SettingsFormData | null>(null)

  // Track image files separately
  const [imageFiles, setImageFiles] = useState<Record<string, File | null>>({
    bottomImage: null,
    referImage: null,
    healthyBanner: null,
    searchBackgroundImage: null,
    topBannerImage: null,
    referPageImageAttachment: null,
  })

  // Track image previews
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({
    bottomImage: "",
    referImage: "",
    healthyBanner: "",
    searchBackgroundImage: "",
    topBannerImage: "",
    referPageImageAttachment: "",
  })

  const {
    register,
    handleSubmit,
    control,
    reset,
    // watch,
    formState: { errors, isDirty },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      maintenance: false,
      links: {
        website: "",
        about: "",
        privacy: "",
        termsAndConditions: "",
        thirdPartyLicense: "",
        refundAndCancelation: "",
        shippingPolicy: "",
      },
      rechargeOptions: [{ amount: 100, cashback: 0 }],
      minAddMoney: 50,
      maxRefers: 10,
      referReward: 20,
      deliveryTiming: "6:00 AM to 9:00 PM",
      maxSubscriptionUpdateOrCancelTime: "9:00 PM",
      bottomImage: "",
      referImage: "",
      healthyBanner: "",
      searchBackgroundImage: "",
      topBannerImage: "",
      referPageImageAttachment: "",
    },
  })

  // Watch all form values
  // const currentValues = watch()

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsFetching(true)
        const response = await axios.get(`${API_URL}/settings`)

        if (response.data && response.data.success && response.data.data) {
          // Data is nested under response.data.data
          const settingsData = response.data.data
          reset(settingsData)
          setOriginalData(settingsData)

          // Initialize image previews from existing data
          const newImagePreviews = { ...imagePreviews }
          Object.keys(newImagePreviews).forEach((key) => {
            if (settingsData[key]) {
              newImagePreviews[key] = settingsData[key]
            }
          })
          setImagePreviews(newImagePreviews)
        } else {
          setApiError("Received invalid data format from server")
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error)
        if (axios.isAxiosError(error)) {
          if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            setApiError(`Server error: ${error.response.status} - ${error.response.data.message || "Unknown error"}`)
          } else if (error.request) {
            // The request was made but no response was received
            setApiError("No response from server. Please check your connection.")
          } else {
            // Something happened in setting up the request that triggered an Error
            setApiError(`Error: ${error.message}`)
          }
        } else {
          setApiError("An unexpected error occurred")
        }
      } finally {
        setIsFetching(false)
      }
    }

    fetchSettings()
  }, [reset])

  const { fields, append, remove } = useFieldArray({
    control,
    name: "rechargeOptions",
  })

  // Helper function to get only changed fields
  const getChangedFields = (formData: SettingsFormData): Partial<SettingsFormData> => {
    if (!originalData) return formData

    const changedFields: Partial<SettingsFormData> = {}

    // Check top-level primitive fields
    if (formData.maintenance !== originalData.maintenance) {
      changedFields.maintenance = formData.maintenance
    }

    if (formData.minAddMoney !== originalData.minAddMoney) {
      changedFields.minAddMoney = formData.minAddMoney
    }

    if (formData.maxRefers !== originalData.maxRefers) {
      changedFields.maxRefers = formData.maxRefers
    }

    if (formData.referReward !== originalData.referReward) {
      changedFields.referReward = formData.referReward
    }

    if (formData.deliveryTiming !== originalData.deliveryTiming) {
      changedFields.deliveryTiming = formData.deliveryTiming
    }

    if (formData.maxSubscriptionUpdateOrCancelTime !== originalData.maxSubscriptionUpdateOrCancelTime) {
      changedFields.maxSubscriptionUpdateOrCancelTime = formData.maxSubscriptionUpdateOrCancelTime
    }

    // Check links object
    const changedLinks: Partial<typeof formData.links> = {}
    let hasChangedLinks = false

    Object.entries(formData.links).forEach(([key, value]) => {
      const typedKey = key as keyof typeof formData.links
      if (value !== originalData.links[typedKey]) {
        changedLinks[typedKey] = value
        hasChangedLinks = true
      }
    })

    if (hasChangedLinks) {
      changedFields.links = changedLinks as typeof formData.links
    }

    // Check recharge options
    // If the array length is different or any item is different, include the whole array
    const originalOptions = originalData.rechargeOptions || []
    const currentOptions = formData.rechargeOptions || []

    if (originalOptions.length !== currentOptions.length) {
      changedFields.rechargeOptions = currentOptions
    } else {
      let hasChangedOptions = false

      for (let i = 0; i < currentOptions.length; i++) {
        const current = currentOptions[i]
        const original = originalOptions[i]

        if (!original || current.amount !== original.amount || current.cashback !== original.cashback) {
          hasChangedOptions = true
          break
        }
      }

      if (hasChangedOptions) {
        changedFields.rechargeOptions = currentOptions
      }
    }

    // Include _id if it exists
    if (originalData._id) {
      changedFields._id = originalData._id
    }

    return changedFields
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Store the file for later upload
      setImageFiles((prev) => ({
        ...prev,
        [fieldName]: file,
      }))

      // Create and store preview
      const previewUrl = URL.createObjectURL(file)
      setImagePreviews((prev) => ({
        ...prev,
        [fieldName]: previewUrl,
      }))

      // Show success message
      setApiSuccess(`${fieldName} selected successfully. Click Save Settings to upload.`)
    } catch (error) {
      console.error(`Failed to process ${fieldName}:`, error)
      setApiError(`Failed to process ${file.name}. Please try again.`)
    }
  }

  const confirmSubmit = (data: SettingsFormData) => {
    setPendingData(data)
    setShowConfirmation(true)
  }

  const cancelSubmit = () => {
    setShowConfirmation(false)
    setPendingData(null)
  }

  const submitSettings = async () => {
    if (!pendingData) return

    setIsLoading(true)
    setApiError(null)
    setApiSuccess(null)
    setShowConfirmation(false)

    try {
      // Get only the changed fields
      const changedData = getChangedFields(pendingData)

      // Check if we have any images to upload
      const hasImages = Object.values(imageFiles).some((file) => file !== null)

      if (hasImages) {
        // Create FormData for multipart/form-data request with images
        const formData = new FormData()

        // Add each image file to FormData if it exists
        Object.entries(imageFiles).forEach(([key, file]) => {
          if (file) {
            formData.append(key, file)
          }
        })

        // Add only the changed JSON data
        formData.append("data", JSON.stringify(changedData))

        // Make PATCH request with multipart/form-data
        const response = await axios.patch(`${API_URL}/settings`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })

        // Handle response
        if (response.data && response.data.success) {
          console.log("Settings updated successfully:", response.data.data)
          setApiSuccess("Settings updated successfully!")

          // Update form with returned data
          if (response.data.data) {
            reset(response.data.data)
            setOriginalData(response.data.data)

            // Update image previews
            const newImagePreviews = { ...imagePreviews }
            Object.keys(newImagePreviews).forEach((key) => {
              if (response.data.data[key]) {
                newImagePreviews[key] = response.data.data[key]
              }
            })
            setImagePreviews(newImagePreviews)

            // Clear image files since they've been uploaded
            setImageFiles({
              bottomImage: null,
              referImage: null,
              healthyBanner: null,
              searchBackgroundImage: null,
              topBannerImage: null,
              referPageImageAttachment: null,
            })
          }
        } else {
          setApiError(response.data.message || "Failed to update settings. Please try again.")
        }
      } else if (Object.keys(changedData).length > 0) {
        // Only send request if there are actually changes
        // No images to upload, just send changed JSON data
        const response = await axios.patch(`${API_URL}/settings`, changedData)

        if (response.data && response.data.success) {
          console.log("Settings updated successfully:", response.data.data)
          setApiSuccess("Settings updated successfully!")

          // Update form with returned data
          if (response.data.data) {
            reset(response.data.data)
            setOriginalData(response.data.data)
          }
        } else {
          setApiError(response.data.message || "Failed to update settings. Please try again.")
        }
      } else {
        // No changes detected
        setApiSuccess("No changes to save")
      }
    } catch (error) {
      console.error("Failed to save settings:", error)
      if (axios.isAxiosError(error)) {
        if (error.response) {
          setApiError(`Server error: ${error.response.status} - ${error.response.data.message || "Unknown error"}`)
        } else if (error.request) {
          setApiError("No response from server. Please check your connection.")
        } else {
          setApiError(`Error: ${error.message}`)
        }
      } else {
        setApiError("An unexpected error occurred while saving settings")
      }
    } finally {
      setIsLoading(false)
      setPendingData(null)
    }
  }

  const ImageUpload = ({ label, name }: { label: string; name: string }) => {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <div className="flex items-center space-x-4">
          <div className="h-24 w-24 overflow-hidden rounded-md border border-gray-300 relative">
            {imagePreviews[name] ? (
              <img src={imagePreviews[name] || "/placeholder.svg"} alt={label} className="h-full w-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-gray-100 dark:bg-gray-700">
                <ImageIcon className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex flex-col space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, name)}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>
        </div>
      </div>
    )
  }

  // Confirmation Modal
  const ConfirmationModal = () => {
    if (!showConfirmation) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Confirm Changes</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Are you sure you want to save these changes? This will update the system settings.
          </p>
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={cancelSubmit}>
              Cancel
            </Button>
            <Button type="button" onClick={submitSettings} isLoading={isLoading}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-6">
            <Settings className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Settings</h1>
          </div>

          {apiError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          {apiSuccess && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded flex items-start">
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{apiSuccess}</span>
            </div>
          )}

          {isFetching ? (
            <div className="py-12 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(confirmSubmit)} className="space-y-8">
              {/* Maintenance Mode */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  {...register("maintenance")}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Maintenance Mode</label>
              </div>

              {/* Links Section */}
              <div className="space-y-4">
                <div className="flex items-center mb-4">
                  <Link className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Website Links</h2>
                </div>

                <Input label="Website URL" {...register("links.website")} error={errors.links?.website?.message} />
                <Input label="About" {...register("links.about")} error={errors.links?.about?.message} />
                <Input label="Privacy Policy" {...register("links.privacy")} error={errors.links?.privacy?.message} />
                <Input
                  label="Terms and Conditions"
                  {...register("links.termsAndConditions")}
                  error={errors.links?.termsAndConditions?.message}
                />
                <Input
                  label="Third Party License"
                  {...register("links.thirdPartyLicense")}
                  error={errors.links?.thirdPartyLicense?.message}
                />

                <Input
                  label="Refund and Cancellation Policy"
                  {...register("links.refundAndCancelation")}
                  error={errors.links?.refundAndCancelation?.message}
                />

                <Input
                  label="Shipping Policy"
                  {...register("links.shippingPolicy")}
                  error={errors.links?.shippingPolicy?.message}
                />
              </div>

              {/* Recharge Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recharge Options</h2>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ amount: 0, cashback: 0 })}>
                    Add Option
                  </Button>
                </div>

                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex space-x-4 items-start">
                      <Input
                        label="Amount"
                        type="number"
                        {...register(`rechargeOptions.${index}.amount` as const, {
                          valueAsNumber: true,
                        })}
                        error={errors.rechargeOptions?.[index]?.amount?.message}
                      />
                      <Input
                        label="Cashback"
                        type="number"
                        {...register(`rechargeOptions.${index}.cashback` as const, {
                          valueAsNumber: true,
                        })}
                        error={errors.rechargeOptions?.[index]?.cashback?.message}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-8"
                        onClick={() => remove(index)}
                        disabled={fields.length <= 1} // Prevent removing all options
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Money and Referral Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center mb-4">
                    <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Money Settings</h2>
                  </div>
                  <Input
                    label="Minimum Add Money"
                    type="number"
                    {...register("minAddMoney", { valueAsNumber: true })}
                    error={errors.minAddMoney?.message}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center mb-4">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Referral Settings</h2>
                  </div>
                  <Input
                    label="Maximum Referrals"
                    type="number"
                    {...register("maxRefers", { valueAsNumber: true })}
                    error={errors.maxRefers?.message}
                  />
                  <Input
                    label="Referral Reward"
                    type="number"
                    {...register("referReward", { valueAsNumber: true })}
                    error={errors.referReward?.message}
                  />
                </div>
              </div>

              {/* Timing Settings */}
              <div className="space-y-4">
                <div className="flex items-center mb-4">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Timing Settings</h2>
                </div>
                <Input label="Delivery Timing" {...register("deliveryTiming")} error={errors.deliveryTiming?.message} />
                <Input
                  label="Max Subscription Update/Cancel Time"
                  {...register("maxSubscriptionUpdateOrCancelTime")}
                  error={errors.maxSubscriptionUpdateOrCancelTime?.message}
                />
              </div>

              {/* Image Settings */}
              <div className="space-y-4">
                <div className="flex items-center mb-4">
                  <ImageIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Image Settings</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ImageUpload label="Bottom Image" name="bottomImage" />
                  <ImageUpload label="Refer Image" name="referImage" />
                  <ImageUpload label="Healthy Banner" name="healthyBanner" />
                  <ImageUpload label="Search Background Image" name="searchBackgroundImage" />
                  <ImageUpload label="Top Banner Image" name="topBannerImage" />
                  <ImageUpload label="Refer Page Image" name="referPageImageAttachment" />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6">
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={(!isDirty && !Object.values(imageFiles).some((file) => file !== null)) || isLoading}
                >
                  Save Settings
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
      <ConfirmationModal />
    </div>
  )
}

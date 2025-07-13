"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import axios from "axios"
import { GoogleMap, useLoadScript } from "@react-google-maps/api"
import { Building2, Plus, Pencil, Trash2, X, Menu, Loader2, Search, MapPin } from "lucide-react"
import { Toaster } from "sonner"
import { toast } from "sonner"

// Types and Interfaces
interface Manager {
    _id: string
    name: string
    mobileNumber: string
    wallet: number
    referCode: string
    bonusWallet: number
    autopayBalance: number
    userType: string
    gender: string
    role: string
    referredUsers: any[]
    createdAt: string
    updatedAt: string
    dob?: string
}

interface Location {
    locationName: string
    lat: number
    lang: number
}

interface PolygonCoordinate {
    lat: number
    lng: number
    _id?: string
}

interface Franchise {
    _id: string
    name: string
    cityName: string
    branchName: string
    totalDeliveryRadius: number
    freeDeliveryRadius: number
    chargePerExtraKm: number
    assignedManager?: Manager
    polygonCoordinates: PolygonCoordinate[]
    location?: Location
    createdAt?: string
    updatedAt?: string
}

interface ApiResponse<T> {
    success?: boolean
    data: T[]
}

// Map container styles
const mapContainerStyle = {
    width: "100%",
    height: "400px",
}

// Default center (Hyderabad, India)
const defaultCenter = {
    lat: 17.385,
    lng: 78.4867,
}

// Define the libraries array outside the component to prevent re-renders
const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places", "drawing"]

// Zod Schema for Franchise
const franchiseSchema = z.object({
    name: z.string().min(1, "Franchise name is required"),
    cityName: z.string().min(1, "City name is required"),
    branchName: z.string().min(1, "Branch name is required"),
    totalDeliveryRadius: z.number().min(0, "Total delivery radius must be a positive number"),
    freeDeliveryRadius: z.number().min(0, "Free delivery radius must be a positive number"),
    chargePerKm: z.number().min(0, "Charge per kilometer must be a positive number"),
    managerId: z.string().optional(),
    locationName: z.string().optional(),
})

type FranchiseFormData = z.infer<typeof franchiseSchema> & {
    location?: Location
}

// Google Maps API key - use environment variable or provide a placeholder message
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || ""

// Check if we have a valid API key
const hasValidApiKey = GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY.length > 10

// API Configuration
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
})

declare global {
    interface Window {
        google: any
    }
}

function FranchisePage() {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries,
        ...(hasValidApiKey ? {} : { mapIds: ["dummy_map_id"] }),
    })

    // State variables (for developers)
    const [isLoading, setIsLoading] = useState(false)
    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [franchises, setFranchises] = useState<Franchise[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [editingFranchise, setEditingFranchise] = useState<Franchise | null>(null)
    const [showMobileMenu, setShowMobileMenu] = useState(false)
    const [managers, setManagers] = useState<Manager[]>([])
    const [mapCenter, setMapCenter] = useState(defaultCenter)
    // Removed unused drawingManager state
    const [polygon, setPolygon] = useState<google.maps.Polygon | null>(null)
    const [polygonCoordinates, setPolygonCoordinates] = useState<PolygonCoordinate[]>([])
    const [locationMarker, setLocationMarker] = useState<google.maps.Marker | null>(null)
    const [location, setLocation] = useState<Location | null>(null)
    const [mapType, setMapType] = useState("roadmap")
    const mapTypeOptions = useRef({
        ROADMAP: "roadmap",
        SATELLITE: "satellite",
        HYBRID: "hybrid",
        TERRAIN: "terrain",
    }).current
    const [allFranchiseMarkers, setAllFranchiseMarkers] = useState<google.maps.Marker[]>([])
    const mapRef = useRef<google.maps.Map | null>(null)
    const geocoderRef = useRef<google.maps.Geocoder | null>(null)

    // Form for the franchise
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
        setValue,
        watch,
    } = useForm<FranchiseFormData>({
        resolver: zodResolver(franchiseSchema),
        defaultValues: {
            totalDeliveryRadius: 10,
            freeDeliveryRadius: 5,
            chargePerKm: 10,
        },
    })

    // Watch the locationName field to update the location state
    const locationName = watch("locationName")

    // Update location state when locationName changes
    useEffect(() => {
        if (location && locationName) {
            setLocation({
                ...location,
                locationName,
            })
        }
    }, [locationName, location])

    // API Functions
    const getFranchises = async (): Promise<Franchise[]> => {
        try {
            const response = await api.get<ApiResponse<Franchise>>("/franchises")
            return response.data.data
        } catch (error) {
            console.error("Error fetching franchises:", error)
            toast.error("Failed to fetch franchises")
            return []
        }
    }

    const getFranchiseById = async (id: string): Promise<Franchise | null> => {
        try {
            const response = await api.get<{ data: Franchise }>(`/franchises/${id}`)
            return response.data.data
        } catch (error) {
            console.error("Error fetching franchise by ID:", error)
            toast.error("Failed to fetch franchise details")
            return null
        }
    }

    const createFranchise = async (data: any): Promise<Franchise | null> => {
        try {
            // Check if we have polygon coordinates
            if (data.polygonCoordinates && data.polygonCoordinates.length > 0) {
                const response = await api.post<ApiResponse<Franchise>>("/franchises", {
                    name: data.name,
                    cityName: data.cityName,
                    branchName: data.branchName,
                    polygonCoordinates: data.polygonCoordinates,
                    totalDeliveryRadius: data.totalDeliveryRadius,
                    freeDeliveryRadius: data.freeDeliveryRadius,
                    chargePerExtraKm: data.chargePerKm,
                    assignedManager: data.managerId,
                    location: data.location && {
                        locationName: data.locationName,
                        lat: data.location.lat,
                        lang: data.location.lang,
                    },
                })
                const createdFranchise = response.data.data[0]
                if (createdFranchise) {
                    // Refresh the franchise list after successful creation
                    const franchisesData = await getFranchises()
                    setFranchises(franchisesData)
                }
                return createdFranchise
            } else {
                toast.error("Please draw a service area on the map")
                return null
            }
        } catch (error) {
            console.error("Error creating franchise:", error)
            toast.error("Failed to create franchise")
            return null
        }
    }

    const updateFranchise = async (id: string, data: any): Promise<Franchise | null> => {
        try {
            // Check if we have polygon coordinates
            if (data.polygonCoordinates && data.polygonCoordinates.length > 0) {
                const response = await api.put<ApiResponse<Franchise>>(`/franchises/${id}`, {
                    name: data.name,
                    cityName: data.cityName,
                    branchName: data.branchName,
                    polygonCoordinates: data.polygonCoordinates,
                    totalDeliveryRadius: data.totalDeliveryRadius,
                    freeDeliveryRadius: data.freeDeliveryRadius,
                    chargePerExtraKm: data.chargePerKm,
                    assignedManager: data.managerId,
                    location: data.location && {
                        locationName: data.locationName,
                        lat: data.location.lat,
                        lang: data.location.lang,
                    },
                })
                return response.data.data[0]
            } else {
                toast.error("Please draw a service area on the map")
                return null
            }
        } catch (error) {
            console.error("Error updating franchise:", error)
            toast.error("Failed to update franchise")
            return null
        }
    }

    const deleteFranchise = async (id: string): Promise<boolean> => {
        try {
            await api.delete(`/franchises/${id}`)
            return true
        } catch (error) {
            console.error("Error deleting franchise:", error)
            toast.error("Failed to delete franchise")
            return false
        }
    }

    const getManagers = async (): Promise<Manager[]> => {
        try {
            const response = await api.get<ApiResponse<Manager>>("/admin/get-managers")
            return response.data.data
        } catch (error) {
            console.error("Error fetching managers:", error)
            toast.error("Failed to fetch managers")
            return []
        }
    }

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setIsInitialLoading(true)
                const [franchisesData, managersData] = await Promise.all([getFranchises(), getManagers()])
                setFranchises(franchisesData)
                setManagers(managersData)

                // If we have franchises, center the map on the first one's polygon center
                if (franchisesData.length > 0 && franchisesData[0].polygonCoordinates?.length > 0) {
                    setMapCenter(calculatePolygonCenter(franchisesData[0].polygonCoordinates))
                }
            } catch (error) {
                console.error("Failed to fetch initial data:", error)
                setFranchises([])
                setManagers([])
            } finally {
                setIsInitialLoading(false)
            }
        }
        fetchInitialData()
    }, [])

    // Initialize geocoder when Google Maps is loaded
    useEffect(() => {
        if (isLoaded && window.google && window.google.maps) {
            geocoderRef.current = new window.google.maps.Geocoder()
        }
    }, [isLoaded])

    // Display all franchise locations on the map
    const displayAllFranchiseLocations = useCallback(() => {
        // Clear existing markers
        allFranchiseMarkers.forEach((marker) => marker.setMap(null))
        setAllFranchiseMarkers([])

        if (!mapRef.current || !window.google) return

        const newMarkers: google.maps.Marker[] = []

        franchises.forEach((franchise) => {
            if (franchise.location) {
                const marker = new window.google.maps.Marker({
                    position: {
                        lat: franchise.location.lat,
                        lng: franchise.location.lang,
                    },
                    map: mapRef.current,
                    title: franchise.name,
                    label: {
                        text: franchise.name.charAt(0),
                        color: "white",
                    },
                    icon: {
                        path: window.google.maps.SymbolPath.CIRCLE,
                        fillColor: "#4285F4",
                        fillOpacity: 0.9,
                        strokeColor: "#ffffff",
                        strokeWeight: 2,
                        scale: 8,
                    },
                })

                // Add info window
                const infoWindow = new window.google.maps.InfoWindow({
                    content: `
                        <div style="padding: 8px; max-width: 200px;">
                            <h3 style="margin: 0 0 8px; font-size: 16px;">${franchise.name}</h3>
                            <p style="margin: 0; font-size: 12px;">${franchise.cityName}, ${franchise.branchName}</p>
                        </div>
                    `,
                })

                marker.addListener("click", () => {
                    infoWindow.open(mapRef.current, marker)
                })

                newMarkers.push(marker)
            }
        })

        setAllFranchiseMarkers(newMarkers)
    }, [franchises, allFranchiseMarkers])

    // Update markers when franchises change
    useEffect(() => {
        if (isLoaded && mapRef.current) {
            displayAllFranchiseLocations()
        }
    }, [isLoaded, franchises, displayAllFranchiseLocations])

    // Clear existing polygon
    const clearPolygon = useCallback(() => {
        if (polygon) {
            polygon.setMap(null)
            setPolygon(null)
            setPolygonCoordinates([])
        }
    }, [polygon])

    // Reset form completely
    const resetFormCompletely = useCallback(() => {
        reset({
            name: "",
            cityName: "",
            branchName: "",
            totalDeliveryRadius: 10,
            freeDeliveryRadius: 5,
            chargePerKm: 10,
            managerId: undefined,
            locationName: "",
        })
        setEditingFranchise(null)
        setMapCenter(defaultCenter)
        clearPolygon()

        // Clear location marker
        if (locationMarker) {
            locationMarker.setMap(null)
            setLocationMarker(null)
        }
        setLocation(null)
    }, [reset, clearPolygon, locationMarker])

    // Get address from coordinates using Google Maps Geocoder
    const getAddressFromCoordinates = useCallback(
        (lat: number, lng: number) => {
            if (!geocoderRef.current) return

            const latlng = { lat, lng }

            geocoderRef.current.geocode({ location: latlng }, (results, status) => {
                if (status === "OK" && results && results[0]) {
                    const address = results[0].formatted_address
                    setValue("locationName", address)

                    if (location) {
                        setLocation({
                            ...location,
                            locationName: address,
                        })
                    }
                } else {
                    console.error("Geocoder failed due to: " + status)
                    toast.error("Could not retrieve address for this location")
                }
            })
        },
        [setValue, location],
    )

    // Handle form submission
    const onSubmit = async (data: FranchiseFormData) => {
        setIsLoading(true)
        try {
            // Check if polygon is drawn
            if (polygonCoordinates.length < 3) {
                toast.error("Please draw a service area with at least 3 points on the map")
                setIsLoading(false)
                return
            }

            // Prepare the data object with location if available
            const franchiseData = {
                ...data,
                polygonCoordinates: polygonCoordinates,
                chargePerExtraKm: data.chargePerKm,
            }

            // Add location if it exists
            if (location) {
                franchiseData.location = location
                franchiseData.locationName = data.locationName || location.locationName
            }

            if (editingFranchise) {
                const updated = await updateFranchise(editingFranchise._id, franchiseData)
                if (updated) {
                    toast.success("Franchise updated successfully")
                    const franchisesData = await getFranchises()
                    setFranchises(franchisesData)
                    window.location.reload()
                }
            } else {
                await createFranchise(franchiseData)
                const franchisesData = await getFranchises()
                setFranchises(franchisesData)
            }

            // Reset form and state
            resetFormCompletely()

            // Close the form modal
            setShowForm(false)
        } catch (error) {
            console.error("Failed to save franchise:", error)
            toast.error("Failed to save franchise")
        } finally {
            setIsLoading(false)
        }
    }

    // Handle franchise deletion
    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this franchise?")) {
            setIsLoading(true)
            try {
                const success = await deleteFranchise(id)
                if (success) {
                    toast.success("Franchise deleted successfully")
                    const franchisesData = await getFranchises()
                    setFranchises(franchisesData)
                }
            } catch (error) {
                console.error("Failed to delete franchise:", error)
                toast.error("Failed to delete franchise")
            } finally {
                setIsLoading(false)
            }
        }
    }

    // Calculate the center of a polygon
    const calculatePolygonCenter = (coordinates: PolygonCoordinate[]): { lat: number; lng: number } => {
        if (!coordinates || coordinates.length === 0) {
            return defaultCenter
        }

        let lat = 0
        let lng = 0

        coordinates.forEach((coord) => {
            lat += coord.lat
            lng += coord.lng
        })

        return {
            lat: lat / coordinates.length,
            lng: lng / coordinates.length,
        }
    }

    // Handle editing a franchise
    const handleEdit = async (franchise: Franchise) => {
        setIsLoading(true)
        try {
            // First reset the form to clear any previous data
            resetFormCompletely()

            // Fetch the full franchise details
            const fullFranchise = await getFranchiseById(franchise._id)

            if (fullFranchise) {
                // Set the editing franchise state
                setEditingFranchise(fullFranchise)

                // Set form values
                setValue("name", fullFranchise.name)
                setValue("cityName", fullFranchise.cityName)
                setValue("branchName", fullFranchise.branchName)
                setValue("totalDeliveryRadius", fullFranchise.totalDeliveryRadius)
                setValue("freeDeliveryRadius", fullFranchise.freeDeliveryRadius)
                setValue("chargePerKm", fullFranchise.chargePerExtraKm)

                // Set location name if available
                if (fullFranchise.location?.locationName) {
                    setValue("locationName", fullFranchise.location.locationName)
                    setLocation(fullFranchise.location)
                }

                if (fullFranchise.assignedManager?._id) {
                    setValue("managerId", fullFranchise.assignedManager._id)
                }

                // Show the form
                setShowForm(true)

                // Wait for the map to be ready
                setTimeout(() => {
                    if (window.google && window.google.maps && mapRef.current) {
                        // Center the map on the polygon
                        const center = calculatePolygonCenter(fullFranchise.polygonCoordinates || [])
                        setMapCenter(center)
                        mapRef.current.setCenter(center)
                        mapRef.current.setZoom(13) // Zoom in to better see the polygon

                        // Load polygon if available Map
                        if (fullFranchise.polygonCoordinates && fullFranchise.polygonCoordinates.length > 0) {
                            // Clear any existing polygon
                            clearPolygon()

                            // Create a new polygon with the saved coordinates
                            const poly = new window.google.maps.Polygon({
                                paths: fullFranchise.polygonCoordinates,
                                fillColor: "#3B82F6",
                                fillOpacity: 0.3,
                                strokeWeight: 2,
                                strokeColor: "#2563EB",
                                clickable: true,
                                editable: true,
                                draggable: true,
                                zIndex: 1,
                            })

                            poly.setMap(mapRef.current)
                            setPolygon(poly)
                            setPolygonCoordinates(fullFranchise.polygonCoordinates)
                            addPolygonListeners(poly)
                        } else {
                            // If no polygon, show a message to create one
                            toast.info("Please draw a service area for this franchise")
                        }

                        // Create a marker for the location if it exists
                        if (fullFranchise.location) {
                            // Clear existing marker
                            if (locationMarker) {
                                locationMarker.setMap(null)
                                setLocationMarker(null)
                            }

                            const marker = new window.google.maps.Marker({
                                position: {
                                    lat: fullFranchise.location.lat,
                                    lng: fullFranchise.location.lang,
                                },
                                map: mapRef.current,
                                title: fullFranchise.location.locationName || fullFranchise.name,
                                draggable: true,
                                animation: window.google.maps.Animation.DROP,
                            })

                            // Add listener for marker drag end
                            window.google.maps.event.addListener(marker, "dragend", () => {
                                const position = marker.getPosition()
                                if (position) {
                                    const newLat = position.lat()
                                    const newLng = position.lng()

                                    setLocation({
                                        locationName: (document.getElementById("locationName") as HTMLInputElement)?.value || "Location",
                                        lat: newLat,
                                        lang: newLng,
                                    })

                                    // Get address for the new location
                                    getAddressFromCoordinates(newLat, newLng)
                                }
                            })

                            setLocationMarker(marker)
                        }
                    }
                }, 500) // Small delay to ensure map is ready
            }
        } catch (error) {
            console.error("Failed to fetch franchise details:", error)
            toast.error("Failed to fetch franchise details")
        } finally {
            setIsLoading(false)
        }
    }

    // Get polygon coordinates
    const getPolygonCoordinates = (poly: google.maps.Polygon): PolygonCoordinate[] => {
        const path = poly.getPath()
        const coordinates: PolygonCoordinate[] = []

        for (let i = 0; i < path.getLength(); i++) {
            const point = path.getAt(i)
            coordinates.push({
                lat: point.lat(),
                lng: point.lng(),
            })
        }

        return coordinates
    }

    // Add listeners for polygon editing
    const addPolygonListeners = (poly: google.maps.Polygon) => {
        // Update coordinates when polygon is edited
        google.maps.event.addListener(poly.getPath(), "set_at", () => {
            const coordinates = getPolygonCoordinates(poly)
            setPolygonCoordinates(coordinates)
        })

        // Update coordinates when polygon is dragged
        google.maps.event.addListener(poly.getPath(), "insert_at", () => {
            const coordinates = getPolygonCoordinates(poly)
            setPolygonCoordinates(coordinates)
        })

        // Update coordinates when polygon is dragged map
        google.maps.event.addListener(poly, "dragend", () => {
            const coordinates = getPolygonCoordinates(poly)
            setPolygonCoordinates(coordinates)
        })
    }

    // Handle map load
    const onMapLoad = useCallback(
        (map: google.maps.Map) => {
            mapRef.current = map

            if (window.google && window.google.maps && hasValidApiKey) {
                // Create a drawing manager with default drawing mode set to polygon
                const drawingManager = new window.google.maps.drawing.DrawingManager({
                    drawingMode: window.google.maps.drawing.OverlayType.POLYGON,
                    drawingControl: true,
                    drawingControlOptions: {
                        position: window.google.maps.ControlPosition.TOP_CENTER,
                        drawingModes: [window.google.maps.drawing.OverlayType.POLYGON],
                    },
                    polygonOptions: {
                        fillColor: "#3B82F6",
                        fillOpacity: 0.3,
                        strokeWeight: 2,
                        strokeColor: "#2563EB",
                        clickable: true,
                        editable: true,
                        draggable: true,
                        zIndex: 1,
                    },
                })

                drawingManager.setMap(map)
                // setDrawingManager(drawingManager) // No longer needed

                // Add a message to guide users Service Area
                const controlDiv = document.createElement("div")
                controlDiv.className = "bg-blue-500 text-white px-3 py-2 rounded-md text-sm font-medium m-2"
                controlDiv.innerHTML = "Draw your service area on the map"
                map.controls[window.google.maps.ControlPosition.TOP_CENTER].push(controlDiv)

                // Add location selection info
                const locationInfoDiv = document.createElement("div")
                locationInfoDiv.className = "bg-green-500 text-white px-3 py-2 rounded-md text-sm font-medium m-2"
                locationInfoDiv.innerHTML = "Right-click to set a location point"
                map.controls[window.google.maps.ControlPosition.TOP_CENTER].push(locationInfoDiv)

                // Add event listener for when polygon is complete
                window.google.maps.event.addListener(drawingManager, "polygoncomplete", (poly: google.maps.Polygon) => {
                    // Switch back to hand tool after drawing is complete
                    drawingManager.setDrawingMode(null)

                    // Set the polygon state
                    setPolygon(poly)

                    // Get polygon coordinates
                    const coordinates = getPolygonCoordinates(poly)
                    setPolygonCoordinates(coordinates)

                    // Update the center location based on polygon
                    const center = calculatePolygonCenter(coordinates)
                    setMapCenter(center)

                    // Add listeners for polygon editing
                    addPolygonListeners(poly)

                    // Show success message
                    toast.success("Service area created! You can edit it by dragging any point.")
                })

                // Add right-click listener for location selection
                map.addListener("rightclick", (e: google.maps.MapMouseEvent) => {
                    // Clear existing marker if any
                    if (locationMarker) {
                        locationMarker.setMap(null)
                        setLocationMarker(null)
                    }

                    // Create a new marker at the clicked position
                    if (e.latLng) {
                        const marker = new window.google.maps.Marker({
                            position: e.latLng,
                            map: map,
                            title: "Location",
                            draggable: true,
                            animation: window.google.maps.Animation.DROP,
                        })

                        const newLat = e.latLng.lat()
                        const newLng = e.latLng.lng()

                        // Set the location state
                        setLocation({
                            locationName: "Location",
                            lat: newLat,
                            lang: newLng,
                        })

                        // Get address for the new location
                        getAddressFromCoordinates(newLat, newLng)

                        // Add listener for marker drag end
                        window.google.maps.event.addListener(marker, "dragend", () => {
                            const position = marker.getPosition()
                            if (position) {
                                const newLat = position.lat()
                                const newLng = position.lng()

                                setLocation({
                                    locationName: (document.getElementById("locationName") as HTMLInputElement)?.value || "Location",
                                    lat: newLat,
                                    lang: newLng,
                                })

                                // Get address for the new location
                                getAddressFromCoordinates(newLat, newLng)
                            }
                        })

                        setLocationMarker(marker)
                        toast.success("Location set! You can drag the marker to adjust.")
                    }
                })

                // Display all franchise locations
                displayAllFranchiseLocations()
            }
        },
        [hasValidApiKey, locationMarker, getAddressFromCoordinates, displayAllFranchiseLocations],
    )

    // Close modal and reset form
    const handleCloseModal = () => {
        setShowForm(false)
        resetFormCompletely()
    }

    // Filter franchises based on search query
    const filteredFranchises = franchises.filter(
        (franchise) =>
            franchise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            franchise.cityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            franchise.branchName.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    // Handle map type change
    const handleMapTypeChange = (type: string) => {
        if (!mapRef.current) return
        setMapType(type)
        mapRef.current.setMapTypeId(type)
    }

    // Loading error state
    if (loadError) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center p-8 bg-gray-800 rounded-lg shadow-xl border border-gray-700 max-w-lg">
                    <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-100 mb-2">Google Maps Failed to Load</h2>
                    <p className="text-gray-400 mb-4">
                        There was an error loading Google Maps. This could be due to an invalid API key, network issues, or API
                        restrictions.
                    </p>
                    <div className="bg-gray-900 p-4 rounded text-left mb-4 overflow-x-auto">
                        <code className="text-sm text-red-400">Error: {loadError.message}</code>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                        Please check your Google Maps API key and make sure it has the correct permissions and billing is enabled.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    // Maps loading state
    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                    <p className="text-gray-300 text-lg">Loading Google Maps...</p>
                </div>
            </div>
        )
    }

    // Initial data loading state
    if (isInitialLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                    <p className="text-gray-300 text-lg">Loading franchise data...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            <Toaster position="top-right" />

            {/* Header */}
            <header className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Building2 className="w-8 h-8 text-blue-400" />
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">FRANCHISE COMPASS</h1>
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
                            Add Franchise
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
                            Add Franchise
                        </button>
                    </div>
                )}
            </header>

            <main className="p-4 sm:p-6 space-y-6">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search franchises..."
                        className="w-full h-12 pl-10 pr-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Franchises List/Grid */}
                <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700">
                    {isLoading && !showForm ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : filteredFranchises.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                            <Building2 className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-lg">No franchises found</p>
                        </div>
                    ) : (
                        <>
                            {/* Table view for medium and large screens */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-700">
                                    <thead className="bg-gray-900">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Franchise
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                City & Branch
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Service Area
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Location
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Delivery Radius
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Manager
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                                        {filteredFranchises.map((franchise) => (
                                            <tr key={franchise._id} className="hover:bg-gray-750">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                                            <Building2 className="w-5 h-5 text-gray-400" />
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-100">{franchise.name}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-300">{franchise.cityName}</div>
                                                    <div className="text-xs text-gray-400">{franchise.branchName}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-300">
                                                        {franchise.polygonCoordinates ? (
                                                            <span className="text-green-400">{franchise.polygonCoordinates.length} points</span>
                                                        ) : (
                                                            <span className="text-yellow-400">No area defined</span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {franchise.polygonCoordinates && franchise.polygonCoordinates.length > 0
                                                            ? "Custom polygon area"
                                                            : "Please define service area"}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-300">
                                                        {franchise.location ? (
                                                            <span className="text-green-400">{franchise.location.locationName || "Set"}</span>
                                                        ) : (
                                                            <span className="text-yellow-400">Not set</span>
                                                        )}
                                                    </div>
                                                    {franchise.location && (
                                                        <div className="text-xs text-gray-400">
                                                            {franchise.location.lat.toFixed(4)}, {franchise.location.lang.toFixed(4)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-300">
                                                        <span className="text-green-400">{franchise.freeDeliveryRadius} km</span> free of{" "}
                                                        <span className="text-blue-400">{franchise.totalDeliveryRadius} km</span>
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        ₹{franchise.chargePerExtraKm}/km after free radius
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-300">{franchise.assignedManager?.name || "Unassigned"}</div>
                                                    {franchise.assignedManager && (
                                                        <div className="text-xs text-gray-400">{franchise.assignedManager.mobileNumber}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        className="text-blue-400 hover:text-blue-300 mr-4 transition-colors"
                                                        onClick={() => handleEdit(franchise)}
                                                        disabled={isLoading}
                                                    >
                                                        <Pencil className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        className="text-red-400 hover:text-red-300 transition-colors"
                                                        onClick={() => handleDelete(franchise._id)}
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

                            {/* Card view for small screens */}
                            <div className="md:hidden grid grid-cols-1 gap-4 p-4">
                                {filteredFranchises.map((franchise) => (
                                    <div key={franchise._id} className="bg-gray-750 rounded-lg shadow-md p-4 border border-gray-700">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                                    <Building2 className="w-5 h-5 text-gray-400" />
                                                </div>
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-gray-100">{franchise.name}</div>
                                                    <div className="text-xs text-gray-400">
                                                        {franchise.cityName}, {franchise.branchName}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    className="p-2 rounded-full bg-gray-800 text-blue-400 hover:text-blue-300 transition-colors"
                                                    onClick={() => handleEdit(franchise)}
                                                    disabled={isLoading}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="p-2 rounded-full bg-gray-800 text-red-400 hover:text-red-300 transition-colors"
                                                    onClick={() => handleDelete(franchise._id)}
                                                    disabled={isLoading}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div className="bg-gray-800 p-2 rounded">
                                                <div className="text-gray-400 mb-1">Service Area</div>
                                                <div className="text-gray-300">
                                                    {franchise.polygonCoordinates ? (
                                                        <span className="text-green-400">{franchise.polygonCoordinates.length} points</span>
                                                    ) : (
                                                        <span className="text-yellow-400">No area defined</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="bg-gray-800 p-2 rounded">
                                                <div className="text-gray-400 mb-1">Location</div>
                                                <div className="text-gray-300">
                                                    {franchise.location ? (
                                                        <span className="text-green-400">Set</span>
                                                    ) : (
                                                        <span className="text-yellow-400">Not set</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="bg-gray-800 p-2 rounded">
                                                <div className="text-gray-400 mb-1">Delivery Radius</div>
                                                <div className="text-gray-300">
                                                    <span className="text-green-400">{franchise.freeDeliveryRadius} km</span> /
                                                    <span className="text-blue-400"> {franchise.totalDeliveryRadius} km</span>
                                                </div>
                                            </div>

                                            <div className="bg-gray-800 p-2 rounded">
                                                <div className="text-gray-400 mb-1">Manager</div>
                                                <div className="text-gray-300">{franchise.assignedManager?.name || "Unassigned"}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Franchise Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-800">
                        <div className="sticky top-0 bg-gray-900 px-6 py-4 border-b border-gray-800 z-10">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-gray-100">
                                    {editingFranchise ? "Edit Franchise" : "Add New Franchise"}
                                </h2>
                                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-200 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Franchise Name</label>
                                    <input
                                        {...register("name")}
                                        className="w-full h-12 px-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {errors.name && <p className="mt-2 text-sm text-red-400">{errors.name.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">City Name</label>
                                    <input
                                        {...register("cityName")}
                                        className="w-full h-12 px-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {errors.cityName && <p className="mt-2 text-sm text-red-400">{errors.cityName.message}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Branch Name</label>
                                <input
                                    {...register("branchName")}
                                    className="w-full h-12 px-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {errors.branchName && <p className="mt-2 text-sm text-red-400">{errors.branchName.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Service Area</label>
                                <div className="space-y-4">
                                    {!hasValidApiKey ? (
                                        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
                                            <MapPin className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-200 mb-2">Google Maps API Key Required</h3>
                                            <p className="text-gray-400 mb-4">
                                                To use the map functionality, you need to provide a valid Google Maps API key.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Map Type Controls */}
                                            <div className="flex mb-2 space-x-2">
                                                {Object.entries(mapTypeOptions).map(([key, value]) => (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        onClick={() => handleMapTypeChange(value)}
                                                        className={`px-3 py-1 text-xs rounded-md ${mapType === value
                                                            ? "bg-blue-500 text-white"
                                                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                                            }`}
                                                    >
                                                        {key.charAt(0) + key.slice(1).toLowerCase()}
                                                    </button>
                                                ))}
                                            </div>
                                            <GoogleMap
                                                mapContainerStyle={mapContainerStyle}
                                                center={mapCenter}
                                                zoom={12}
                                                onLoad={onMapLoad}
                                                options={{
                                                    mapTypeId: mapType,
                                                    mapTypeControl: true,
                                                    mapTypeControlOptions: {
                                                        style: window.google?.maps?.MapTypeControlStyle?.DROPDOWN_MENU,
                                                        position: window.google?.maps?.ControlPosition?.TOP_RIGHT,
                                                    },
                                                    fullscreenControl: true,
                                                    streetViewControl: true,
                                                    zoomControl: true,
                                                    gestureHandling: "greedy",
                                                    disableDoubleClickZoom: false,
                                                }}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Service Area (Polygon) section */}
                            <div className="mt-6">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-300">Service Area Details</label>
                                    {polygon && (
                                        <button
                                            type="button"
                                            onClick={clearPolygon}
                                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                        >
                                            Clear Area
                                        </button>
                                    )}
                                </div>

                                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                    {polygonCoordinates.length > 0 ? (
                                        <div>
                                            <div className="flex items-center text-green-400 mb-2">
                                                <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
                                                <span className="text-sm font-medium">
                                                    Service area defined with {polygonCoordinates.length} points
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 mb-2">
                                                You can edit the area by dragging any point or the entire polygon on the map.
                                            </p>
                                            <div className="mt-2 text-xs text-gray-500">
                                                <details>
                                                    <summary className="cursor-pointer text-blue-400 hover:text-blue-300">
                                                        View Coordinates
                                                    </summary>
                                                    <div className="mt-2 bg-gray-900 p-2 rounded overflow-auto max-h-32">
                                                        <code className="text-xs text-gray-400">{JSON.stringify(polygonCoordinates, null, 2)}</code>
                                                    </div>
                                                </details>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="flex items-center text-yellow-400 mb-2">
                                                <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
                                                <span className="text-sm font-medium">No service area defined</span>
                                            </div>
                                            <p className="text-xs text-gray-400 mb-2">
                                                Click the polygon tool in the map controls, then click on the map to create a custom service
                                                area.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Location Point section */}
                            <div className="mt-6">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-300">Location Point</label>
                                    {locationMarker && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (locationMarker) {
                                                    locationMarker.setMap(null)
                                                    setLocationMarker(null)
                                                }
                                                setLocation(null)
                                                setValue("locationName", "")
                                            }}
                                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                        >
                                            Clear Location
                                        </button>
                                    )}
                                </div>

                                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                    {location ? (
                                        <div>
                                            <div className="flex items-center text-green-400 mb-2">
                                                <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
                                                <span className="text-sm font-medium">
                                                    Location point set at {location.lat.toFixed(6)}, {location.lang.toFixed(6)}
                                                </span>
                                            </div>
                                            <div className="mt-2">
                                                <label className="block text-sm font-medium text-gray-300 mb-2">Location Name</label>
                                                <input
                                                    id="locationName"
                                                    {...register("locationName")}
                                                    className="w-full h-12 px-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="e.g., Main Office, Warehouse, etc."
                                                />
                                            </div>
                                            <p className="text-xs text-gray-400 mt-2">
                                                You can drag the marker on the map to adjust the location.
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="flex items-center text-yellow-400 mb-2">
                                                <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
                                                <span className="text-sm font-medium">No location point set</span>
                                            </div>
                                            <p className="text-xs text-gray-400 mb-2">Right-click on the map to set a location point.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Delivery settings */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Total Delivery Radius (km)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        {...register("totalDeliveryRadius", { valueAsNumber: true })}
                                        className="w-full h-12 px-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., 10"
                                    />
                                    {errors.totalDeliveryRadius && (
                                        <p className="mt-2 text-sm text-red-400">{errors.totalDeliveryRadius.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Free Delivery Radius (km)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        {...register("freeDeliveryRadius", { valueAsNumber: true })}
                                        className="w-full h-12 px-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., 5"
                                    />
                                    {errors.freeDeliveryRadius && (
                                        <p className="mt-2 text-sm text-red-400">{errors.freeDeliveryRadius.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Charge Per Kilometer (₹)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        {...register("chargePerKm", { valueAsNumber: true })}
                                        className="w-full h-12 px-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., 10"
                                    />
                                    {errors.chargePerKm && <p className="mt-2 text-sm text-red-400">{errors.chargePerKm.message}</p>}
                                </div>
                            </div>

                            {/* Manager selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Assigned Manager (Optional)</label>
                                <select
                                    {...register("managerId")}
                                    className="w-full h-12 px-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Select a manager (optional)</option>
                                    {managers.map((manager) => (
                                        <option key={manager._id} value={manager._id}>
                                            {manager.name} - {manager.mobileNumber}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Form buttons */}
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
                                    className="px-6 py-3 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Franchise"
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

export default FranchisePage

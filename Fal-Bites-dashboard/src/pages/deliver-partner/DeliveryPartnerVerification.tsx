"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import {
    Bike,
    Search,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    User,
    FileText,
    Eye,
    ArrowLeft,
    MapPin,
    Briefcase,
    Phone,
    Calendar,
    CreditCard,
    Building,
} from "lucide-react"

// API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api"

// Partner Interface
interface Partner {
    _id: string
    firstName: string
    lastName: string
    gender: string
    tshirtSize: string
    state: string
    profileImageUrl: string
    mobileNumber: string
    vehicleType: string
    city: string
    branch: string
    rank: string
    wallet: number
    incentive: number
    onlineStatus: boolean
    onboardingStatus: string
    assignedBranchId: string
    aadharDetails: {
        aadharNumber: string
        aadharName: string
        aadharImage: string
    }
    panDetails: {
        panNumber: string
        panName: string
        panImage: string
    }
    withdrawalDetails: {
        selectedPrimaryMethod: string
        upiId?: string
        accountNumber?: string
        ifscCode?: string
        bankAccountName?: string
        bankName?: string
    }
    createdAt: string
    updatedAt: string
}

// API Response Interface
interface ApiResponse {
    success: boolean
    data: Partner[]
    message?: string
}

export default function DeliveryPartnerVerificationPage() {
    const [partners, setPartners] = useState<Partner[]>([])
    const [filteredPartners, setFilteredPartners] = useState<Partner[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
    const [statusFilter, setStatusFilter] = useState<string>("pending")
    const [isUpdating, setIsUpdating] = useState(false)
    const [updateMessage, setUpdateMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    // Fetch partners data
    useEffect(() => {
        const fetchPartners = async () => {
            try {
                setIsLoading(true)
                const response = await axios.get<ApiResponse>(`${API_URL}/delivery-partner`)
                if (response.data && response.data.success) {
                    setPartners(response.data.data)
                } else {
                    console.error("Failed to fetch delivery partners:", response.data.message)
                }
            } catch (error) {
                console.error("Error fetching delivery partners:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchPartners()
    }, [])

    // Filter partners based on search query and status
    useEffect(() => {
        let result = partners

        // Filter by status
        if (statusFilter) {
            result = result.filter((partner) => partner.onboardingStatus === statusFilter)
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter((partner) => {
                const fullName = `${partner.firstName} ${partner.lastName}`.toLowerCase()
                return (
                    fullName.includes(query) ||
                    partner.mobileNumber.includes(query) ||
                    partner.city.toLowerCase().includes(query) ||
                    partner.branch.toLowerCase().includes(query)
                )
            })
        }

        setFilteredPartners(result)
    }, [partners, searchQuery, statusFilter])

    // Format date to readable string
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    // Get status badge
    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case "approved":
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approved
                    </span>
                )
            case "rejected":
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        Rejected
                    </span>
                )
            case "pending":
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                    </span>
                )
        }
    }

    // Handle partner selection
    const handleSelectPartner = (partner: Partner) => {
        setSelectedPartner(partner)
        setUpdateMessage(null)
    }

    // Handle back to list
    const handleBackToList = () => {
        setSelectedPartner(null)
    }

    // Update partner status
    const updatePartnerStatus = async (partnerId: string, newStatus: string) => {
        setIsUpdating(true)
        setUpdateMessage(null)

        try {
            const response = await axios.patch(`${API_URL}/delivery-partner/changeStatus/${partnerId}`, {
                onboardingStatus: newStatus,
            })

            if (response.data && response.data.success) {
                // Update partner in state
                const updatedPartners = partners.map((partner) =>
                    partner._id === partnerId ? { ...partner, onboardingStatus: newStatus } : partner,
                )
                setPartners(updatedPartners)

                // Update selected partner if it's the one being updated
                if (selectedPartner && selectedPartner._id === partnerId) {
                    setSelectedPartner({ ...selectedPartner, onboardingStatus: newStatus })
                }

                setUpdateMessage({
                    type: "success",
                    text: `Partner status updated to ${newStatus} successfully`,
                })
            } else {
                setUpdateMessage({
                    type: "error",
                    text: response.data.message || "Failed to update partner status",
                })
            }
        } catch (error) {
            console.error("Error updating partner status:", error)
            setUpdateMessage({
                type: "error",
                text: "An error occurred while updating partner status",
            })
        } finally {
            setIsUpdating(false)
        }
    }

    // Get image URL with proper domain
    const getImageUrl = (path: string) => {
        if (!path) return "/placeholder.svg?height=200&width=200"
        if (path.startsWith("http")) return path
        return `${API_URL}/${path}`
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Bike className="w-8 h-8 text-blue-400" />
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">DELIVERY PARTNER VERIFICATION</h1>
                    </div>
                </div>
            </header>

            <main className="p-4 sm:p-6">
                {selectedPartner ? (
                    // Partner Detail View
                    <div className="space-y-6">
                        {/* Back Button */}
                        <button
                            onClick={handleBackToList}
                            className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Partners List
                        </button>

                        {/* Status Update Message */}
                        {updateMessage && (
                            <div
                                className={`p-4 rounded-lg ${updateMessage.type === "success"
                                    ? "bg-green-900/30 border border-green-700 text-green-200"
                                    : "bg-red-900/30 border border-red-700 text-red-200"
                                    }`}
                            >
                                {updateMessage.type === "success" ? (
                                    <CheckCircle className="inline-block w-5 h-5 mr-2" />
                                ) : (
                                    <XCircle className="inline-block w-5 h-5 mr-2" />
                                )}
                                {updateMessage.text}
                            </div>
                        )}

                        {/* Partner Header */}
                        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        {selectedPartner.profileImageUrl ? (
                                            <img
                                                src={getImageUrl(selectedPartner.profileImageUrl) || "/placeholder.svg"}
                                                alt={`${selectedPartner.firstName} ${selectedPartner.lastName}`}
                                                className="w-20 h-20 rounded-full object-cover border-2 border-gray-700"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center">
                                                <User className="w-10 h-10 text-gray-500" />
                                            </div>
                                        )}
                                        <div
                                            className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-gray-800 ${selectedPartner.onlineStatus ? "bg-green-500" : "bg-gray-500"
                                                }`}
                                        ></div>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{`${selectedPartner.firstName} ${selectedPartner.lastName}`}</h2>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {getStatusBadge(selectedPartner.onboardingStatus)}
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {selectedPartner.rank}
                                            </span>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                <Bike className="w-3 h-3 mr-1" />
                                                {selectedPartner.vehicleType}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => updatePartnerStatus(selectedPartner._id, "approved")}
                                        disabled={isUpdating || selectedPartner.onboardingStatus === "approved"}
                                        className={`px-4 py-2 rounded-md font-medium flex items-center ${selectedPartner.onboardingStatus === "approved"
                                            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                            : "bg-green-600 hover:bg-green-700 text-white"
                                            }`}
                                    >
                                        {isUpdating ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                        )}
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => updatePartnerStatus(selectedPartner._id, "rejected")}
                                        disabled={isUpdating || selectedPartner.onboardingStatus === "rejected"}
                                        className={`px-4 py-2 rounded-md font-medium flex items-center ${selectedPartner.onboardingStatus === "rejected"
                                            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                            : "bg-red-600 hover:bg-red-700 text-white"
                                            }`}
                                    >
                                        {isUpdating ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <XCircle className="w-4 h-4 mr-2" />
                                        )}
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => updatePartnerStatus(selectedPartner._id, "pending")}
                                        disabled={isUpdating || selectedPartner.onboardingStatus === "pending"}
                                        className={`px-4 py-2 rounded-md font-medium flex items-center ${selectedPartner.onboardingStatus === "pending"
                                            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                            : "bg-yellow-600 hover:bg-yellow-700 text-white"
                                            }`}
                                    >
                                        {isUpdating ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Clock className="w-4 h-4 mr-2" />
                                        )}
                                        Mark as Pending
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Partner Details Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Personal Information */}
                            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center">
                                    <User className="w-5 h-5 mr-2 text-blue-400" />
                                    Personal Information
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-400">Full Name</p>
                                        <p className="font-medium">{`${selectedPartner.firstName} ${selectedPartner.lastName}`}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Gender</p>
                                        <p className="font-medium capitalize">{selectedPartner.gender}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">T-shirt Size</p>
                                        <p className="font-medium">{selectedPartner.tshirtSize}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <p className="text-sm text-gray-400">Mobile Number</p>
                                            <p className="font-medium flex items-center">
                                                <Phone className="w-4 h-4 mr-1 text-gray-500" />
                                                {selectedPartner.mobileNumber}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Location</p>
                                        <p className="font-medium flex items-center">
                                            <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                                            {selectedPartner.city}, {selectedPartner.state}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Branch</p>
                                        <p className="font-medium flex items-center">
                                            <Briefcase className="w-4 h-4 mr-1 text-gray-500" />
                                            {selectedPartner.branch}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Joined On</p>
                                        <p className="font-medium flex items-center">
                                            <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                                            {formatDate(selectedPartner.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Aadhar Details */}
                            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center">
                                    <FileText className="w-5 h-5 mr-2 text-blue-400" />
                                    Aadhar Details
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-400">Aadhar Number</p>
                                        <p className="font-medium">{selectedPartner.aadharDetails.aadharNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Aadhar Name</p>
                                        <p className="font-medium">{selectedPartner.aadharDetails.aadharName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Aadhar Image</p>
                                        {selectedPartner.aadharDetails.aadharImage ? (
                                            <div className="mt-2 relative group">
                                                <img
                                                    src={getImageUrl(selectedPartner.aadharDetails.aadharImage) || "/placeholder.svg"}
                                                    alt="Aadhar Card"
                                                    className="w-full h-auto rounded-lg border border-gray-700 object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                    <a
                                                        href={getImageUrl(selectedPartner.aadharDetails.aadharImage)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 bg-blue-600 rounded-full"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </a>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 italic">No image provided</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* PAN Details */}
                            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center">
                                    <CreditCard className="w-5 h-5 mr-2 text-blue-400" />
                                    PAN Details
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-400">PAN Number</p>
                                        <p className="font-medium">{selectedPartner.panDetails.panNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">PAN Name</p>
                                        <p className="font-medium">{selectedPartner.panDetails.panName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">PAN Image</p>
                                        {selectedPartner.panDetails.panImage ? (
                                            <div className="mt-2 relative group">
                                                <img
                                                    src={getImageUrl(selectedPartner.panDetails.panImage) || "/placeholder.svg"}
                                                    alt="PAN Card"
                                                    className="w-full h-auto rounded-lg border border-gray-700 object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                    <a
                                                        href={getImageUrl(selectedPartner.panDetails.panImage)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 bg-blue-600 rounded-full"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </a>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 italic">No image provided</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Bank Details */}
                            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center">
                                    <Building className="w-5 h-5 mr-2 text-blue-400" />
                                    Payment Details
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-400">Primary Method</p>
                                        <p className="font-medium capitalize">{selectedPartner.withdrawalDetails.selectedPrimaryMethod}</p>
                                    </div>

                                    {selectedPartner.withdrawalDetails.selectedPrimaryMethod === "bank" && (
                                        <>
                                            <div>
                                                <p className="text-sm text-gray-400">Bank Name</p>
                                                <p className="font-medium">{selectedPartner.withdrawalDetails.bankName}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-400">Account Holder</p>
                                                <p className="font-medium">{selectedPartner.withdrawalDetails.bankAccountName}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-400">Account Number</p>
                                                <p className="font-medium">{selectedPartner.withdrawalDetails.accountNumber}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-400">IFSC Code</p>
                                                <p className="font-medium">{selectedPartner.withdrawalDetails.ifscCode}</p>
                                            </div>
                                        </>
                                    )}

                                    {selectedPartner.withdrawalDetails.selectedPrimaryMethod === "upi" && (
                                        <div>
                                            <p className="text-sm text-gray-400">UPI ID</p>
                                            <p className="font-medium">{selectedPartner.withdrawalDetails.upiId}</p>
                                        </div>
                                    )}

                                    <div>
                                        <p className="text-sm text-gray-400">Wallet Balance</p>
                                        <p className="font-medium">₹{selectedPartner.wallet.toLocaleString()}</p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-400">Incentive</p>
                                        <p className="font-medium">₹{selectedPartner.incentive.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Profile Image */}
                            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center">
                                    <User className="w-5 h-5 mr-2 text-blue-400" />
                                    Profile Image
                                </h3>
                                {selectedPartner.profileImageUrl ? (
                                    <div className="mt-2 relative group">
                                        <img
                                            src={getImageUrl(selectedPartner.profileImageUrl) || "/placeholder.svg"}
                                            alt="Profile"
                                            className="w-full h-auto rounded-lg border border-gray-700 object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                            <a
                                                href={getImageUrl(selectedPartner.profileImageUrl)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 bg-blue-600 rounded-full"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-48 bg-gray-700 rounded-lg">
                                        <User className="w-16 h-16 text-gray-500" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    // Partners List View
                    <div className="space-y-6">
                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-grow">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search partners..."
                                    className="w-full h-12 pl-10 pr-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <select
                                className="h-12 px-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>

                        {/* Partners List */}
                        {isLoading ? (
                            <div className="flex items-center justify-center p-12">
                                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                            </div>
                        ) : filteredPartners.length === 0 ? (
                            <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
                                <Bike className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                                <h3 className="text-xl font-medium text-gray-300">No partners found</h3>
                                <p className="mt-2 text-gray-400">Try adjusting your search or filter criteria</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredPartners.map((partner) => (
                                    <div
                                        key={partner._id}
                                        className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-blue-500 transition-colors cursor-pointer"
                                        onClick={() => handleSelectPartner(partner)}
                                    >
                                        <div className="p-6">
                                            <div className="flex items-start gap-4">
                                                <div className="relative">
                                                    {partner.profileImageUrl ? (
                                                        <img
                                                            src={getImageUrl(partner.profileImageUrl) || "/placeholder.svg"}
                                                            alt={`${partner.firstName} ${partner.lastName}`}
                                                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-700"
                                                        />
                                                    ) : (
                                                        <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                                                            <User className="w-8 h-8 text-gray-500" />
                                                        </div>
                                                    )}
                                                    <div
                                                        className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-gray-800 ${partner.onlineStatus ? "bg-green-500" : "bg-gray-500"
                                                            }`}
                                                    ></div>
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-lg">{`${partner.firstName} ${partner.lastName}`}</h3>
                                                    <div className="mt-1">{getStatusBadge(partner.onboardingStatus)}</div>
                                                    <div className="mt-2 text-sm text-gray-400 flex flex-col gap-1">
                                                        <div className="flex items-center">
                                                            <Phone className="w-3.5 h-3.5 mr-1" />
                                                            {partner.mobileNumber}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <MapPin className="w-3.5 h-3.5 mr-1" />
                                                            {partner.city}, {partner.branch}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <p className="text-gray-400">Aadhar</p>
                                                    <p className="font-medium">{partner.aadharDetails.aadharNumber}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-400">PAN</p>
                                                    <p className="font-medium">{partner.panDetails.panNumber}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-400">Vehicle</p>
                                                    <p className="font-medium">{partner.vehicleType}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-400">Joined</p>
                                                    <p className="font-medium">{formatDate(partner.createdAt).split(",")[0]}</p>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex justify-end">
                                                <button className="text-blue-400 hover:text-blue-300 text-sm flex items-center">
                                                    View Details
                                                    <Eye className="w-4 h-4 ml-1" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}

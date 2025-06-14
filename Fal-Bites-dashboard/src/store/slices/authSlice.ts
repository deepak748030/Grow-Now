import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import Cookies from "js-cookie"

interface AuthState {
  isAuthenticated: boolean
  user: {
    id?: string
    name?: string
    email?: string
    phone?: string // Added phone field to match API response
  } | null
}

// Check if we're in a browser environment before accessing cookies
const token = typeof window !== "undefined" ? Cookies.get("token") : null

const initialState: AuthState = {
  isAuthenticated: !!token,
  user: null,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: AuthState["user"]
        token: string
        message?: string // Optional message field from API response
      }>,
    ) => {
      const { user, token } = action.payload
      state.user = user
      state.isAuthenticated = true

      // Set token in cookie with expiration based on your needs
      // You might want to extract expiration from the JWT token
      Cookies.set("token", token, {
        secure: true,
        expires: 7, // Example: 7 days, adjust as needed
        sameSite: "strict",
      })

      // You might also want to store the user in localStorage for persistence
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(user))
      }
    },
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      Cookies.remove("token")

      // Clear any local storage data
      if (typeof window !== "undefined") {
        localStorage.removeItem("user")
      }
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer

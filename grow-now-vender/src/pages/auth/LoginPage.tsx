"use client"
import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { User, Lock, Eye, EyeOff, Building } from "lucide-react"

// Import API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  brandName: z.string().min(1, "Brand name is required"),
})

type LoginFormData = z.infer<typeof loginSchema>
type SignupFormData = z.infer<typeof signupSchema>

export default function LoginPage() {
  const [isLogin, setIsLogin] = React.useState(true)
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/vendors/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || "Login failed")
      }

      // Store vendor data in localStorage
      localStorage.setItem("vendorData", JSON.stringify(responseData.data))

      // Redirect to products page
      window.location.href = "/"
    } catch (error) {
      console.error("Login failed:", error)
      setError(error instanceof Error ? error.message : "Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const onSignupSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/vendors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          username: data.username,
          password: data.password,
          brandName: data.brandName,
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || "Signup failed")
      }

      // Store vendor data in localStorage
      localStorage.setItem("vendorData", JSON.stringify(responseData.data))

      // Redirect to products page
      window.location.href = "/products"
    } catch (error) {
      console.error("Signup failed:", error)
      setError(error instanceof Error ? error.message : "Signup failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {isLogin ? "Sign in to your vendor account" : "Join as a vendor"}
            </p>
          </div>

          {isLogin ? (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="mt-8 space-y-6">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  {...loginForm.register("username")}
                  type="text"
                  placeholder="Username"
                  className="pl-10"
                  error={loginForm.formState.errors.username?.message}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  {...loginForm.register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="pl-10 pr-10"
                  error={loginForm.formState.errors.password?.message}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          ) : (
            <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="mt-8 space-y-6">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  {...signupForm.register("name")}
                  type="text"
                  placeholder="Full Name"
                  className="pl-10"
                  error={signupForm.formState.errors.name?.message}
                />
              </div>

              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  {...signupForm.register("username")}
                  type="text"
                  placeholder="Username"
                  className="pl-10"
                  error={signupForm.formState.errors.username?.message}
                />
              </div>

              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  {...signupForm.register("brandName")}
                  type="text"
                  placeholder="Brand Name"
                  className="pl-10"
                  error={signupForm.formState.errors.brandName?.message}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  {...signupForm.register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="pl-10 pr-10"
                  error={signupForm.formState.errors.password?.message}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin)
                setError(null)
                loginForm.reset()
                signupForm.reset()
              }}
              className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

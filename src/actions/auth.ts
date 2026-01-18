"use server"

import axios from "axios"
import { redirect } from "next/navigation"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

interface RegisterData {
  username: string
  email: string
  password: string
}

interface LoginData {
  identifier: string
  password: string
}

export async function registerUserAction(data: RegisterData) {
  try {
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      username: data.username,
      email: data.email,
      password: data.password,
    })

    if (response.data) {
      return { success: true, message: "Registration successful!" }
    }
  } catch (error: any) {
    if (error.response?.data?.error) {
      return {
        success: false,
        message: error.response.data.error || "Registration failed",
      }
    }
    return { success: false, message: "Registration failed. Please try again." }
  }

  redirect("/login")
}

export async function loginUserAction(data: LoginData) {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      identifier: data.identifier,
      password: data.password,
    })

    if (response.data && response.data.jwt) {
      return {
        success: true,
        jwt: response.data.jwt,
        user: response.data.user,
        message: "Login successful!",
      }
    }

    return { success: false, message: "Invalid credentials" }
  } catch (error: any) {
    if (error.response?.data?.error) {
      return {
        success: false,
        message: error.response.data.error || "Login failed",
      }
    }
    return { success: false, message: "Login failed. Please try again." }
  }
}

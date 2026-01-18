"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle2, XCircle, Info, AlertTriangle } from "lucide-react"

// Icon mapping based on toast variant
const getToastIcon = (variant?: string | null) => {
  switch (variant) {
    case "success":
      return (
        <div className="shrink-0 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
          <CheckCircle2 className="h-5 w-5 text-white" />
        </div>
      )
    case "error":
    case "destructive":
      return (
        <div className="shrink-0 w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
          <XCircle className="h-5 w-5 text-white" />
        </div>
      )
    case "info":
      return (
        <div className="shrink-0 w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
          <Info className="h-5 w-5 text-white" />
        </div>
      )
    case "warning":
      return (
        <div className="shrink-0 w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-white" />
        </div>
      )
    default:
      return null
  }
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3 w-full">
              {getToastIcon(variant)}
              <div className="grid gap-1 flex-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { AlertTriangle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  className?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary] Caught error:", error)
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 px-6 py-16 text-center",
            this.props.className
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-foreground">
            Something went wrong
          </h3>
          <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
            An unexpected error occurred while rendering this section. Try
            refreshing or click below to retry.
          </p>
          {this.state.error && (
            <pre className="mt-4 max-w-md overflow-auto rounded-md bg-zinc-800/50 px-4 py-2 text-left text-xs text-red-300/80">
              {this.state.error.message}
            </pre>
          )}
          <Button
            onClick={this.handleReset}
            variant="outline"
            size="sm"
            className="mt-6"
          >
            <RotateCcw className="mr-2 h-3.5 w-3.5" />
            Try again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

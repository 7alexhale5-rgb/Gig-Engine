"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface SelectContextValue {
  value: string
  onValueChange: (value: string) => void
  label: string
  onLabelChange: (label: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
  contentId: string
}

const SelectContext = React.createContext<SelectContextValue>({
  value: "",
  onValueChange: () => {},
  label: "",
  onLabelChange: () => {},
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
  contentId: "",
})

interface SelectProps {
  children: React.ReactNode
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}

function Select({
  children,
  defaultValue = "",
  value: controlledValue,
  onValueChange,
}: SelectProps) {
  const [uncontrolledValue, setUncontrolledValue] =
    React.useState(defaultValue)
  const [label, setLabel] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const contentId = React.useId()

  const value =
    controlledValue !== undefined ? controlledValue : uncontrolledValue
  const handleValueChange = React.useCallback(
    (newValue: string) => {
      setUncontrolledValue(newValue)
      onValueChange?.(newValue)
    },
    [onValueChange]
  )

  return (
    <SelectContext.Provider
      value={{ value, onValueChange: handleValueChange, label, onLabelChange: setLabel, open, setOpen, triggerRef, contentId }}
    >
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  )
}

function useSelect() {
  return React.useContext(SelectContext)
}

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { open, setOpen, triggerRef, contentId } = useSelect()

  const combinedRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current =
        node
      if (typeof ref === "function") ref(node)
      else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
    },
    [ref, triggerRef]
  )

  return (
    <button
      ref={combinedRef}
      type="button"
      role="combobox"
      aria-expanded={open}
      aria-controls={contentId}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        className
      )}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="ml-2 h-4 w-4 opacity-50"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

interface SelectValueProps extends React.HTMLAttributes<HTMLSpanElement> {
  placeholder?: string
}

const SelectValue = React.forwardRef<HTMLSpanElement, SelectValueProps>(
  ({ placeholder, className, ...props }, ref) => {
    const { value, label } = useSelect()

    return (
      <span ref={ref} className={cn(className)} {...props}>
        {label || value || placeholder}
      </span>
    )
  }
)
SelectValue.displayName = "SelectValue"

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { open, setOpen, contentId } = useSelect()

  React.useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest("[role=combobox]") && !target.closest("[role=listbox]")) {
        setOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open, setOpen])

  if (!open) return null

  return (
    <div
      ref={ref}
      id={contentId}
      role="listbox"
      className={cn(
        "absolute z-50 mt-1 max-h-60 min-w-[8rem] w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
SelectContent.displayName = "SelectContent"

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  disabled?: boolean
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value, disabled = false, ...props }, ref) => {
    const { value: selectedValue, onValueChange, onLabelChange, setOpen } = useSelect()
    const isSelected = selectedValue === value

    return (
      <div
        ref={ref}
        role="option"
        aria-selected={isSelected}
        data-disabled={disabled || undefined}
        className={cn(
          "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          disabled && "pointer-events-none opacity-50",
          className
        )}
        onClick={() => {
          if (!disabled) {
            onValueChange(value)
            onLabelChange(typeof children === 'string' ? children : value)
            setOpen(false)
          }
        }}
        {...props}
      >
        {isSelected && (
          <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
        <span>{children}</span>
      </div>
    )
  }
)
SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }

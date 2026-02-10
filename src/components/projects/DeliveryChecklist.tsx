"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  CheckCircle2,
  Circle,
  Plus,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import type { ChecklistItem } from "@/lib/supabase/types"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return crypto.randomUUID()
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface DeliveryChecklistProps {
  items: ChecklistItem[]
  onUpdate: (items: ChecklistItem[]) => void
  className?: string
}

export function DeliveryChecklist({
  items,
  onUpdate,
  className,
}: DeliveryChecklistProps) {
  const [newItemText, setNewItemText] = useState("")

  const totalItems = items.length
  const completedItems = items.filter((item) => item.completed).length
  const progressPercent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

  // Toggle an item's completed state
  const toggleItem = useCallback(
    (id: string) => {
      const updated = items.map((item) => {
        if (item.id !== id) return item
        return {
          ...item,
          completed: !item.completed,
          completed_at: !item.completed ? new Date().toISOString() : undefined,
        }
      })
      onUpdate(updated)
    },
    [items, onUpdate]
  )

  // Add a new item
  const addItem = useCallback(() => {
    const text = newItemText.trim()
    if (!text) return

    const newItem: ChecklistItem = {
      id: generateId(),
      text,
      completed: false,
    }
    onUpdate([...items, newItem])
    setNewItemText("")
  }, [items, newItemText, onUpdate])

  // Remove an item
  const removeItem = useCallback(
    (id: string) => {
      onUpdate(items.filter((item) => item.id !== id))
    },
    [items, onUpdate]
  )

  // Move an item up
  const moveUp = useCallback(
    (index: number) => {
      if (index <= 0) return
      const updated = [...items]
      const temp = updated[index - 1]
      updated[index - 1] = updated[index]
      updated[index] = temp
      onUpdate(updated)
    },
    [items, onUpdate]
  )

  // Move an item down
  const moveDown = useCallback(
    (index: number) => {
      if (index >= items.length - 1) return
      const updated = [...items]
      const temp = updated[index + 1]
      updated[index + 1] = updated[index]
      updated[index] = temp
      onUpdate(updated)
    },
    [items, onUpdate]
  )

  // Handle Enter key in the add-item input
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        addItem()
      }
    },
    [addItem]
  )

  return (
    <div className={cn("space-y-4", className)}>
      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            Checklist Progress
          </span>
          <span className="text-muted-foreground">
            {completedItems}/{totalItems} complete ({Math.round(progressPercent)}%)
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              progressPercent === 100
                ? "bg-green-500"
                : progressPercent > 50
                  ? "bg-blue-500"
                  : "bg-amber-500"
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Checklist items */}
      <ul className="space-y-1">
        {items.map((item, index) => (
          <li
            key={item.id}
            className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50"
          >
            {/* Checkbox toggle */}
            <button
              type="button"
              onClick={() => toggleItem(item.id)}
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={
                item.completed
                  ? `Mark "${item.text}" as incomplete`
                  : `Mark "${item.text}" as complete`
              }
            >
              {item.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5" />
              )}
            </button>

            {/* Item text */}
            <span
              className={cn(
                "flex-1 text-sm",
                item.completed && "text-muted-foreground line-through"
              )}
            >
              {item.text}
            </span>

            {/* Reorder buttons */}
            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                aria-label="Move up"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => moveDown(index)}
                disabled={index === items.length - 1}
                className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                aria-label="Move down"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Delete button */}
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
              aria-label={`Delete "${item.text}"`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>

      {/* Empty state */}
      {totalItems === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No checklist items yet. Add your first task below.
        </p>
      )}

      {/* Add new item */}
      <div className="flex items-center gap-2">
        <Input
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a new checklist item..."
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          disabled={!newItemText.trim()}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add
        </Button>
      </div>
    </div>
  )
}

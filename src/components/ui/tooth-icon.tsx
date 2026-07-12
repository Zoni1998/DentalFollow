import * as React from "react"
import { LucideProps } from "lucide-react"

export function ToothIcon({ className, ...props }: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M6 8V6a6 6 0 0 1 12 0v2c0 2-2 4-2 6v4a2 2 0 0 1-2 2h-1a1 1 0 0 1-1-1v-3a1 1 0 0 0-2 0v3a1 1 0 0 1-1 1H8a2 2 0 0 1-2-2v-4c0-2-2-4-2-6z" />
    </svg>
  )
}

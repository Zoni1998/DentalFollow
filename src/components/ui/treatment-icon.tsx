import type { LucideProps } from "lucide-react";

export function TreatmentIcon({ className, ...props }: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M5.5 13.5c1.7 3.5 4 5.25 6.5 5.25s4.8-1.75 6.5-5.25" />
      <path d="m12 4 .72 2.28L15 7l-2.28.72L12 10l-.72-2.28L9 7l2.28-.72L12 4Z" />
      <path d="m18.5 7 .35 1.15L20 8.5l-1.15.35L18.5 10l-.35-1.15L17 8.5l1.15-.35L18.5 7Z" />
    </svg>
  );
}

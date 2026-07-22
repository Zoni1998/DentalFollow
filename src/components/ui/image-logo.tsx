import Image from "next/image";

export function ImageLogo({ className }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
      {/* Logo em SVG puro — substitui o PNG de 1.3MB */}
      <svg
        width="100"
        height="100"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-foreground"
        aria-label="Logo"
      >
        {/* Ícone de dente estilo médico/odontológico */}
        <path d="M12 5C10 2 7 2 5 5C3 7 3 10 4 12C5 14 7 16 7 18V22H17V18C17 16 19 14 20 12C21 10 21 7 19 5C17 2 14 2 12 5Z" />
        <path d="M12 5V15" />
        <path d="M9 9L8.5 9" />
        <path d="M15 9L15.5 9" />
        <path d="M9 12L8 12" />
        <path d="M15 12L16 12" />
      </svg>
    </div>
  );
}
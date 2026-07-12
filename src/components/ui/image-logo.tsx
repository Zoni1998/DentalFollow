import Image from "next/image";

export function ImageLogo({ className }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden mix-blend-screen ${className}`}>
      <Image 
        src="/tooth-logo.png" 
        alt="Logo" 
        width={100} 
        height={100}
        // Applying invert and hue-rotate to remove white background (inverted to black -> screen makes black transparent)
        // while preserving the original color tone via hue-rotate.
        className="object-cover scale-[1.7] filter invert-[1] hue-rotate-[180deg] brightness-125"
      />
    </div>
  );
}

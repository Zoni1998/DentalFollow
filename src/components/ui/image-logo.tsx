import Image from "next/image";

export function ImageLogo({ className }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className ?? ""}`}>
      <Image
        src="/dentalfollow-mark.png"
        alt="DentalFollow"
        fill
        sizes="48px"
        className="object-contain"
        priority
      />
    </div>
  );
}

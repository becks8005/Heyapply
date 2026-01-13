import Image from "next/image"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function Logo({ className = "", size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-auto",
    md: "h-8 w-auto",
    lg: "h-12 w-auto"
  }

  return (
    <div className={`flex items-center ${className}`}>
      {/* Logo SVG from public folder - contains logo and text */}
      <Image
        src="/HeyapplyLogo.svg"
        alt="Heyapply Logo"
        width={120}
        height={40}
        className={sizeClasses[size]}
        priority
      />
    </div>
  )
}

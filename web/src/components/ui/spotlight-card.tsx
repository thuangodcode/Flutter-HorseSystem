import type { ReactNode } from "react";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
}

export function SpotlightCard({ children, className = "" }: SpotlightCardProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <div className="w-full h-full spotlight-card-outer animate-border-custom">
        <div className="relative z-10 w-full h-full bg-[var(--surface)] rounded-2xl overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

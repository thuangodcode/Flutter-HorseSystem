import { useEffect } from "react";
import type { ReactNode } from "react";

let stylesInjected = false;

const injectGlobalStyles = () => {
  if (stylesInjected) return;
  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes move-gradient {
      0% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0% 50%;
      }
    }
  `;
  document.head.appendChild(style);
  stylesInjected = true;
};

interface GradientProps {
  children: ReactNode;
  className?: string;
}

const GradientCard = ({ children, className = "" }: GradientProps) => {
  useEffect(() => {
    injectGlobalStyles();
  }, []);

  return (
    <div className={`relative group h-full ${className}`}>
      {/* Blurred glowing shadow behind the card */}
      <div
        className="absolute -inset-1 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"
        style={{
          backgroundSize: "200% 200%",
          animation: "move-gradient 4s ease-in-out infinite",
        }}
      ></div>

      {/* The actual border with 1px padding */}
      <div
        className="relative h-full rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-blue-500 p-[1px] transition-all duration-500"
        style={{
          backgroundSize: "200% 200%",
          animation: "move-gradient 4s ease-in-out infinite",
        }}
      >
        {/* Inner container to hold children and cover the gradient */}
        <div className="h-full w-full rounded-2xl bg-[var(--surface)] overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};

export { GradientCard };

import { Shuffle } from "lucide-react"

/**
 * Props for the ShuffleButton component
 */
interface ShuffleButtonProps {
  /**
   * Function to call when the button is clicked
   */
  onClick: () => void
}

export function ShuffleButton({ onClick }: ShuffleButtonProps) {
  return (
    <button
      onClick={onClick}
      className="shuffle-button-inner relative flex items-center justify-center w-20 h-20 rounded-full 
                border-2 border-[hsl(var(--border))]
                bg-[hsl(var(--background))]
                transition-all duration-300 ease-in-out 
                hover:scale-110 active:scale-95
                cursor-pointer outline-none"
      style={{ 
        WebkitTapHighlightColor: 'transparent', 
        touchAction: 'manipulation'
      }}
    >
      {/* Icon container - this will spin */}
      <div className="shuffle-icon-container absolute top-[20%] left-1/2 -translate-x-1/2 cursor-pointer">
        <Shuffle className="w-6 h-6 cursor-pointer" />
      </div>
      
      {/* Text container - this stays static */}
      <span className="shuffle-text absolute bottom-[20%] left-1/2 -translate-x-1/2
                     text-sm font-medium
                     transition-colors duration-300
                     cursor-pointer">
        Shuffle
      </span>
    </button>
  )
} 
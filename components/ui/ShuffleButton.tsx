import { Shuffle } from "lucide-react"

interface ShuffleButtonProps {
  onClick: () => void
}

export function ShuffleButton({ onClick }: ShuffleButtonProps) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center justify-center w-20 h-20 group cursor-pointer"
      style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
    >
      <div className="relative flex items-center justify-center w-20 h-20 rounded-full 
                    border-2 border-[hsl(var(--border))] bg-transparent
                    transition-all duration-300 ease-in-out 
                    group-hover:scale-110
                    group-hover:border-transparent 
                    group-hover:bg-[hsl(240_10%_20%)]
                    dark:group-hover:bg-[hsl(0deg_0%_12%)]
                    group-active:scale-95
                    group-hover:[background:linear-gradient(hsl(240_10%_20%),hsl(240_10%_20%))_padding-box,linear-gradient(var(--angle),#00ffcc,#9933ff,#ff00ff,#00ffcc)_border-box]
                    dark:group-hover:[background:linear-gradient(hsl(0deg_0%_12%),hsl(0deg_0%_12%))_padding-box,linear-gradient(var(--angle),#00ffcc,#9933ff,#ff00ff,#00ffcc)_border-box]
                    group-hover:[animation:rotate_4s_linear_infinite]
                    cursor-pointer"
      >
        {/* Icon container - this will spin */}
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 
                      group-hover:animate-spin
                      cursor-pointer">
          <Shuffle className="w-6 h-6 cursor-pointer" />
        </div>
        
        {/* Text container - this stays static */}
        <span className="absolute bottom-[20%] left-1/2 -translate-x-1/2
                       text-sm font-medium
                       transition-colors duration-300
                       group-hover:text-white
                       cursor-pointer">
          Shuffle
        </span>
      </div>
    </button>
  )
} 
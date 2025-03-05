import Image from "next/image"
import Link from "next/link"

/**
 * Props for the Profile component
 */
interface ProfileProps {}

export function Profile({}: ProfileProps) {
  return (
    <section className="p-12">
      <div className="flex flex-col md:flex-row items-center justify-center gap-8">
        <div className="relative w-48 h-48 shrink-0">
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <Image 
              src="/benbodhi.png?height=300&width=300" 
              alt="Profile" 
              fill 
              sizes="(max-width: 768px) 192px, 192px"
              className="object-cover rounded-full" 
              priority 
            />
          </div>
          <div className="absolute -inset-3 rounded-full border border-primary/20"></div>
        </div>

        <div className="flex flex-col items-center md:items-start max-w-2xl">
          <h1 className="text-4xl font-bold mb-2 font-nns">Benbodhi</h1>
          <h2 className="text-xl text-muted-foreground mb-4">The Life, The Mind, The Man</h2>

          <p className="text-center md:text-left mb-6">
            Explore the branches of the Benbodhi Tree
          </p>

          <div className="flex gap-4">
            <Link
              href="https://warpcast.com/benbodhi"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
              aria-label="Farcaster Profile"
            >
              <svg className="h-6 w-6" viewBox="0 2 32 32" fill="currentColor">
                <path
                  transform="translate(0, 2)"
                  d="M5.507 0.072L26.097 0.072L26.097 4.167L31.952 4.167L30.725 8.263L29.686 8.263L29.686 24.833C30.207 24.833 30.63 25.249 30.63 25.763L30.63 26.88L30.819 26.88C31.341 26.88 31.764 27.297 31.764 27.811L31.764 28.928L21.185 28.928L21.185 27.811C21.185 27.297 21.608 26.88 22.13 26.88L22.319 26.88L22.319 25.763C22.319 25.316 22.639 24.943 23.065 24.853L23.045 15.71C22.711 12.057 19.596 9.194 15.802 9.194C12.008 9.194 8.893 12.057 8.559 15.71L8.539 24.845C9.043 24.919 9.663 25.302 9.663 25.763L9.663 26.88L9.852 26.88C10.373 26.88 10.796 27.297 10.796 27.811L10.796 28.928L0.218 28.928L0.218 27.811C0.218 27.297 0.641 26.88 1.162 26.88L1.351 26.88L1.351 25.763C1.351 25.249 1.774 24.833 2.296 24.833L2.296 8.263L1.257 8.263L0.029 4.167L5.507 4.167L5.507 0.072Z"
                />
              </svg>
            </Link>
            <Link
              href="https://x.com/benbodhi"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
              aria-label="𝕏 Profile"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </Link>
            <Link
              href="https://github.com/benbodhi"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
              aria-label="GitHub Profile"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.5.75C6.146.75 1 5.896 1 12.25c0 5.089 3.292 9.387 7.863 10.91.575.101.79-.244.79-.546 0-.273-.014-1.178-.014-2.142-2.889.532-3.636-.704-3.866-1.35-.13-.331-.69-1.352-1.18-1.625-.402-.216-.977-.748-.014-.762.906-.014 1.553.834 1.769 1.179 1.035 1.74 2.688 1.25 3.349.948.1-.747.402-1.25.733-1.538-2.559-.287-5.232-1.279-5.232-5.678 0-1.25.445-2.285 1.178-3.09-.115-.288-.517-1.467.115-3.048 0 0 .963-.302 3.163 1.179.92-.259 1.897-.388 2.875-.388.977 0 1.955.13 2.875.388 2.2-1.495 3.162-1.179 3.162-1.179.633 1.581.23 2.76.115 3.048.733.805 1.179 1.825 1.179 3.09 0 4.413-2.688 5.39-5.247 5.678.417.36.776 1.05.776 2.128 0 1.538-.014 2.774-.014 3.162 0 .302.216.662.79.547C20.709 21.637 24 17.324 24 12.25 24 5.896 18.854.75 12.5.75Z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}


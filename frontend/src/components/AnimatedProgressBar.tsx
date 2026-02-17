interface AnimatedProgressBarProps {
  progress: number
  label?: string
  showPercentage?: boolean
}

export default function AnimatedProgressBar({
  progress,
  label = 'Crafting...',
  showPercentage = true,
}: AnimatedProgressBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-gaming-purple font-bold">⚒️ {label}</span>
        {showPercentage && <span className="text-gaming-gold font-bold">{Math.round(progress)}%</span>}
      </div>
      <div className="w-full bg-gaming-darker rounded-full h-4 overflow-hidden border border-gaming-purple/30">
        <div
          className="h-full bg-gradient-to-r from-gaming-purple to-gaming-cyan transition-all duration-300 shadow-glow animate-progress-pulse"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

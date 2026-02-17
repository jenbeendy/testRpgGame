import { useEffect, useState } from 'react'

interface AnimatedResultProps {
  success: boolean
  message: string
  xp?: number
  onAnimationComplete?: () => void
}

export default function AnimatedResult({
  success,
  message,
  xp = 0,
  onAnimationComplete,
}: AnimatedResultProps) {
  const [showXp, setShowXp] = useState(false)

  useEffect(() => {
    if (xp > 0) {
      const timer = setTimeout(() => setShowXp(true), 200)
      return () => clearTimeout(timer)
    }
  }, [xp])

  const containerClass = success
    ? 'animate-success-flash bg-gaming-green/20 border-gaming-green/50'
    : 'animate-failure-shake bg-red-900/20 border-red-500/50'

  return (
    <div className={`relative p-4 rounded-lg border transition-all ${containerClass}`}>
      <p className={`font-bold text-lg ${success ? 'text-gaming-green' : 'text-red-300'}`}>
        {success ? '✨ Crafted!' : '❌ Failed!'}
      </p>
      <p className={`text-sm mt-1 ${success ? 'text-gaming-green' : 'text-red-200'}`}>
        {message}
      </p>

      {/* XP Gain Animation */}
      {showXp && xp > 0 && (
        <div className="absolute top-2 right-2 animate-xp-float text-gaming-gold font-bold text-lg">
          +{xp} XP
        </div>
      )}
    </div>
  )
}

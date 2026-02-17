import { useEffect, useState } from 'react'

interface AnimatedFloatingTextProps {
  text: string
  x?: number
  y?: number
  color?: string
}

export default function AnimatedFloatingText({
  text,
  x = 0,
  y = 0,
  color = 'text-gaming-gold',
}: AnimatedFloatingTextProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <div
      className={`fixed pointer-events-none animate-xp-float font-bold text-lg ${color}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        textShadow: '0 0 10px rgba(0,0,0,0.8)',
      }}
    >
      {text}
    </div>
  )
}

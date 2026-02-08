import { useMemo } from 'react'

export function Sparkline({ data, color = 'primary', width = 100, height = 32 }) {
  const path = useMemo(() => {
    if (!data || data.length < 2) return ''
    
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${x},${y}`
    })
    
    return `M${points.join(' L')}`
  }, [data, width, height])

  const gradientId = useMemo(() => `sparkline-${Math.random().toString(36).substr(2, 9)}`, [])
  
  const isPositive = data && data.length >= 2 && data[data.length - 1] >= data[0]
  const strokeColor = color === 'auto' 
    ? (isPositive ? '#10b981' : '#ef4444')
    : color === 'primary' 
      ? '#8b5cf6' 
      : color

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

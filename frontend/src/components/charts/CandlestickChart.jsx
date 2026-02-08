import { useState, useMemo, useCallback } from 'react'
import { 
  ComposedChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  ReferenceArea
} from 'recharts'
import { useLanguage } from '../../context/LanguageContext'
import { ZoomIn, ZoomOut } from 'lucide-react'

const RANGE_OPTIONS = [
  { key: '1W', days: 7, labelKey: 'chart.range1W' },
  { key: '1M', days: 30, labelKey: 'chart.range1M' },
  { key: '3M', days: 90, labelKey: 'chart.range3M' },
  { key: '6M', days: 180, labelKey: 'chart.range6M' },
  { key: '1Y', days: 365, labelKey: 'chart.range1Y' },
  { key: 'ALL', days: null, labelKey: 'chart.rangeAll' },
]

// Custom candlestick shape
function Candlestick(props) {
  const { x, y, width, height, payload } = props
  const { open, close, high, low } = payload
  
  if (!open || !close || !high || !low) return null
  
  const isUp = close >= open
  const color = isUp ? '#22c55e' : '#ef4444'
  const bodyHeight = Math.max(Math.abs(close - open), 1)
  
  // Calculate positions
  const candleWidth = Math.max(width * 0.6, 4)
  const wickWidth = 1
  const centerX = x + width / 2
  
  // Scale calculations
  const yScale = height / (high - low || 1)
  const bodyY = y + (high - Math.max(open, close)) * yScale
  const bodyBottom = y + (high - Math.min(open, close)) * yScale
  const wickTop = y
  const wickBottom = y + height
  
  return (
    <g>
      {/* Wick (high-low line) */}
      <line
        x1={centerX}
        x2={centerX}
        y1={wickTop}
        y2={wickBottom}
        stroke={color}
        strokeWidth={wickWidth}
      />
      {/* Body (open-close rectangle) */}
      <rect
        x={centerX - candleWidth / 2}
        y={bodyY}
        width={candleWidth}
        height={Math.max(bodyBottom - bodyY, 2)}
        fill={isUp ? color : color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  )
}

// Custom tooltip
function CustomTooltip({ active, payload, label }) {
  const { t } = useLanguage()
  
  if (!active || !payload || !payload.length) return null
  
  const data = payload[0]?.payload
  if (!data) return null
  
  const isUp = data.close >= data.open
  
  return (
    <div className="bg-white border border-surface-200 rounded-xl p-3 shadow-lg">
      <p className="font-semibold text-surface-900 mb-2">{data.date}</p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-surface-500">{t('common.open')}:</span>
          <span className="font-medium">{data.open?.toFixed(2)} TND</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-surface-500">{t('common.high')}:</span>
          <span className="font-medium text-success-600">{data.high?.toFixed(2)} TND</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-surface-500">{t('common.low')}:</span>
          <span className="font-medium text-danger-600">{data.low?.toFixed(2)} TND</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-surface-500">{t('common.close')}:</span>
          <span className={`font-medium ${isUp ? 'text-success-600' : 'text-danger-600'}`}>
            {data.close?.toFixed(2)} TND
          </span>
        </div>
        {data.volume && (
          <div className="flex justify-between gap-4 pt-1 border-t border-surface-100">
            <span className="text-surface-500">{t('common.volume')}:</span>
            <span className="font-medium">{data.volume.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function CandlestickChart({ 
  data = [], 
  onRangeChange,
  showVolume = true,
  height = 400
}) {
  const { t } = useLanguage()
  const [selectedRange, setSelectedRange] = useState('1M')
  const [zoomLevel, setZoomLevel] = useState(1)
  const [refAreaLeft, setRefAreaLeft] = useState(null)
  const [refAreaRight, setRefAreaRight] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  // Filter data based on selected range
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    const range = RANGE_OPTIONS.find(r => r.key === selectedRange)
    if (!range || !range.days) return data
    
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - range.days)
    
    return data.filter(item => {
      const itemDate = new Date(item.date)
      return itemDate >= cutoffDate
    })
  }, [data, selectedRange])

  // Apply zoom
  const zoomedData = useMemo(() => {
    if (zoomLevel === 1) return filteredData
    
    const centerIndex = Math.floor(filteredData.length / 2)
    const visibleCount = Math.floor(filteredData.length / zoomLevel)
    const startIndex = Math.max(0, centerIndex - Math.floor(visibleCount / 2))
    const endIndex = Math.min(filteredData.length, startIndex + visibleCount)
    
    return filteredData.slice(startIndex, endIndex)
  }, [filteredData, zoomLevel])

  // Calculate price domain
  const priceDomain = useMemo(() => {
    if (!zoomedData || zoomedData.length === 0) return [0, 100]
    
    const highs = zoomedData.map(d => d.high).filter(Boolean)
    const lows = zoomedData.map(d => d.low).filter(Boolean)
    
    if (highs.length === 0 || lows.length === 0) return [0, 100]
    
    const minPrice = Math.min(...lows)
    const maxPrice = Math.max(...highs)
    const padding = (maxPrice - minPrice) * 0.1
    
    return [minPrice - padding, maxPrice + padding]
  }, [zoomedData])

  // Volume domain
  const volumeDomain = useMemo(() => {
    if (!zoomedData || zoomedData.length === 0) return [0, 1000]
    const volumes = zoomedData.map(d => d.volume).filter(Boolean)
    if (volumes.length === 0) return [0, 1000]
    return [0, Math.max(...volumes) * 1.1]
  }, [zoomedData])

  const handleRangeChange = (rangeKey) => {
    setSelectedRange(rangeKey)
    setZoomLevel(1)
    if (onRangeChange) {
      onRangeChange(rangeKey)
    }
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.5, 5))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.5, 1))
  }

  // Mouse drag for zoom
  const handleMouseDown = (e) => {
    if (e && e.activeLabel) {
      setRefAreaLeft(e.activeLabel)
      setIsDragging(true)
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging && e && e.activeLabel) {
      setRefAreaRight(e.activeLabel)
    }
  }

  const handleMouseUp = () => {
    if (refAreaLeft && refAreaRight) {
      // Could implement zoom to selection here
    }
    setRefAreaLeft(null)
    setRefAreaRight(null)
    setIsDragging(false)
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-surface-500">
        {t('common.noData')}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Range selector */}
        <div className="flex gap-1 bg-surface-100 rounded-lg p-1">
          {RANGE_OPTIONS.map(range => (
            <button
              key={range.key}
              onClick={() => handleRangeChange(range.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                selectedRange === range.key
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-surface-600 hover:text-surface-900'
              }`}
            >
              {t(range.labelKey)}
            </button>
          ))}
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            className="p-2 rounded-lg hover:bg-surface-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={t('chart.zoomOut')}
          >
            <ZoomOut className="w-4 h-4 text-surface-600" />
          </button>
          <span className="text-sm text-surface-500 min-w-[3rem] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 5}
            className="p-2 rounded-lg hover:bg-surface-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={t('chart.zoomIn')}
          >
            <ZoomIn className="w-4 h-4 text-surface-600" />
          </button>
        </div>
      </div>

      {/* Price Chart */}
      <div style={{ height: showVolume ? height * 0.7 : height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={zoomedData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#737373' }}
              tickFormatter={(value) => {
                const parts = value.split('-')
                return parts.length >= 2 ? `${parts[1]}/${parts[2] || ''}` : value
              }}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={priceDomain}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#737373' }}
              tickFormatter={(value) => value.toFixed(1)}
              orientation="right"
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Candlesticks rendered as bars with custom shape */}
            <Bar 
              dataKey="high"
              shape={<Candlestick />}
              isAnimationActive={false}
            />

            {/* Reference area for drag selection */}
            {refAreaLeft && refAreaRight && (
              <ReferenceArea
                x1={refAreaLeft}
                x2={refAreaRight}
                strokeOpacity={0.3}
                fill="#8884d8"
                fillOpacity={0.1}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Volume Chart */}
      {showVolume && (
        <div style={{ height: height * 0.25 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={zoomedData}
              margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={false}
              />
              <YAxis 
                domain={volumeDomain}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#737373' }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
                  return value
                }}
                orientation="right"
              />
              <Bar dataKey="volume" radius={[2, 2, 0, 0]}>
                {zoomedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.close >= entry.open ? '#22c55e' : '#ef4444'}
                    fillOpacity={0.6}
                  />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

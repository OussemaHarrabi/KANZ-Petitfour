import { ExternalLink, Globe, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card } from '../ui'
import { Badge } from '../ui'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'

function getSentimentConfig(label) {
  switch (label) {
    case 'positive':
      return { variant: 'success', icon: TrendingUp, text: 'Positive' }
    case 'negative':
      return { variant: 'danger', icon: TrendingDown, text: 'Negative' }
    default:
      return { variant: 'default', icon: Minus, text: 'Neutral' }
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

export function NewsCard({ article }) {
  const sentiment = getSentimentConfig(article.sentiment_label)
  const SentimentIcon = sentiment.icon
  const isArabic = article.language === 'ar'

  return (
    <Card hover className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={sentiment.variant} size="sm">
              <SentimentIcon className="w-3 h-3" />
              {sentiment.text}
            </Badge>
            <Badge variant="outline" size="sm">
              {article.source}
            </Badge>
            {isArabic && (
              <Badge variant="primary" size="sm">
                <Globe className="w-3 h-3" />
                AR
              </Badge>
            )}
          </div>
          <h4 
            className={`font-medium text-surface-900 line-clamp-2 ${isArabic ? 'text-right' : ''}`}
            dir={isArabic ? 'rtl' : 'ltr'}
          >
            {article.title}
          </h4>
          {article.content && (
            <p 
              className={`text-sm text-surface-500 mt-1 line-clamp-2 ${isArabic ? 'text-right' : ''}`}
              dir={isArabic ? 'rtl' : 'ltr'}
            >
              {article.content.slice(0, 150)}...
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-surface-400">
            {article.date && <span>{formatDate(article.date)}</span>}
            {article.sentiment_score !== null && (
              <span>Score: {(article.sentiment_score * 100).toFixed(0)}%</span>
            )}
          </div>
        </div>
        {article.url && (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-primary-600 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </Card>
  )
}

export function NewsList({ articles, loading, emptyMessage = 'No news available' }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-5 w-16 bg-surface-200 rounded-full" />
              <div className="h-5 w-20 bg-surface-200 rounded-full" />
            </div>
            <div className="h-4 w-3/4 bg-surface-200 rounded mb-2" />
            <div className="h-3 w-1/2 bg-surface-200 rounded" />
          </Card>
        ))}
      </div>
    )
  }

  if (!articles || articles.length === 0) {
    return (
      <Card className="p-6 text-center text-surface-500">
        {emptyMessage}
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {articles.map((article) => (
        <NewsCard key={article.id || article.url} article={article} />
      ))}
    </div>
  )
}

export function SentimentSummary({ sentiment, loading }) {
  if (loading) {
    return (
      <Card className="p-4 animate-pulse">
        <div className="h-6 w-32 bg-surface-200 rounded mb-2" />
        <div className="h-8 w-24 bg-surface-200 rounded" />
      </Card>
    )
  }

  if (!sentiment) {
    return null
  }

  const config = getSentimentConfig(sentiment.sentiment_label)
  const SentimentIcon = config.icon

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-surface-500 mb-1">News Sentiment ({sentiment.period_days}d)</p>
          <div className="flex items-center gap-2">
            <Badge variant={config.variant} size="lg">
              <SentimentIcon className="w-4 h-4" />
              {config.text}
            </Badge>
            <span className="text-lg font-semibold text-surface-900">
              {(sentiment.average_score * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-surface-900">{sentiment.article_count}</p>
          <p className="text-xs text-surface-500">articles</p>
        </div>
      </div>
    </Card>
  )
}

export function SentimentTimeline({ data, loading, height = 200 }) {
  if (loading) {
    return (
      <Card className="p-4 animate-pulse">
        <div className="h-6 w-40 bg-surface-200 rounded mb-4" />
        <div className="h-[200px] bg-surface-100 rounded" />
      </Card>
    )
  }

  if (!data || data.length === 0) {
    const mockData = Array.from({ length: 14 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (13 - i))
      return {
        date: date.toISOString().split('T')[0],
        score: 0.3 + Math.random() * 0.4,
        count: Math.floor(2 + Math.random() * 8)
      }
    })
    data = mockData
  }

  const formattedData = data.map(d => ({
    ...d,
    displayScore: d.score * 100,
    sentiment: d.score > 0.55 ? 'positive' : d.score < 0.45 ? 'negative' : 'neutral'
  }))

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-surface-900">Sentiment Timeline</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-success-500" />
            <span className="text-surface-500">Positive</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-danger-500" />
            <span className="text-surface-500">Negative</span>
          </div>
        </div>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#eab308" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#737373' }}
              tickFormatter={(value) => {
                const parts = value.split('-')
                return `${parts[2]}/${parts[1]}`
              }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#737373' }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <ReferenceLine y={50} stroke="#9ca3af" strokeDasharray="4 4" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e5e5',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              formatter={(value, name) => {
                if (name === 'displayScore') return [`${value.toFixed(0)}%`, 'Sentiment']
                return [value, name]
              }}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="displayScore"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="url(#sentimentGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

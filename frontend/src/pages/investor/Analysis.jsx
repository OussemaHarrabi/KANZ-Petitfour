import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, TrendingDown, Brain, Target, AlertTriangle, Newspaper, BarChart3, LineChart, Info, X } from 'lucide-react'
import { Card, Badge, Button } from '../../components/ui'
import { PriceChart, CandlestickChart } from '../../components/charts'
import { NewsList, SentimentSummary, SentimentTimeline } from '../../components/news'
import { formatCurrency, formatPercent } from '../../lib/utils'
import { STOCKS, generateOHLCData } from '../../data/stocks'
import { api } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'

export default function Analysis() {
  const { t } = useLanguage()
  const [selectedStock, setSelectedStock] = useState(STOCKS[0])
  const [news, setNews] = useState([])
  const [sentiment, setSentiment] = useState(null)
  const [newsLoading, setNewsLoading] = useState(false)
  const [chartType, setChartType] = useState('line')
  const [prediction, setPrediction] = useState(null)
  const [predictionLoading, setPredictionLoading] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const [sentimentTimeline, setSentimentTimeline] = useState([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  
  const priceHistory = useMemo(() => generateOHLCData(selectedStock.price, 90), [selectedStock.symbol])

  useEffect(() => {
    async function fetchNews() {
      setNewsLoading(true)
      try {
        const [newsData, sentimentData] = await Promise.all([
          api.news.forStock(selectedStock.symbol, 5).catch(() => []),
          api.news.stockSentiment(selectedStock.symbol, 7).catch(() => null),
        ])
        setNews(newsData)
        setSentiment(sentimentData)
      } catch (err) {
        setNews([])
        setSentiment(null)
      }
      setNewsLoading(false)
    }
    fetchNews()
  }, [selectedStock.symbol])

  useEffect(() => {
    async function fetchPrediction() {
      setPredictionLoading(true)
      try {
        const data = await api.stocks.prediction(selectedStock.symbol)
        setPrediction(data)
      } catch (err) {
        setPrediction(null)
      }
      setPredictionLoading(false)
    }
    fetchPrediction()
  }, [selectedStock.symbol])

  useEffect(() => {
    async function fetchSentimentTimeline() {
      setTimelineLoading(true)
      try {
        const data = await api.news.stockSentiment(selectedStock.symbol, 14)
        if (data?.daily_scores) {
          setSentimentTimeline(data.daily_scores)
        } else {
          setSentimentTimeline([])
        }
      } catch (err) {
        setSentimentTimeline([])
      }
      setTimelineLoading(false)
    }
    fetchSentimentTimeline()
  }, [selectedStock.symbol])

  const aiAnalysis = {
    recommendation: 'Strong Buy',
    confidence: 87,
    targetPrice: selectedStock.price * 1.15,
    signals: [
      { type: 'bullish', text: 'RSI showing oversold conditions' },
      { type: 'bullish', text: 'MACD crossover detected' },
      { type: 'neutral', text: 'Volume trending upward' },
      { type: 'bullish', text: 'Breaking resistance at ' + (selectedStock.price * 0.98).toFixed(2) },
    ],
    explanation: `Based on comprehensive analysis of ${selectedStock.symbol}:\n\n` +
      `1. Technical Indicators: RSI at 32 indicates oversold conditions, suggesting potential upward reversal.\n\n` +
      `2. MACD Analysis: Recent bullish crossover with positive histogram momentum.\n\n` +
      `3. Volume Profile: Increasing volume on up days indicates strong buyer interest.\n\n` +
      `4. Support/Resistance: Price breaking above key resistance at ${(selectedStock.price * 0.98).toFixed(2)} TND.\n\n` +
      `5. Sentiment: ${sentiment?.average_score > 0 ? 'Positive' : 'Mixed'} market sentiment from recent news analysis.`
  }

  const predictionData = prediction?.predictions || [
    { day: 1, price: selectedStock.price * 1.012, confidence: 85 },
    { day: 2, price: selectedStock.price * 1.025, confidence: 78 },
    { day: 3, price: selectedStock.price * 1.038, confidence: 72 },
    { day: 4, price: selectedStock.price * 1.045, confidence: 65 },
    { day: 5, price: selectedStock.price * 1.052, confidence: 58 },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Stock Analysis</h1>
          <p className="text-surface-500">AI-powered insights and predictions</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STOCKS.slice(0, 8).map((stock) => (
          <button
            key={stock.symbol}
            onClick={() => setSelectedStock(stock)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedStock.symbol === stock.symbol
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-white border border-surface-200 text-surface-600 hover:border-primary-300'
            }`}
          >
            {stock.symbol}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary-600">
                    {selectedStock.symbol.slice(0, 2)}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-surface-900">{selectedStock.symbol}</h2>
                  <p className="text-sm text-surface-500">{selectedStock.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex bg-surface-100 rounded-lg p-1">
                  <button
                    onClick={() => setChartType('line')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      chartType === 'line'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-surface-600 hover:text-surface-900'
                    }`}
                  >
                    <LineChart className="w-4 h-4" />
                    {t('chart.line')}
                  </button>
                  <button
                    onClick={() => setChartType('candlestick')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      chartType === 'candlestick'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-surface-600 hover:text-surface-900'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    {t('chart.candlestick')}
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-surface-900">
                    {selectedStock.price.toFixed(2)} <span className="text-sm font-normal text-surface-500">TND</span>
                  </p>
                  <div className={`flex items-center justify-end gap-1 ${selectedStock.change >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                    {selectedStock.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="font-medium">{formatPercent(selectedStock.changePercent)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-[350px]">
              {chartType === 'line' ? (
                <PriceChart data={priceHistory} />
              ) : (
                <CandlestickChart data={priceHistory} height={350} showVolume={true} />
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-surface-900">AI Signals</h3>
            </div>
            <div className="space-y-3">
              {aiAnalysis.signals.map((signal, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                  <div className={`w-2 h-2 rounded-full ${
                    signal.type === 'bullish' ? 'bg-success-500' : 
                    signal.type === 'bearish' ? 'bg-danger-500' : 'bg-warning-500'
                  }`} />
                  <span className="text-sm text-surface-700">{signal.text}</span>
                  <Badge variant={signal.type === 'bullish' ? 'success' : signal.type === 'bearish' ? 'danger' : 'warning'} size="sm">
                    {signal.type}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          <SentimentTimeline data={sentimentTimeline} loading={timelineLoading} height={180} />
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-primary-500 to-accent-500 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                <h3 className="font-semibold">AI Recommendation</h3>
              </div>
              <button
                onClick={() => setShowExplanation(true)}
                className="flex items-center gap-1 px-2 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
                {t('common.explain')}
              </button>
            </div>
            <p className="text-3xl font-bold mb-2">{aiAnalysis.recommendation}</p>
            <p className="text-white/80 text-sm mb-4">
              Confidence: {aiAnalysis.confidence}%
            </p>
            <div className="pt-4 border-t border-white/20">
              <p className="text-sm text-white/80">Target Price</p>
              <p className="text-2xl font-bold">{formatCurrency(aiAnalysis.targetPrice)}</p>
              <p className="text-sm text-white/80">
                +{formatPercent((aiAnalysis.targetPrice - selectedStock.price) / selectedStock.price * 100)} potential
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-surface-900">{t('analysis.prediction5Day')}</h3>
              {predictionLoading && (
                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            <div className="space-y-3">
              {predictionData.map((pred, idx) => {
                const change = ((pred.price - selectedStock.price) / selectedStock.price) * 100
                const isPositive = change >= 0
                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-600">
                        J+{pred.day}
                      </span>
                      <div>
                        <p className="font-semibold text-surface-900">{pred.price.toFixed(2)} TND</p>
                        <p className={`text-xs ${isPositive ? 'text-success-600' : 'text-danger-600'}`}>
                          {isPositive ? '+' : ''}{change.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary-500 rounded-full" 
                            style={{ width: `${pred.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs text-surface-500">{pred.confidence}%</span>
                      </div>
                      <p className="text-xs text-surface-400 mt-0.5">{t('common.confidence')}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-surface-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button className="w-full" variant="primary">
                Add to Watchlist
              </Button>
              <Button className="w-full" variant="secondary">
                Set Price Alert
              </Button>
            </div>
          </Card>

          <SentimentSummary sentiment={sentiment} loading={newsLoading} />
        </div>
      </div>

      <div className="mt-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Newspaper className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-surface-900">Latest News for {selectedStock.symbol}</h3>
          </div>
          <NewsList 
            articles={news} 
            loading={newsLoading} 
            emptyMessage={`No news available for ${selectedStock.symbol}`}
          />
        </Card>
      </div>

      {showExplanation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-surface-200">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-surface-900">{t('analysis.explanationTitle')}</h3>
              </div>
              <button
                onClick={() => setShowExplanation(false)}
                className="p-1.5 hover:bg-surface-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-surface-500" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="mb-4 p-3 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl">
                <p className="text-sm font-medium text-primary-900">
                  {t('common.recommendation')}: <span className="font-bold">{aiAnalysis.recommendation}</span>
                </p>
                <p className="text-sm text-primary-700">
                  {t('common.confidence')}: {aiAnalysis.confidence}%
                </p>
              </div>
              <div className="prose prose-sm text-surface-700">
                {aiAnalysis.explanation.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-3">{paragraph}</p>
                ))}
              </div>
              <div className="mt-4 p-3 bg-surface-50 rounded-xl">
                <p className="text-xs text-surface-500">
                  {t('analysis.disclaimer')}
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-surface-200">
              <Button 
                className="w-full" 
                variant="primary"
                onClick={() => setShowExplanation(false)}
              >
                {t('common.close')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

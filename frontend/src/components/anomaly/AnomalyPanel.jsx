import { useState, useEffect } from 'react'
import { AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { AnomalyAlert } from './AnomalyAlert'
import { api } from '../../services/api'

export function AnomalyPanel({ stockCode, className = '' }) {
  const { t } = useLanguage()
  const [anomalies, setAnomalies] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchAnomalies = async () => {
    if (!stockCode) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await api.stocks.anomaly(stockCode)
      
      // Transform API response to anomaly alerts
      if (data.anomalies && data.anomalies.length > 0) {
        const alerts = data.anomalies.map((a, i) => ({
          id: i,
          severity: a.severity || 'medium',
          type: a.type || 'default',
          message: a.description || a.message,
          value: a.value,
          threshold: a.threshold,
          timestamp: new Date().toLocaleString('fr-FR')
        }))
        setAnomalies(alerts)
      } else if (data.is_anomaly) {
        // Single anomaly response
        setAnomalies([{
          id: 0,
          severity: data.severity || 'medium',
          type: data.anomaly_type || 'default',
          message: data.description || 'Anomalie detectee dans les donnees de trading',
          value: data.score,
          timestamp: new Date().toLocaleString('fr-FR')
        }])
      } else {
        setAnomalies([])
      }
    } catch (err) {
      console.error('Failed to fetch anomalies:', err)
      setError('Erreur lors du chargement des anomalies')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnomalies()
  }, [stockCode])

  const dismissAnomaly = (id) => {
    setAnomalies(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div className={`bg-white rounded-2xl border border-surface-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning-500" />
          <h3 className="font-semibold text-surface-900">{t('nav.anomalies')}</h3>
          {anomalies.length > 0 && (
            <span className="px-2 py-0.5 bg-danger-100 text-danger-700 text-xs font-semibold rounded-full">
              {anomalies.length}
            </span>
          )}
        </div>
        <button
          onClick={fetchAnomalies}
          disabled={isLoading}
          className="p-2 hover:bg-surface-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-surface-500 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 text-primary-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-danger-600">{error}</p>
            <button
              onClick={fetchAnomalies}
              className="mt-2 text-sm text-primary-600 hover:underline"
            >
              Reessayer
            </button>
          </div>
        ) : anomalies.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-success-500 mx-auto mb-3" />
            <p className="text-surface-600">Aucune anomalie detectee</p>
            <p className="text-sm text-surface-400 mt-1">
              Les donnees de trading semblent normales
            </p>
          </div>
        ) : (
          anomalies.map(anomaly => (
            <AnomalyAlert
              key={anomaly.id}
              severity={anomaly.severity}
              type={anomaly.type}
              message={anomaly.message}
              stockCode={stockCode}
              value={anomaly.value}
              threshold={anomaly.threshold}
              timestamp={anomaly.timestamp}
              onDismiss={() => dismissAnomaly(anomaly.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

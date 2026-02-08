import { AlertTriangle, TrendingUp, BarChart2, Activity } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

const SEVERITY_CONFIG = {
  high: { color: 'danger', bgColor: 'bg-danger-50', textColor: 'text-danger-700', borderColor: 'border-danger-200' },
  medium: { color: 'warning', bgColor: 'bg-warning-50', textColor: 'text-warning-700', borderColor: 'border-warning-200' },
  low: { color: 'success', bgColor: 'bg-success-50', textColor: 'text-success-700', borderColor: 'border-success-200' },
}

const ANOMALY_ICONS = {
  volume_spike: BarChart2,
  price_spike: TrendingUp,
  unusual_pattern: Activity,
  default: AlertTriangle,
}

export function AnomalyAlert({ 
  severity = 'medium', 
  type = 'default',
  message,
  stockCode,
  value,
  threshold,
  timestamp,
  onDismiss
}) {
  const { t } = useLanguage()
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.medium
  const Icon = ANOMALY_ICONS[type] || ANOMALY_ICONS.default

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-xl p-4`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${config.textColor}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor}`}>
              {t(`anomaly.${severity}`)}
            </span>
            {stockCode && (
              <span className="text-xs font-medium text-surface-600">{stockCode}</span>
            )}
          </div>
          
          <p className={`font-medium ${config.textColor}`}>
            {t('anomaly.detected')}
          </p>
          
          {message && (
            <p className="text-sm text-surface-600 mt-1">{message}</p>
          )}
          
          {(value !== undefined || threshold !== undefined) && (
            <div className="flex gap-4 mt-2 text-xs text-surface-500">
              {value !== undefined && (
                <span>{t('common.value')}: <strong>{value}</strong></span>
              )}
              {threshold !== undefined && (
                <span>Seuil: <strong>{threshold}</strong></span>
              )}
            </div>
          )}
          
          {timestamp && (
            <p className="text-xs text-surface-400 mt-2">{timestamp}</p>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-surface-400 hover:text-surface-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

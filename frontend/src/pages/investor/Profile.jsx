import { useState, useEffect } from 'react'
import { 
  User, 
  Target, 
  Shield, 
  TrendingUp,
  PieChart,
  Settings,
  Brain,
  Activity,
  Clock,
  AlertTriangle,
  RefreshCw,
  Lightbulb
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { Card } from '../../components/ui'
import { AgentChat } from '../../components/agent'
import { api } from '../../services/api'

const PROFILE_CONFIG = {
  conservative: {
    label: 'Conservateur',
    labelAr: 'محافظ',
    bgClass: 'bg-success-500',
    borderClass: 'border-success-500',
    bgLightClass: 'bg-success-50',
    textClass: 'text-success-700',
    icon: Shield,
  },
  moderate: {
    label: 'Modere',
    labelAr: 'معتدل',
    bgClass: 'bg-warning-500',
    borderClass: 'border-warning-500',
    bgLightClass: 'bg-warning-50',
    textClass: 'text-warning-700',
    icon: Activity,
  },
  aggressive: {
    label: 'Agressif',
    labelAr: 'عدواني',
    bgClass: 'bg-danger-500',
    borderClass: 'border-danger-500',
    bgLightClass: 'bg-danger-50',
    textClass: 'text-danger-700',
    icon: TrendingUp,
  },
}

const GOALS = [
  { key: 'growth', label: 'Croissance du capital', labelAr: 'نمو رأس المال', icon: TrendingUp },
  { key: 'income', label: 'Revenus de dividendes', labelAr: 'دخل الأرباح', icon: PieChart },
  { key: 'preservation', label: 'Preservation du capital', labelAr: 'الحفاظ على رأس المال', icon: Shield },
]

function MetricBar({ label, value, color = 'primary' }) {
  const percentage = Math.min(value * 100, 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-surface-600">{label}</span>
        <span className="font-medium text-surface-900">{percentage.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-${color}-500 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function Profile() {
  const { t, locale } = useLanguage()
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedGoals, setSelectedGoals] = useState(['growth'])

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    setLoading(true)
    try {
      const data = await api.profile.get()
      setProfileData(data)
    } catch (err) {
      setProfileData({
        profile: 'moderate',
        confidence: 0.72,
        scores: { aggressive: 0.35, conservative: 0.25 },
        metrics: {
          trade_frequency_per_week: 3.2,
          avg_hold_days: 8.5,
          loss_tolerance_pct: 8.2,
          volatility_preference: 0.42,
          alert_sensitivity: 0.6,
          simulation_risk_score: 0.55,
        },
        recommendations: [
          'Diversifier entre secteurs defensifs et cycliques',
          'Equilibrer entre croissance et revenus',
          'Surveiller les opportunites sur les mid-caps',
        ],
      })
    }
    setLoading(false)
  }

  const toggleGoal = (goalKey) => {
    setSelectedGoals(prev => 
      prev.includes(goalKey)
        ? prev.filter(g => g !== goalKey)
        : [...prev, goalKey]
    )
  }

  const currentProfile = profileData?.profile || 'moderate'
  const profileConfig = PROFILE_CONFIG[currentProfile]
  const ProfileIcon = profileConfig?.icon || Activity

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-surface-900">Demo User</h2>
                <p className="text-surface-500">{t('roles.investor')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-surface-50 rounded-xl p-4">
                <p className="text-xs text-surface-500 mb-1">{t('portfolio.totalValue')}</p>
                <p className="text-lg font-bold text-surface-900">152,450 TND</p>
                <p className="text-xs text-success-600">+12.5% ce mois</p>
              </div>
              <div className="bg-surface-50 rounded-xl p-4">
                <p className="text-xs text-surface-500 mb-1">{t('common.stocks')}</p>
                <p className="text-lg font-bold text-surface-900">8 positions</p>
                <p className="text-xs text-surface-500">5 secteurs</p>
              </div>
              <div className="bg-surface-50 rounded-xl p-4">
                <p className="text-xs text-surface-500 mb-1">Membre depuis</p>
                <p className="text-lg font-bold text-surface-900">Jan 2024</p>
                <p className="text-xs text-surface-500">1 an</p>
              </div>
            </div>
          </Card>

          <Card className={`p-6 border-2 ${profileConfig?.borderClass || 'border-surface-200'}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl ${profileConfig?.bgLightClass} flex items-center justify-center`}>
                  <Brain className={`w-6 h-6 ${profileConfig?.textClass}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-surface-900">{t('profile.autoDetectedProfile')}</h3>
                  <p className="text-sm text-surface-500">{t('profile.basedOnBehavior')}</p>
                </div>
              </div>
              <button
                onClick={fetchProfile}
                disabled={loading}
                className="p-2 hover:bg-surface-100 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-5 h-5 text-surface-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-6 mb-6">
                  <div className={`w-20 h-20 rounded-2xl ${profileConfig?.bgClass} flex items-center justify-center`}>
                    <ProfileIcon className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-surface-900">
                      {locale === 'ar' ? profileConfig?.labelAr : profileConfig?.label}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <div className="w-24 h-2 bg-surface-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${profileConfig?.bgClass} rounded-full`}
                            style={{ width: `${(profileData?.confidence || 0.5) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-surface-500">
                          {((profileData?.confidence || 0.5) * 100).toFixed(0)}% {t('common.confidence')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {Object.entries(PROFILE_CONFIG).map(([key, config]) => {
                    const isActive = key === currentProfile
                    const score = key === 'moderate' 
                      ? 1 - (profileData?.scores?.aggressive || 0) - (profileData?.scores?.conservative || 0)
                      : profileData?.scores?.[key] || 0
                    return (
                      <div
                        key={key}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          isActive ? `${config.borderClass} ${config.bgLightClass}` : 'border-surface-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${config.bgClass}`} />
                          <span className={`text-sm font-medium ${isActive ? config.textClass : 'text-surface-600'}`}>
                            {locale === 'ar' ? config.labelAr : config.label}
                          </span>
                        </div>
                        <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${config.bgClass} rounded-full transition-all`}
                            style={{ width: `${Math.max(score * 100, 5)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="p-4 bg-surface-50 rounded-xl">
                  <p className="text-sm text-surface-600">
                    {currentProfile === 'conservative' && t('profile.conservativeDesc')}
                    {currentProfile === 'moderate' && t('profile.moderateDesc')}
                    {currentProfile === 'aggressive' && t('profile.aggressiveDesc')}
                  </p>
                </div>
              </>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-accent-600" />
              </div>
              <h3 className="text-lg font-semibold text-surface-900">{t('profile.behaviorMetrics')}</h3>
            </div>

            {profileData?.metrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                    <Clock className="w-5 h-5 text-primary-500" />
                    <div className="flex-1">
                      <p className="text-sm text-surface-500">{t('profile.tradeFrequency')}</p>
                      <p className="font-semibold text-surface-900">
                        {profileData.metrics.trade_frequency_per_week?.toFixed(1)} / semaine
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-success-500" />
                    <div className="flex-1">
                      <p className="text-sm text-surface-500">{t('profile.avgHoldDuration')}</p>
                      <p className="font-semibold text-surface-900">
                        {profileData.metrics.avg_hold_days?.toFixed(1)} jours
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-warning-500" />
                    <div className="flex-1">
                      <p className="text-sm text-surface-500">{t('profile.lossTolerance')}</p>
                      <p className="font-semibold text-surface-900">
                        {profileData.metrics.loss_tolerance_pct?.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <MetricBar 
                    label={t('profile.volatilityPreference')} 
                    value={profileData.metrics.volatility_preference || 0}
                    color="primary"
                  />
                  <MetricBar 
                    label={t('profile.alertSensitivity')} 
                    value={profileData.metrics.alert_sensitivity || 0}
                    color="warning"
                  />
                  <MetricBar 
                    label={t('profile.simulationRisk')} 
                    value={profileData.metrics.simulation_risk_score || 0}
                    color="danger"
                  />
                </div>
              </div>
            )}
          </Card>

          {profileData?.recommendations && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900">{t('profile.aiRecommendations')}</h3>
              </div>
              <div className="space-y-3">
                {profileData.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-surface-50 rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary-600">{idx + 1}</span>
                    </div>
                    <p className="text-sm text-surface-700">{rec}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-surface-900">{t('profile.investmentGoals')}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {GOALS.map(goal => {
                const isSelected = selectedGoals.includes(goal.key)
                const Icon = goal.icon
                return (
                  <button
                    key={goal.key}
                    onClick={() => toggleGoal(goal.key)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-surface-200 hover:border-surface-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-primary-600' : 'text-surface-400'}`} />
                    <p className={`font-medium ${isSelected ? 'text-primary-900' : 'text-surface-700'}`}>
                      {locale === 'ar' ? goal.labelAr : goal.label}
                    </p>
                  </button>
                )
              })}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center">
                <Settings className="w-5 h-5 text-surface-600" />
              </div>
              <h3 className="text-lg font-semibold text-surface-900">Preferences</h3>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-surface-50 rounded-xl cursor-pointer hover:bg-surface-100 transition-colors">
                <div>
                  <p className="font-medium text-surface-900">Notifications d'anomalies</p>
                  <p className="text-sm text-surface-500">Recevoir des alertes en cas d'anomalie detectee</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 text-primary-500 rounded" />
              </label>

              <label className="flex items-center justify-between p-4 bg-surface-50 rounded-xl cursor-pointer hover:bg-surface-100 transition-colors">
                <div>
                  <p className="font-medium text-surface-900">Rapports hebdomadaires</p>
                  <p className="text-sm text-surface-500">Recevoir un resume de vos investissements</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 text-primary-500 rounded" />
              </label>

              <label className="flex items-center justify-between p-4 bg-surface-50 rounded-xl cursor-pointer hover:bg-surface-100 transition-colors">
                <div>
                  <p className="font-medium text-surface-900">Mode demo</p>
                  <p className="text-sm text-surface-500">Utiliser le simulateur pour s'entrainer</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 text-primary-500 rounded" />
              </label>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-surface-900 mb-1">{t('profile.askAssistant')}</h3>
              <p className="text-sm text-surface-500">
                Posez des questions sur vos investissements, la strategie de marche, ou les regulations CMF.
              </p>
            </div>
            <AgentChat className="h-[600px]" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile

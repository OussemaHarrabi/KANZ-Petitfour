import { useNavigate } from 'react-router-dom'
import { TrendingUp, LineChart, Shield, ArrowRight } from 'lucide-react'
import { Button } from '../components/ui'

export default function RoleSelect() {
  const navigate = useNavigate()

  const roles = [
    {
      id: 'investor',
      title: 'Investor',
      description: 'Access your portfolio, analyze stocks, and get AI-powered recommendations for the Tunisian market.',
      icon: LineChart,
      features: ['Portfolio tracking', 'Stock analysis', 'AI recommendations', 'Price alerts'],
      gradient: 'from-primary-500 to-accent-500',
      path: '/investor',
    },
    {
      id: 'inspector',
      title: 'CMF Inspector',
      description: 'Monitor market activity, detect anomalies, and investigate potential market manipulation.',
      icon: Shield,
      features: ['Anomaly detection', 'Investigation tools', 'Real-time monitoring', 'Compliance reports'],
      gradient: 'from-accent-500 to-primary-500',
      path: '/inspector',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-primary-50/30 to-accent-50/20 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 mb-6 shadow-lg shadow-primary-500/25">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-surface-900 mb-3">
            KANZ
          </h1>
          <p className="text-lg text-surface-500 max-w-xl mx-auto">
            Your AI-powered gateway to the Tunisian Stock Market. Invest with confidence.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {roles.map((role) => (
            <div
              key={role.id}
              className="group bg-white rounded-3xl border border-surface-200 p-8 shadow-card hover:shadow-elevated transition-all duration-300 cursor-pointer hover:border-primary-200"
              onClick={() => navigate(role.path)}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${role.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <role.icon className="w-7 h-7 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-surface-900 mb-2">
                {role.title}
              </h2>
              <p className="text-surface-500 mb-6">
                {role.description}
              </p>

              <div className="space-y-2 mb-8">
                {role.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm text-surface-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    {feature}
                  </div>
                ))}
              </div>

              <Button className="w-full group-hover:shadow-lg group-hover:shadow-primary-500/25">
                Enter as {role.title}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-surface-400 text-sm mt-8">
          Demo mode — No authentication required
        </p>
      </div>
    </div>
  )
}

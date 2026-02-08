import { useState } from 'react'
import { Card, CardContent, Badge, Button, Input } from '../../components/ui'
import { formatTime } from '../../lib/utils'
import { ANOMALIES } from '../../data/anomalies'
import { AlertTriangle, Search, Filter, Eye, CheckCircle, XCircle, ChevronDown } from 'lucide-react'

const severityColors = {
  critical: 'danger',
  high: 'warning',
  medium: 'primary',
  low: 'default',
}

const statusColors = {
  investigating: 'warning',
  confirmed: 'danger',
  reviewing: 'primary',
  dismissed: 'default',
}

const typeLabels = {
  volume_spike: 'Volume Spike',
  wash_trading: 'Wash Trading',
  insider_trading: 'Insider Trading',
  price_manipulation: 'Price Manipulation',
  front_running: 'Front Running',
}

export default function Anomalies() {
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredAnomalies = ANOMALIES.filter((anomaly) => {
    const matchesSearch = 
      anomaly.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      anomaly.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSeverity = severityFilter === 'all' || anomaly.severity === severityFilter
    const matchesStatus = statusFilter === 'all' || anomaly.status === statusFilter
    return matchesSearch && matchesSeverity && matchesStatus
  })

  const severityOptions = ['all', 'critical', 'high', 'medium', 'low']
  const statusOptions = ['all', 'investigating', 'confirmed', 'reviewing', 'dismissed']

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Anomaly Detection</h1>
          <p className="text-surface-500">AI-powered market surveillance alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="danger" dot>
            {ANOMALIES.filter(a => a.severity === 'critical').length} Critical
          </Badge>
          <Badge variant="warning">
            {ANOMALIES.filter(a => a.status === 'investigating').length} Investigating
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by symbol or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={Search}
              />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="appearance-none bg-white border border-surface-200 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {severityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === 'all' ? 'All Severities' : option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white border border-surface-200 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === 'all' ? 'All Statuses' : option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Anomalies Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-100">
                <th className="text-left text-xs font-medium text-surface-500 px-4 py-3">Severity</th>
                <th className="text-left text-xs font-medium text-surface-500 px-4 py-3">Symbol</th>
                <th className="text-left text-xs font-medium text-surface-500 px-4 py-3">Type</th>
                <th className="text-left text-xs font-medium text-surface-500 px-4 py-3">Description</th>
                <th className="text-left text-xs font-medium text-surface-500 px-4 py-3">Detected</th>
                <th className="text-center text-xs font-medium text-surface-500 px-4 py-3">Confidence</th>
                <th className="text-center text-xs font-medium text-surface-500 px-4 py-3">Status</th>
                <th className="text-center text-xs font-medium text-surface-500 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filteredAnomalies.map((anomaly) => (
                <tr key={anomaly.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-4">
                    <Badge variant={severityColors[anomaly.severity]} size="sm">
                      {anomaly.severity}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-semibold text-surface-900">{anomaly.symbol}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-surface-600">
                      {typeLabels[anomaly.type] || anomaly.type}
                    </span>
                  </td>
                  <td className="px-4 py-4 max-w-xs">
                    <p className="text-sm text-surface-900 font-medium">{anomaly.title}</p>
                    <p className="text-xs text-surface-500 truncate">{anomaly.description}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-surface-600">{formatTime(anomaly.detectedAt)}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 bg-surface-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            anomaly.confidence >= 80 ? 'bg-danger-500' :
                            anomaly.confidence >= 60 ? 'bg-warning-500' : 'bg-primary-500'
                          }`}
                          style={{ width: `${anomaly.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-surface-600">{anomaly.confidence}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Badge variant={statusColors[anomaly.status]} size="sm" dot>
                      {anomaly.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" className="p-1">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-1 text-success-600 hover:bg-success-50">
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-1 text-danger-600 hover:bg-danger-50">
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredAnomalies.length === 0 && (
          <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-surface-300 mx-auto mb-3" />
            <p className="text-surface-500">No anomalies found matching your filters</p>
          </div>
        )}
      </Card>

      {/* Indicators Legend */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium text-surface-900 mb-3">Detection Indicators</h4>
          <div className="flex flex-wrap gap-3">
            {['Volume spike', 'Price momentum', 'Circular trading', 'Options activity', 'Order timing'].map((indicator) => (
              <span key={indicator} className="px-3 py-1 bg-surface-100 rounded-full text-sm text-surface-600">
                {indicator}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import { useState } from 'react'
import { Card, CardContent, Badge, Button, Input } from '../../components/ui'
import { INVESTIGATIONS } from '../../data/anomalies'
import { Search, Plus, User, Calendar, AlertTriangle, Clock, CheckCircle } from 'lucide-react'

const priorityColors = {
  critical: 'danger',
  high: 'warning',
  medium: 'primary',
  low: 'default',
}

const statusColors = {
  active: 'success',
  pending: 'warning',
  completed: 'default',
}

const statusIcons = {
  active: Clock,
  pending: AlertTriangle,
  completed: CheckCircle,
}

export default function Investigations() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredInvestigations = INVESTIGATIONS.filter((inv) => {
    const matchesSearch = inv.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusTabs = [
    { value: 'all', label: 'All', count: INVESTIGATIONS.length },
    { value: 'active', label: 'Active', count: INVESTIGATIONS.filter(i => i.status === 'active').length },
    { value: 'pending', label: 'Pending', count: INVESTIGATIONS.filter(i => i.status === 'pending').length },
    { value: 'completed', label: 'Completed', count: INVESTIGATIONS.filter(i => i.status === 'completed').length },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Investigations</h1>
          <p className="text-surface-500">Track and manage ongoing market investigations</p>
        </div>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          New Investigation
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-200">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              statusFilter === tab.value
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-surface-500 hover:text-surface-700'
            }`}
          >
            {tab.label}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              statusFilter === tab.value
                ? 'bg-primary-100 text-primary-700'
                : 'bg-surface-100 text-surface-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search investigations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={Search}
        />
      </div>

      {/* Investigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredInvestigations.map((inv) => {
          const StatusIcon = statusIcons[inv.status]
          
          return (
            <Card key={inv.id} className="hover:shadow-elevated transition-shadow cursor-pointer">
              <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={priorityColors[inv.priority]} size="sm">
                        {inv.priority}
                      </Badge>
                      <Badge variant={statusColors[inv.status]} size="sm" dot>
                        {inv.status}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-surface-900">{inv.title}</h3>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-100">
                    <StatusIcon className={`w-5 h-5 ${
                      inv.status === 'active' ? 'text-success-500' :
                      inv.status === 'pending' ? 'text-warning-500' : 'text-surface-400'
                    }`} />
                  </div>
                </div>

                {/* Stocks */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {inv.stocks.map((stock) => (
                    <span 
                      key={stock}
                      className="px-2 py-1 bg-primary-50 text-primary-700 rounded-md text-sm font-medium"
                    >
                      {stock}
                    </span>
                  ))}
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-surface-500">Progress</span>
                    <span className="text-sm font-medium text-surface-900">{inv.progress}%</span>
                  </div>
                  <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        inv.progress === 100 ? 'bg-success-500' :
                        inv.progress >= 50 ? 'bg-gradient-to-r from-primary-500 to-accent-500' :
                        'bg-warning-500'
                      }`}
                      style={{ width: `${inv.progress}%` }}
                    />
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-surface-500">
                      <User className="w-4 h-4" />
                      {inv.assignee}
                    </span>
                    <span className="flex items-center gap-1 text-surface-500">
                      <Calendar className="w-4 h-4" />
                      {inv.createdAt}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-surface-500">
                    <AlertTriangle className="w-4 h-4" />
                    {inv.anomalyCount} anomalies
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredInvestigations.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="w-12 h-12 text-surface-300 mx-auto mb-3" />
            <p className="text-surface-500">No investigations found</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

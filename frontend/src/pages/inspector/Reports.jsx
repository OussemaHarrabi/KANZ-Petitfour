import { useState } from 'react'
import { Card, CardContent, Badge, Button } from '../../components/ui'
import { REPORTS } from '../../data/anomalies'
import { FileText, Download, Plus, Filter, Clock, CheckCircle, Loader2, Calendar } from 'lucide-react'

const typeColors = {
  surveillance: 'primary',
  anomaly: 'warning',
  investigation: 'danger',
  compliance: 'success',
}

const typeIcons = {
  surveillance: FileText,
  anomaly: Clock,
  investigation: FileText,
  compliance: CheckCircle,
}

export default function Reports() {
  const [typeFilter, setTypeFilter] = useState('all')

  const filteredReports = typeFilter === 'all' 
    ? REPORTS 
    : REPORTS.filter(r => r.type === typeFilter)

  const reportTypes = ['all', 'surveillance', 'anomaly', 'investigation', 'compliance']

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Reports</h1>
          <p className="text-surface-500">Generate and download surveillance reports</p>
        </div>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-surface-500">Total Reports</p>
          <p className="text-2xl font-bold text-surface-900">{REPORTS.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-surface-500">Ready for Download</p>
          <p className="text-2xl font-bold text-success-600">
            {REPORTS.filter(r => r.status === 'ready').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-surface-500">Generating</p>
          <p className="text-2xl font-bold text-warning-600">
            {REPORTS.filter(r => r.status === 'generating').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-surface-500">This Month</p>
          <p className="text-2xl font-bold text-primary-600">
            {REPORTS.filter(r => r.date.startsWith('2025-02')).length}
          </p>
        </Card>
      </div>

      {/* Type Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-surface-400" />
        {reportTypes.map((type) => (
          <Button
            key={type}
            variant={typeFilter === type ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setTypeFilter(type)}
          >
            {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
          </Button>
        ))}
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report) => {
          const TypeIcon = typeIcons[report.type] || FileText
          
          return (
            <Card key={report.id} className="hover:shadow-elevated transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-${typeColors[report.type]}-100`}>
                      <TypeIcon className={`w-6 h-6 text-${typeColors[report.type]}-600`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-surface-900">{report.title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant={typeColors[report.type]} size="sm">
                          {report.type}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs text-surface-500">
                          <Calendar className="w-3 h-3" />
                          {report.date}
                        </span>
                        {report.size && (
                          <span className="text-xs text-surface-400">
                            {report.size}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {report.status === 'ready' ? (
                      <Button variant="primary" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    ) : (
                      <Button variant="secondary" size="sm" disabled>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredReports.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-surface-300 mx-auto mb-3" />
            <p className="text-surface-500">No reports found for this filter</p>
          </CardContent>
        </Card>
      )}

      {/* Report Templates */}
      <Card>
        <div className="p-4 border-b border-surface-100">
          <h3 className="font-semibold text-surface-900">Quick Generate</h3>
          <p className="text-sm text-surface-500">Generate common report types</p>
        </div>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Weekly Surveillance', type: 'surveillance', description: 'Standard weekly market overview' },
              { name: 'Anomaly Summary', type: 'anomaly', description: 'All detected anomalies report' },
              { name: 'Investigation Status', type: 'investigation', description: 'Current investigation progress' },
              { name: 'Compliance Audit', type: 'compliance', description: 'Regulatory compliance check' },
            ].map((template) => (
              <button
                key={template.name}
                className="p-4 border border-surface-200 rounded-xl hover:border-primary-300 hover:bg-primary-50/50 transition-colors text-left"
              >
                <Badge variant={typeColors[template.type]} size="sm" className="mb-2">
                  {template.type}
                </Badge>
                <h4 className="font-medium text-surface-900">{template.name}</h4>
                <p className="text-xs text-surface-500 mt-1">{template.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

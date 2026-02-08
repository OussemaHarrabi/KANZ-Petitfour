import { Search, Bell, Settings, User, Languages } from 'lucide-react'
import { Input } from '../ui'
import { useLanguage } from '../../context/LanguageContext'

export function Header({ title, subtitle }) {
  const { locale, toggleLanguage, t } = useLanguage()

  return (
    <header className="h-16 bg-white border-b border-surface-200 flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-semibold text-surface-900">{title}</h1>
        {subtitle && <p className="text-sm text-surface-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="w-64">
          <Input 
            placeholder={t('common.search')} 
            icon={Search}
            className="bg-surface-50"
          />
        </div>

        <button 
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface-100 transition-colors border border-surface-200"
          title={locale === 'fr' ? 'Switch to Arabic' : 'Passer au francais'}
        >
          <Languages className="w-4 h-4 text-surface-600" />
          <span className="text-sm font-medium text-surface-700">
            {locale === 'fr' ? 'العربية' : 'Francais'}
          </span>
        </button>

        <button className="relative p-2 rounded-xl hover:bg-surface-100 transition-colors">
          <Bell className="w-5 h-5 text-surface-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full" />
        </button>

        <button className="p-2 rounded-xl hover:bg-surface-100 transition-colors">
          <Settings className="w-5 h-5 text-surface-600" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-surface-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-surface-900">Demo User</p>
            <p className="text-xs text-surface-500">{t('roles.investor')}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

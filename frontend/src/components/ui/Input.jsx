import { cn } from '../../lib/utils'

export function Input({ className, icon: Icon, ...props }) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
      )}
      <input
        className={cn(
          'w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-surface-900 placeholder-surface-400',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all',
          Icon && 'pl-10',
          className
        )}
        {...props}
      />
    </div>
  )
}

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        'w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-surface-900',
        'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all',
        'appearance-none cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

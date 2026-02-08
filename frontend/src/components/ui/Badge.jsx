import { cn } from '../../lib/utils'

const variants = {
  default: 'bg-surface-100 text-surface-700',
  primary: 'bg-primary-100 text-primary-700',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  danger: 'bg-danger-50 text-danger-600',
  outline: 'border border-surface-300 text-surface-600',
}

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
  dot,
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full',
          variant === 'success' && 'bg-success-500',
          variant === 'warning' && 'bg-warning-500',
          variant === 'danger' && 'bg-danger-500',
          variant === 'primary' && 'bg-primary-500',
          variant === 'default' && 'bg-surface-500',
        )} />
      )}
      {children}
    </span>
  )
}

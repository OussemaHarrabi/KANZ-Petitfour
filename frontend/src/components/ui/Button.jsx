import { cn } from '../../lib/utils'

const variants = {
  primary: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5',
  secondary: 'bg-surface-100 text-surface-700 hover:bg-surface-200',
  ghost: 'text-surface-600 hover:bg-surface-100',
  danger: 'bg-danger-500 text-white hover:bg-danger-600',
  success: 'bg-success-500 text-white hover:bg-success-600',
  outline: 'border-2 border-surface-200 text-surface-700 hover:bg-surface-50',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 active:translate-y-0',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed hover:transform-none hover:shadow-none',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

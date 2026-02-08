import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value, currency = 'TND') {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatNumber(value) {
  return new Intl.NumberFormat('fr-TN').format(value)
}

export function formatPercent(value) {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('fr-TN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatTime(date) {
  return new Intl.DateTimeFormat('fr-TN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

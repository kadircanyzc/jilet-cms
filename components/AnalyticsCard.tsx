import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface AnalyticsCardProps {
  title: string
  value: string | number
  change: number
  icon: LucideIcon
  iconColor: string
  iconBgColor: string
}

export default function AnalyticsCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor,
  iconBgColor,
}: AnalyticsCardProps) {
  const isPositive = change >= 0

  return (
    <div className="bg-card rounded-[var(--radius)] border border-border p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${iconBgColor} rounded-[var(--radius)] flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div className={`flex items-center space-x-1 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>{Math.abs(change)}%</span>
        </div>
      </div>
      <h3 className="text-muted-foreground text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-card-foreground">{value}</p>
    </div>
  )
}

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'

interface DashboardCardProps {
  title: string
  description: string
  icon: LucideIcon
  href: string
  color?: 'primary' | 'accent' | 'secondary'
}

export function DashboardCard({
  title,
  description,
  icon: Icon,
  href,
  color = 'primary',
}: DashboardCardProps) {
  return (
    <Link href={href}>
      <div className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer h-full">
        <div className="space-y-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            color === 'primary' ? 'bg-primary/20' : 
            color === 'accent' ? 'bg-accent/20' : 
            'bg-secondary/20'
          }`}>
            <Icon className={`${
              color === 'primary' ? 'text-primary' : 
              color === 'accent' ? 'text-accent' : 
              'text-secondary'
            }`} size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <Button variant="ghost" className="w-full justify-start p-0 h-auto">
            <span className="text-primary font-medium">Explore →</span>
          </Button>
        </div>
      </div>
    </Link>
  )
}

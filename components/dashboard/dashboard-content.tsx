"use client"

import { useState } from "react"
import Link from "next/link"
import { Briefcase, Calendar, Heart, Gift, TrendingUp, TrendingDown, ArrowRight, Building2, MapPin } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DashboardContentProps {
  user: any
  metrics: {
    applications: { count: number; change: number }
    interviews: { count: number; change: number }
    favorites: { count: number; change: number }
    jobOffers: { count: number; change: number }
  }
  chartData: {
    monthly: Array<{ month: string; applications: number; interviews: number }>
    weekly: Array<{ week: string; applications: number; interviews: number }>
  }
  applications: any[]
}

export function DashboardContent({ user, metrics, chartData, applications }: DashboardContentProps) {
  const [chartPeriod, setChartPeriod] = useState<"monthly" | "weekly">("monthly")
  
  const currentData = chartPeriod === "monthly" ? chartData.monthly : chartData.weekly
  const xAxisKey = chartPeriod === "monthly" ? "month" : "week"

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 min-w-0">
        <MetricCard
          title="Anzahl Bewerbungen"
          value={metrics.applications.count}
          change={metrics.applications.change}
          icon={Briefcase}
          highlighted={true}
        />
        <MetricCard
          title="Anstehende Interviews"
          value={metrics.interviews.count}
          change={metrics.interviews.change}
          icon={Calendar}
        />
        <MetricCard
          title="Favoriten"
          value={metrics.favorites.count}
          change={metrics.favorites.change}
          icon={Heart}
        />
        <MetricCard
          title="Jobangebote"
          value={metrics.jobOffers.count}
          change={metrics.jobOffers.change}
          icon={Gift}
        />
      </div>

      {/* Statistics Chart */}
      <div className="card-base">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 sm:mb-6">
          <h2 className="text-section-title">Bewerbungsstatistik</h2>
          <div className="flex gap-1 w-full sm:w-auto">
            <button
              onClick={() => setChartPeriod("weekly")}
              className={cn(
                "flex-1 sm:flex-none px-3 sm:px-4 h-9 rounded-[var(--radius-md)] text-xs sm:text-sm font-medium transition-all duration-150",
                chartPeriod === "weekly"
                  ? "bg-[var(--bg-hover)] text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              )}
            >
              Wöchentlich
            </button>
            <button
              onClick={() => setChartPeriod("monthly")}
              className={cn(
                "flex-1 sm:flex-none px-3 sm:px-4 h-9 rounded-[var(--radius-md)] text-xs sm:text-sm font-medium transition-all duration-150",
                chartPeriod === "monthly"
                  ? "bg-[var(--bg-hover)] text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              )}
            >
              Monatlich
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-5 sm:mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-[#F0F941] flex-shrink-0"></div>
            <span className="text-xs sm:text-sm text-[var(--text-muted)]">Bewerbungen gesendet</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-[#D4D4D4] flex-shrink-0"></div>
            <span className="text-xs sm:text-sm text-[var(--text-muted)]">Interviews</span>
          </div>
        </div>

        <div className="w-full h-[240px] sm:h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={currentData}>
              <CartesianGrid stroke="var(--border-default)" strokeWidth={1} vertical={false} />
              <XAxis 
                dataKey={xAxisKey} 
                stroke="var(--text-muted)"
                fontSize={10}
                className="sm:text-xs"
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="var(--text-muted)"
                fontSize={10}
                className="sm:text-xs"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "#2A2A2A",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-md)",
                  color: "#FFFFFF",
                }}
                cursor={{ fill: 'var(--bg-muted)' }}
                labelStyle={{ color: "#FFFFFF" }}
                itemStyle={{ color: "#FFFFFF" }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px', color: '#FFFFFF' }}
                iconType="circle"
              />
              <Bar 
                dataKey="applications" 
                fill="#F0F941" 
                name="Bewerbungen gesendet"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="interviews" 
                fill="#D4D4D4" 
                name="Interviews"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* My Applications */}
      <div className="card-base">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-5 sm:mb-6">
          <h2 className="text-section-title">Meine Bewerbungen</h2>
          <Link
            href="/applications"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[var(--accent-500)] hover:text-[var(--accent-500)]/80 transition-colors"
          >
            Alle anzeigen
            <ArrowRight size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
          </Link>
        </div>

        {applications.length === 0 ? (
          <div className="empty-state">
            <Briefcase className="empty-state-icon" />
            <p className="empty-state-title">Noch keine Bewerbungen erstellt</p>
            <p className="empty-state-description">
              Erstelle deine erste Bewerbung, um loszulegen
            </p>
            <Link href="/application/new">
              <Button>Erste Bewerbung erstellen</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {applications.map((app) => (
              <Link
                key={app.id}
                href={`/application/${app.id}`}
                className="block p-4 sm:p-5 rounded-[var(--radius-lg)] border border-[var(--border-default)] hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)] transition-all duration-150"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-1.5 truncate">
                      {app.jobTitle}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-1">
                      <Building2 size={14} className="flex-shrink-0 text-[var(--text-muted)]" />
                      <span className="truncate">{app.company}</span>
                    </div>
                    {app.jobLocation && (
                      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                        <MapPin size={14} className="flex-shrink-0" />
                        <span className="truncate">{app.jobLocation}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 ml-auto">
                    <span className="text-xs text-[var(--text-muted)]">
                      {new Date(app.updatedAt).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                    {app.folder && (
                      <div className="mt-2">
                        <span className="badge-neutral">
                          {app.folder.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: number
  change: number
  icon: React.ElementType
  highlighted?: boolean
}

function MetricCard({ title, value, change, icon: Icon, highlighted = false }: MetricCardProps) {
  const isPositive = change >= 0
  const ChangeIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <div 
      className={cn(
        "card-base flex flex-col relative",
        highlighted ? "bg-[#F0F941]" : "bg-[var(--bg-card)]"
      )}
    >
      {/* Title and Icon Row - perfectly horizontally aligned */}
      <div className="flex flex-row items-center justify-between lg:gap-3">
        {/* Title - horizontally centered with icon */}
        <p 
          className={cn(
            "text-[11px] sm:text-[12px] font-medium leading-[1.4] lg:flex-1 lg:min-w-0",
            highlighted ? "text-[#080808]" : "text-[var(--text-secondary)]"
          )}
          data-element="title"
        >
          {title}
        </p>

        {/* Icon - right side, 20% smaller, perfectly aligned with title */}
        <div 
          className={cn(
            "p-1 sm:p-1.5 lg:p-2.5 rounded-full flex-shrink-0 flex items-center justify-center",
            highlighted 
              ? "bg-[#F0F941]/80 lg:bg-[#080808]/10" 
              : "bg-[var(--bg-muted)]/30 lg:bg-[var(--bg-muted)]"
          )}
          data-element="icon"
        >
          <Icon className={cn(
            "w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4",
            highlighted 
              ? "text-[#080808]/20 lg:text-[#080808]" 
              : "text-[var(--accent-500)]/40 lg:text-[var(--accent-500)]"
          )} />
        </div>
      </div>

      {/* Value - very large and prominent */}
      <p 
        className={cn(
          "text-[40px] sm:text-[44px] lg:text-[32px] font-bold tracking-[-0.03em] mt-4 sm:mt-5 lg:mt-0",
          highlighted ? "text-[#080808]" : "text-[var(--text-primary)]"
        )}
        data-element="value"
      >
        {value}
      </p>

      {/* Change indicator - more spacing from value */}
      <div 
        className="flex items-center gap-1.5 flex-wrap mt-3 sm:mt-4 lg:mt-0"
        data-element="change"
      >
        <ChangeIcon size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />
        <span className={cn(
          "text-[10px] sm:text-xs font-medium",
          highlighted 
            ? "text-[#080808]" 
            : isPositive 
              ? "text-[var(--success-text)]" 
              : "text-[var(--error-text)]"
        )}>
          {isPositive ? "+" : ""}{Math.abs(change)}% vs letztem Monat
        </span>
      </div>
    </div>
  )
}

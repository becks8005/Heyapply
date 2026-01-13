"use client"

import { Tag, FileText, Briefcase, Star, CheckCircle2, Lightbulb } from "lucide-react"

interface InsightSection {
  title: string
  icon: string
  points: string[]
}

interface CVInsights {
  sections: InsightSection[]
}

interface CVInsightsDisplayProps {
  insights: CVInsights | null
  onSectionHover?: (sectionTitle: string | null) => void
}

const iconMap: Record<string, React.ReactNode> = {
  tag: <Tag className="h-5 w-5" />,
  "file-text": <FileText className="h-5 w-5" />,
  briefcase: <Briefcase className="h-5 w-5" />,
  star: <Star className="h-5 w-5" />,
  "check-circle": <CheckCircle2 className="h-5 w-5" />,
  lightbulb: <Lightbulb className="h-5 w-5" />,
}

export function CVInsightsDisplay({ insights, onSectionHover }: CVInsightsDisplayProps) {
  if (!insights || !insights.sections || insights.sections.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
        <p>Keine Erklärungen verfügbar</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
          Was wurde angepasst?
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Hier siehst du die wichtigsten Anpassungen, die vorgenommen wurden, um deinen CV optimal auf die Stelle auszurichten.
        </p>
      </div>

      <div className="space-y-4">
        {insights.sections.map((section, sectionIdx) => (
          <div
            key={sectionIdx}
            className="bg-[#252525] border border-[var(--border-default)] rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
            onMouseEnter={() => onSectionHover?.(section.title)}
            onMouseLeave={() => onSectionHover?.(null)}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--accent-500)]/20 flex items-center justify-center text-[var(--accent-500)]">
                {iconMap[section.icon] || <FileText className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                  {section.title}
                </h3>
                <div className="space-y-2">
                  {section.points.map((point, pointIdx) => (
                    <div
                      key={pointIdx}
                      className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                    >
                      <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--accent-500)] mt-2" />
                      <p className="flex-1 leading-relaxed">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

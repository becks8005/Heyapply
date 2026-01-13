import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { UserProfileSidebar } from "@/components/dashboard/user-profile-sidebar"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }
  
  // Check if profile is empty (first-time user)
  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: {
      experiences: { orderBy: { order: "asc" } },
      education: { orderBy: { order: "asc" } },
      certifications: { orderBy: { order: "asc" } },
      skills: { orderBy: { order: "asc" } },
    }
  })
  
  // Check if profile is empty
  const hasExperiences = profile?.experiences && profile.experiences.length > 0
  const hasEducation = profile?.education && profile.education.length > 0
  const hasSummary = profile?.summary && profile.summary.trim().length > 0
  const hasSkills = profile?.skills && profile.skills.length > 0
  const hasTagline = profile?.tagline && profile.tagline.trim().length > 0
  const hasPhone = profile?.phone && profile.phone.trim().length > 0
  const hasCity = profile?.city && profile.city.trim().length > 0
  
  const isProfileEmpty = !hasExperiences && !hasEducation && !hasSummary && !hasSkills && !hasTagline && !hasPhone && !hasCity
  
  // Redirect to profile if empty (first-time user)
  if (isProfileEmpty) {
    redirect("/profile")
  }

  // Get user data
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      profileImageUrl: true,
      profileImageCrop: true,
    }
  })

  // Get all applications for metrics
  const allApplications = await prisma.application.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      folder: true,
    },
  })

  // Get folders to check for favorites
  const folders = await prisma.folder.findMany({
    where: { userId: session.user.id },
  })
  const favoritesFolder = folders.find(f => f.name.toLowerCase() === "favoriten" || f.name.toLowerCase() === "favorites")

  // Calculate metrics
  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  // Current month applications
  const currentMonthApplications = allApplications.filter(
    app => app.createdAt >= currentMonthStart
  )

  // Last month applications
  const lastMonthApplications = allApplications.filter(
    app => app.createdAt >= lastMonthStart && app.createdAt < currentMonthStart
  )

  // Total applications (all time)
  const totalApplications = allApplications.length
  
  // Current month vs last month for change calculation
  const currentMonthCount = currentMonthApplications.length
  const lastMonthCount = lastMonthApplications.length
  const applicationsChange = lastMonthCount > 0 
    ? Math.round(((currentMonthCount - lastMonthCount) / lastMonthCount) * 100)
    : currentMonthCount > 0 ? 100 : 0

  // Upcoming interviews - Currently set to 0 as there's no interview tracking feature yet
  // TODO: Implement interview tracking feature (e.g., interviewDate field in Application model)
  const upcomingInterviews = 0
  const currentMonthInterviews = 0
  const lastMonthInterviews = 0
  const interviewsChange = 0

  // Favorites (applications in favorites folder)
  const favorites = favoritesFolder 
    ? allApplications.filter(app => app.folderId === favoritesFolder.id).length
    : 0
  const currentMonthFavorites = favoritesFolder
    ? currentMonthApplications.filter(app => app.folderId === favoritesFolder.id).length
    : 0
  const lastMonthFavorites = favoritesFolder
    ? lastMonthApplications.filter(app => app.folderId === favoritesFolder.id).length
    : 0
  const favoritesChange = lastMonthFavorites > 0
    ? Math.round(((currentMonthFavorites - lastMonthFavorites) / lastMonthFavorites) * 100)
    : currentMonthFavorites > 0 ? 100 : 0

  // Job offers (applications with status "OFFER" or similar - for now using a placeholder)
  const jobOffers = allApplications.filter(
    app => app.status === "OFFER" || app.status === "ACCEPTED"
  ).length
  const currentMonthJobOffers = currentMonthApplications.filter(
    app => app.status === "OFFER" || app.status === "ACCEPTED"
  ).length
  const lastMonthJobOffers = lastMonthApplications.filter(
    app => app.status === "OFFER" || app.status === "ACCEPTED"
  ).length
  const jobOffersChange = lastMonthJobOffers > 0
    ? Math.round(((currentMonthJobOffers - lastMonthJobOffers) / lastMonthJobOffers) * 100)
    : currentMonthJobOffers > 0 ? 100 : 0

  // Prepare chart data (monthly and weekly)
  const chartData = prepareChartData(allApplications)

  // Format date for welcome section
  const formatDate = () => {
    const now = new Date()
    const day = now.getDate().toString().padStart(2, "0")
    const monthNames = [
      "Januar", "Februar", "März", "April", "Mai", "Juni",
      "Juli", "August", "September", "Oktober", "November", "Dezember"
    ]
    const month = monthNames[now.getMonth()]
    const year = now.getFullYear()
    return `${day}. ${month} ${year}`
  }

  const firstName = user?.firstName || ""

  return (
    <div className="p-3 sm:p-4 lg:p-5 max-w-[1400px] mx-auto">
      {/* Welcome Section - Full Width */}
      <div className="mb-4 sm:mb-5 lg:mb-6">
        <h1 className="text-page-title mb-1 text-white">
          Hallo, {firstName}
        </h1>
        <p className="text-[var(--text-muted)] text-sm">{formatDate()}</p>
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 lg:gap-6 items-start">
        <div className="flex-1 min-w-0 w-full">
          <DashboardContent
            user={user}
            metrics={{
              applications: { count: totalApplications, change: applicationsChange },
              interviews: { count: upcomingInterviews, change: interviewsChange },
              favorites: { count: favorites, change: favoritesChange },
              jobOffers: { count: jobOffers, change: jobOffersChange },
            }}
            chartData={chartData}
            applications={allApplications.slice(0, 3)}
          />
        </div>
        <div className="w-full lg:w-80 flex-shrink-0">
          <UserProfileSidebar
            user={user}
            profile={profile}
          />
        </div>
      </div>
    </div>
  )
}

function prepareChartData(applications: any[]) {
  const now = new Date()
  const monthlyData: { [key: string]: { applications: number; interviews: number } } = {}
  const weeklyData: { [key: string]: { applications: number; interviews: number } } = {}

  // Initialize last 8 months
  for (let i = 7; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = date.toLocaleDateString("de-DE", { month: "short", year: "numeric" })
    monthlyData[monthKey] = { applications: 0, interviews: 0 }
  }

  // Initialize last 8 weeks
  for (let i = 7; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i * 7)
    // Get Monday of the week (week starts on Monday in Germany)
    const dayOfWeek = date.getDay()
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Adjust to Monday
    const weekStartDate = new Date(date)
    weekStartDate.setDate(diff)
    const weekNumber = getWeekNumber(weekStartDate)
    const weekKey = `KW ${weekNumber}`
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { applications: 0, interviews: 0 }
    }
  }

  // Count applications and interviews
  applications.forEach(app => {
    const appDate = new Date(app.createdAt)
    
    // Monthly
    const monthKey = appDate.toLocaleDateString("de-DE", { month: "short", year: "numeric" })
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].applications++
      // Interviews are not tracked yet, so always 0
      // TODO: Implement interview tracking feature
    }

    // Weekly
    const dayOfWeek = appDate.getDay()
    const diff = appDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Adjust to Monday
    const weekStartDate = new Date(appDate)
    weekStartDate.setDate(diff)
    const weekNumber = getWeekNumber(weekStartDate)
    const weekKey = `KW ${weekNumber}`
    if (weeklyData[weekKey]) {
      weeklyData[weekKey].applications++
      // Interviews are not tracked yet, so always 0
      // TODO: Implement interview tracking feature
    }
  })

  return {
    monthly: Object.entries(monthlyData).map(([month, data]) => ({
      month,
      applications: data.applications,
      interviews: data.interviews,
    })),
    weekly: Object.entries(weeklyData).map(([week, data]) => ({
      week,
      applications: data.applications,
      interviews: data.interviews,
    })),
  }
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

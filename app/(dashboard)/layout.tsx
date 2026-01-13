import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { SessionProvider } from "next-auth/react"
import { MobileMenuButton } from "@/components/layout/mobile-menu-button"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }
  
  return (
    <SessionProvider session={session}>
      <div className="h-screen flex bg-[var(--bg-page)] relative">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-[var(--bg-page)] transition-all duration-200 custom-scrollbar relative">
          {/* Mobile Menu Button */}
          <div className="lg:hidden fixed top-4 left-4 z-30">
            <MobileMenuButton />
          </div>
          <div className="min-h-full pt-16 lg:pt-0">
            {children}
          </div>
        </main>
      </div>
    </SessionProvider>
  )
}

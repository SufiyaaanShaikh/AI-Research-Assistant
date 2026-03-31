import { Sidebar } from './sidebar'
import { TopNav } from './top-nav'

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <TopNav />
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

'use client';

import { Sidebar } from './sidebar';
import { Header } from './header';
import { ChildProvider } from './child-selector';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChildProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-gray-50/50 p-4 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ChildProvider>
  );
}

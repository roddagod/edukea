'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Settings,
  Shield,
  LogOut,
  BookOpen,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';

const navSections = [
  {
    label: null,
    items: [
      { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { href: '/dashboard/schools', label: 'Etablissements', icon: Building2 },
      { href: '/dashboard/users', label: 'Utilisateurs', icon: Users },
      { href: '/dashboard/subscriptions', label: 'Abonnements', icon: CreditCard },
    ],
  },
  {
    label: 'Vie scolaire',
    items: [
      { href: '/dashboard/vie-scolaire', label: 'Vie scolaire', icon: BookOpen },
    ],
  },
  {
    label: null,
    items: [
      { href: '/dashboard/settings', label: 'Configuration', icon: Settings },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const sidebar = (
    <>
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="text-lg font-bold">Edukea</span>
          <p className="text-xs text-muted-foreground">Administration</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navSections.map((section, si) => (
          <div key={si}>
            {section.label && (
              <>
                {si > 0 && <Separator className="my-3" />}
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </p>
              </>
            )}
            {section.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gray-100 text-foreground'
                      : 'text-muted-foreground hover:bg-gray-50 hover:text-foreground'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t p-4">
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
          Deconnexion
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-white lg:flex">
        {sidebar}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-white shadow-xl">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex h-14 items-center gap-4 border-b bg-white px-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span className="font-bold">Edukea</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-gray-50/50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

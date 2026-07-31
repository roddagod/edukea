'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Shield,
  MoreHorizontal,
} from 'lucide-react';
import {
  AppShell,
  Topbar,
  Sidebar,
  SidebarWorkspace,
  SidebarSection,
  SidebarItem,
  SidebarDivider,
  SidebarUser,
  BottomNav,
  BottomNavItem,
  Avatar,
} from '@edukea/ui';
import { createClient } from '@/lib/supabase-browser';

const sections = [
  {
    label: 'Pilotage',
    items: [
      { href: '/dashboard', label: 'Cockpit', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { href: '/dashboard/schools', label: 'Ecoles', icon: Building2 },
      { href: '/dashboard/users', label: 'Utilisateurs', icon: Users },
      { href: '/dashboard/subscriptions', label: 'Abonnements', icon: CreditCard },
    ],
  },
];

const bottomNavItems = [
  { href: '/dashboard', label: 'Cockpit', icon: LayoutDashboard },
  { href: '/dashboard/schools', label: 'Ecoles', icon: Building2 },
  { href: '/dashboard/users', label: 'Utilisateurs', icon: Users },
  { href: '/dashboard/more', label: 'Plus', icon: MoreHorizontal },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname === href || pathname.startsWith(href + '/');

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const topbar = (
    <Topbar
      right={
        <div className="flex items-center gap-3">
          <Avatar initials="SA" tone="accent" size="md" />
        </div>
      }
      rightMobile={<Avatar initials="SA" tone="accent" size="sm" />}
    />
  );

  const sidebar = (
    <Sidebar
      workspace={
        <SidebarWorkspace
          icon={<Shield className="h-[18px] w-[18px]" />}
          title="Edukea"
          sub="Administration"
        />
      }
      user={<SidebarUser initials="SA" name="Super Admin" role="Administrateur" />}
    >
      {sections.map((section) => (
        <div key={section.label}>
          <SidebarSection>{section.label}</SidebarSection>
          {section.items.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarItem
                key={item.href}
                href={item.href}
                active={isActive(item.href)}
                icon={<Icon />}
              >
                {item.label}
              </SidebarItem>
            );
          })}
        </div>
      ))}
      <div className="flex-1" />
      <SidebarDivider />
      <SidebarItem
        href="/dashboard/settings"
        active={isActive('/dashboard/settings')}
        icon={<Settings />}
      >
        Parametres
      </SidebarItem>
      <SidebarItem
        href="#"
        active={false}
        icon={<LogOut />}
        onClick={handleLogout}
      >
        Deconnexion
      </SidebarItem>
    </Sidebar>
  );

  const bottomNav = (
    <BottomNav>
      {bottomNavItems.map((item) => {
        const Icon = item.icon;
        return (
          <BottomNavItem
            key={item.href}
            href={item.href}
            active={isActive(item.href)}
            icon={<Icon className="h-5 w-5" />}
            label={item.label}
          />
        );
      })}
    </BottomNav>
  );

  return (
    <AppShell topbar={topbar} sidebar={sidebar} bottomNav={bottomNav}>
      {children}
    </AppShell>
  );
}

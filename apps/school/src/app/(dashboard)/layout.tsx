'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Coins,
  CreditCard,
  Megaphone,
  Settings,
  Building2,
  BarChart3,
  RefreshCw,
  MoreHorizontal,
  ChevronDown,
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
  Badge,
} from '@edukea/ui';
import { useSchoolContext } from '@edukea/shared';

const sections = [
  {
    label: 'Pilotage',
    items: [
      { href: '/dashboard', label: 'Cockpit', icon: LayoutDashboard, badge: null as React.ReactNode | null },
      { href: '/dashboard/reports', label: 'Rapports', icon: BarChart3, badge: null as React.ReactNode | null },
    ],
  },
  {
    label: 'Scolarite',
    items: [
      { href: '/dashboard/students', label: 'Eleves', icon: Users, badge: <Badge>1573</Badge> as React.ReactNode | null },
      { href: '/dashboard/enrollment', label: 'Inscription', icon: UserPlus, badge: null as React.ReactNode | null },
      { href: '/dashboard/enrollment/passage', label: "Passage d'annee", icon: RefreshCw, badge: null as React.ReactNode | null },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/dashboard/recovery', label: 'Recouvrement', icon: Coins, badge: <Badge tone="danger">12</Badge> as React.ReactNode | null },
      { href: '/dashboard/payments', label: 'Versements', icon: CreditCard, badge: null as React.ReactNode | null },
    ],
  },
  {
    label: 'Communication',
    items: [
      { href: '/dashboard/announcements', label: 'Annonces', icon: Megaphone, badge: null as React.ReactNode | null },
    ],
  },
];

const bottomNavItems = [
  { href: '/dashboard', label: 'Cockpit', icon: LayoutDashboard, badge: null as React.ReactNode | null },
  { href: '/dashboard/students', label: 'Eleves', icon: Users, badge: null as React.ReactNode | null },
  { href: '/dashboard/recovery', label: 'Recouvrer', icon: Coins, badge: <Badge tone="danger">12</Badge> as React.ReactNode | null },
  { href: '/dashboard/announcements', label: 'Annonces', icon: Megaphone, badge: null as React.ReactNode | null },
  { href: '/dashboard/more', label: 'Plus', icon: MoreHorizontal, badge: null as React.ReactNode | null },
];

interface SelectPillProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  showDot?: boolean;
  ariaLabel?: string;
}

// Native <select> stylise comme une ContextPill. Fonctionnel + mobile-friendly + a11y.
function SelectPill({ value, onChange, options, showDot, ariaLabel }: SelectPillProps) {
  return (
    <div className="relative inline-flex items-center">
      {showDot && <span className="pointer-events-none absolute left-3 h-1.5 w-1.5 rounded-full bg-brand-accent" />}
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none rounded-full border border-line bg-white py-2 pr-9 text-body-sm font-semibold text-ink-2 outline-none transition-colors hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          showDot ? 'pl-8' : 'pl-3.5'
        }`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-ink-3" />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
  const isBottomActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname === href || pathname.startsWith(href + '/');

  const requestedSchoolId = searchParams.get('school');
  const requestedYearId = searchParams.get('year');
  const { data: ctx } = useSchoolContext({ requestedSchoolId, requestedYearId });

  const setParam = useCallback(
    (key: 'school' | 'year', value: string) => {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.set(key, value);
      // Un changement d'ecole reset l'annee (car les annees sont school-specifiques)
      if (key === 'school') params.delete('year');
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const currentSchoolName = ctx?.current_school?.name ?? '—';
  const currentYearName = ctx?.current_year?.name ?? '—';

  const topbarRight = (
    <>
      {ctx?.is_superadmin && ctx.schools.length > 1 && (
        <SelectPill
          ariaLabel="Ecole"
          showDot
          value={ctx.current_school?.id ?? ''}
          onChange={(v) => setParam('school', v)}
          options={ctx.schools.map((s) => ({ value: s.id, label: s.name }))}
        />
      )}
      {ctx && ctx.years.length > 0 && (
        <SelectPill
          ariaLabel="Annee scolaire"
          value={ctx.current_year?.id ?? ''}
          onChange={(v) => setParam('year', v)}
          options={ctx.years.map((y) => ({ value: y.id, label: `Annee ${y.name}` }))}
        />
      )}
      <Avatar initials="JA" tone="accent" size="md" />
    </>
  );

  const topbar = <Topbar right={topbarRight} rightMobile={<Avatar initials="JA" tone="accent" size="sm" />} />;

  const sidebar = (
    <Sidebar
      workspace={
        <SidebarWorkspace
          icon={<Building2 className="h-[18px] w-[18px]" />}
          title={ctx?.is_superadmin ? 'Espace Lambano' : 'Espace direction'}
          sub={currentSchoolName}
        />
      }
      user={<SidebarUser initials="JA" name="Joel Akoun" role={ctx?.is_superadmin ? 'Superadmin' : 'Directeur general'} />}
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
                badge={item.badge}
              >
                {item.label}
              </SidebarItem>
            );
          })}
        </div>
      ))}
      <div className="flex-1" />
      <SidebarDivider />
      <SidebarItem href="/dashboard/settings" active={isActive('/dashboard/settings')} icon={<Settings />}>
        Parametrage
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
            active={isBottomActive(item.href)}
            icon={<Icon className="h-5 w-5" />}
            label={item.label}
            badge={item.badge}
          />
        );
      })}
    </BottomNav>
  );

  return (
    <AppShell topbar={topbar} sidebar={sidebar} bottomNav={bottomNav}>
      {/* Bandeau selectors mobile : sous md uniquement, car les selectors du topbar sont caches */}
      {ctx && (
        <div className="flex flex-wrap items-center gap-2 lg:hidden">
          {ctx.is_superadmin && ctx.schools.length > 1 && (
            <SelectPill
              ariaLabel="Ecole"
              showDot
              value={ctx.current_school?.id ?? ''}
              onChange={(v) => setParam('school', v)}
              options={ctx.schools.map((s) => ({ value: s.id, label: s.name }))}
            />
          )}
          {ctx.years.length > 0 && (
            <SelectPill
              ariaLabel="Annee scolaire"
              value={ctx.current_year?.id ?? ''}
              onChange={(v) => setParam('year', v)}
              options={ctx.years.map((y) => ({ value: y.id, label: `Annee ${y.name}` }))}
            />
          )}
        </div>
      )}
      {children}
    </AppShell>
  );
}

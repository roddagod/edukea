'use client';

import { Bell } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChildSelector } from './child-selector';
import { useAuth } from '@edukea/shared';
import { getInitials } from '@edukea/shared';

export function Header() {
  const { profile, user } = useAuth();

  // Build display name from parent's family records
  const displayName = profile?.father
    ? `${profile.father.firstname || ''} ${profile.father.lastname || ''}`.trim()
    : profile?.mother
      ? `${profile.mother.firstname || ''} ${profile.mother.lastname || ''}`.trim()
      : profile?.tutor
        ? `${profile.tutor.firstname || ''} ${profile.tutor.lastname || ''}`.trim()
        : user?.email || '';

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 lg:px-8">
      <div className="flex items-center gap-4 lg:ml-0 ml-14">
        <ChildSelector />
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative" asChild>
          <a href="/notifications">
            <Bell className="h-5 w-5" />
          </a>
        </Button>

        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getInitials(displayName || 'P')}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium md:block">{displayName}</span>
        </div>
      </div>
    </header>
  );
}

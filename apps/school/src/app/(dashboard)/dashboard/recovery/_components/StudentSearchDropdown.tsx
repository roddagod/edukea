'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, User } from 'lucide-react';
import { Avatar, toneFromSeed, StatusPill } from '@edukea/ui';
import { useRecoveryStudents } from '@edukea/shared';

function fmtNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n).replace(/[  ]/g, ' ');
}

export interface StudentSearchDropdownProps {
  schoolId: string | undefined;
  schoolYearId: string | undefined;
  /** Chaîne à préserver dans les liens (ex: `?school=X&year=Y`). */
  qsSuffix: string;
}

/**
 * Barre de recherche instantanée pour trouver un élève par nom ou matricule.
 * Dropdown avec avatar + classe + solde + statut. Debounced 200ms.
 * Enter/Click = navigation vers la fiche élève.
 */
export function StudentSearchDropdown({ schoolId, schoolYearId, qsSuffix }: StudentSearchDropdownProps) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 200);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const { data, isFetching } = useRecoveryStudents({
    schoolId,
    schoolYearId,
    search: debounced,
    page: 1,
    pageSize: 8,
    sort: 'name_asc',
  });

  const hasQuery = debounced.length >= 2;
  const rows = useMemo(() => (hasQuery ? data?.rows ?? [] : []), [data, hasQuery]);

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex h-12 items-center gap-2.5 rounded-xl border bg-white pl-4 pr-1.5 shadow-flat transition-all ${
          open ? 'border-primary ring-2 ring-primary/20' : 'border-line hover:border-ink-4'
        }`}
      >
        <Search className="h-4 w-4 shrink-0 text-ink-3" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Rechercher un élève par nom, prénom ou matricule…"
          className="min-w-0 flex-1 bg-transparent text-body-md text-ink placeholder:text-ink-4 focus:outline-none"
        />
        {isFetching && hasQuery && (
          <span className="text-caption text-ink-3">Recherche…</span>
        )}
      </div>

      {open && hasQuery && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-line bg-white shadow-hover">
          {rows.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-4 text-body-sm text-ink-3">
              <User className="h-4 w-4" />
              Aucun élève trouvé pour « {debounced} »
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {rows.map((r) => (
                <Link
                  key={r.ssyl_id}
                  href={`/dashboard/recovery/${r.ssyl_id}${qsSuffix}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 border-b border-line-soft px-4 py-3 last:border-b-0 hover:bg-line-soft"
                >
                  <Avatar
                    initials={r.student_name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? '').join('')}
                    tone={toneFromSeed(r.ssyl_id)}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-body-sm font-semibold text-ink">{r.student_name}</div>
                    <div className="mt-0.5 truncate text-caption text-ink-3">
                      {r.classroom_name ?? '—'}
                      {r.matricule && <> · Matr. {r.matricule}</>}
                    </div>
                  </div>
                  <div className="hidden shrink-0 text-right sm:block">
                    <div className="font-display text-body-sm font-semibold tabular-nums text-ink">
                      {fmtNumber(r.remaining)}
                      <span className="ml-0.5 text-caption font-medium text-ink-3">FCFA</span>
                    </div>
                    <div className="mt-0.5 flex justify-end">
                      <StatusPill status={r.status} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

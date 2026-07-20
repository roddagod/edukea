'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ChevronRight, ChevronLeft, ChevronDown } from 'lucide-react';
import {
  PageHeader,
  SearchInput,
  StatusPill,
  Avatar,
  toneFromSeed,
  Card,
  TxTableSkeleton,
} from '@edukea/ui';
import {
  useSchoolContext,
  useRecoveryStudents,
  useSchoolClassrooms,
  type RecoveryStatus,
} from '@edukea/shared';

function fmtNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n).replace(/[  ]/g, ' ');
}

function StatusFilterPill({
  value,
  onChange,
}: {
  value: RecoveryStatus | 'all';
  onChange: (v: RecoveryStatus | 'all') => void;
}) {
  return (
    <div className="relative inline-flex items-center">
      <select
        aria-label="Filtre statut"
        value={value}
        onChange={(e) => onChange(e.target.value as RecoveryStatus | 'all')}
        className="appearance-none rounded-full border border-line bg-white pl-3.5 pr-9 py-2 text-body-sm font-semibold text-ink-2 outline-none transition-colors hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <option value="all">Tous statuts</option>
        <option value="impaye">Impayés</option>
        <option value="debute">Partiel</option>
        <option value="solde">Soldés</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-ink-3" />
    </div>
  );
}

function ClassroomFilterPill({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ id: string; name: string }>;
}) {
  return (
    <div className="relative inline-flex items-center">
      <select
        aria-label="Filtre classe"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-full border border-line bg-white pl-3.5 pr-9 py-2 text-body-sm font-semibold text-ink-2 outline-none transition-colors hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <option value="all">Toutes classes</option>
        {options.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-ink-3" />
    </div>
  );
}

const PAGE_SIZE = 25;

export default function RecoveryPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const requestedSchoolId = searchParams.get('school');
  const requestedYearId = searchParams.get('year');
  const { data: ctx } = useSchoolContext({ requestedSchoolId, requestedYearId });
  const schoolId = ctx?.current_school?.id;
  const schoolYearId = ctx?.current_year?.id;

  const status = (searchParams.get('status') as RecoveryStatus | 'all' | null) ?? 'all';
  const classroomId = searchParams.get('classroom') ?? 'all';
  const search = searchParams.get('q') ?? '';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);

  const [searchInput, setSearchInput] = useState(search);

  const { data: rooms } = useSchoolClassrooms(schoolId, schoolYearId);
  const { data: pageData, isLoading, isFetching } = useRecoveryStudents({
    schoolId,
    schoolYearId,
    status,
    classroomId,
    search,
    page,
    pageSize: PAGE_SIZE,
    sort: 'remaining_desc',
  });

  const setParam = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === '' || v === 'all') params.delete(k);
        else params.set(k, v);
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const totalPages = useMemo(() => {
    if (!pageData) return 1;
    return Math.max(1, Math.ceil(pageData.total / pageData.pageSize));
  }, [pageData]);

  const rangeStart = pageData ? (pageData.page - 1) * pageData.pageSize + 1 : 0;
  const rangeEnd = pageData ? Math.min(pageData.total, pageData.page * pageData.pageSize) : 0;

  const submitSearch = () => setParam({ q: searchInput || null, page: '1' });

  return (
    <>
      <PageHeader
        title="Recouvrement"
        sub={
          ctx?.current_school?.name && ctx.current_year?.name
            ? `${ctx.current_school.name} · ${ctx.current_year.name}`
            : '—'
        }
      />

      {/* Filtres */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="w-full sm:max-w-md">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
            onBlur={submitSearch}
            placeholder="Rechercher un élève, un matricule…"
          />
        </div>
        <StatusFilterPill
          value={status}
          onChange={(v) => setParam({ status: v === 'all' ? null : v, page: '1' })}
        />
        <ClassroomFilterPill
          value={classroomId}
          onChange={(v) => setParam({ classroom: v === 'all' ? null : v, page: '1' })}
          options={rooms ?? []}
        />
      </div>

      {/* Résultat compteur */}
      {pageData && (
        <p className="text-body-xs text-ink-3">
          {pageData.total > 0 ? (
            <>
              {rangeStart}–{rangeEnd} sur <span className="font-semibold text-ink">{fmtNumber(pageData.total)}</span> élèves
            </>
          ) : (
            'Aucun élève'
          )}
        </p>
      )}

      {/* Liste */}
      {isLoading ? (
        <TxTableSkeleton rows={PAGE_SIZE} />
      ) : (
        <Card className="p-0">
          <div className={isFetching ? 'opacity-60 transition-opacity' : ''}>
            {/* Header desktop */}
            <div className="hidden md:grid md:grid-cols-[40px_1.5fr_100px_120px_120px_100px_28px] md:gap-3.5 bg-line-soft px-5 py-3 text-caption font-semibold text-ink-3">
              <span />
              <span>Élève</span>
              <span>Classe</span>
              <span className="text-right">Facturé</span>
              <span className="text-right">Restant</span>
              <span>Statut</span>
              <span />
            </div>
            {(pageData?.rows ?? []).map((r) => (
              <Link
                key={r.ssyl_id}
                href={`/dashboard/recovery/${r.ssyl_id}`}
                className="flex items-center gap-3 border-b border-line-soft px-4 py-3 text-body-sm transition-colors last:border-b-0 hover:bg-[#FBFCFE] active:bg-line-soft md:grid md:grid-cols-[40px_1.5fr_100px_120px_120px_100px_28px] md:gap-3.5 md:px-5"
              >
                <Avatar
                  initials={r.student_name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? '').join('')}
                  tone={toneFromSeed(r.ssyl_id)}
                  size="sm"
                />
                <div className="min-w-0 flex-1 md:flex-none">
                  <div className="truncate font-semibold text-ink">{r.student_name}</div>
                  {r.matricule && <div className="mt-0.5 text-caption text-ink-3">Matr. {r.matricule}</div>}
                </div>
                <div className="hidden text-body-xs font-medium text-ink-2 md:block">{r.classroom_name ?? '—'}</div>
                <div className="hidden font-display text-body-sm tabular-nums text-ink-3 md:block md:text-right">
                  {fmtNumber(r.billed_initial)}
                </div>
                <div className="ml-auto font-display text-body-md font-semibold tabular-nums text-ink md:ml-0 md:text-right">
                  {fmtNumber(r.remaining)}
                </div>
                <div className="hidden md:block">
                  <StatusPill status={r.status} />
                </div>
                <div className="hidden text-ink-3 md:flex md:items-center md:justify-center">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
            {(pageData?.rows.length ?? 0) === 0 && (
              <div className="px-5 py-8 text-center text-body-sm text-ink-3">
                Aucun élève ne correspond aux filtres.
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Pagination */}
      {pageData && pageData.total > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setParam({ page: String(page - 1) })}
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3.5 py-2 text-body-sm font-semibold text-ink-2 transition-colors hover:border-primary hover:text-primary disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </button>
          <span className="text-body-xs text-ink-3">
            Page <span className="font-semibold text-ink">{page}</span> sur {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setParam({ page: String(page + 1) })}
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3.5 py-2 text-body-sm font-semibold text-ink-2 transition-colors hover:border-primary hover:text-primary disabled:opacity-40 disabled:pointer-events-none"
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}

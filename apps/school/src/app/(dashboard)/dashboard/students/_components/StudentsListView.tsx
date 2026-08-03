'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStudentsList, useStudentTypes, useSchoolStructure } from '@edukea/shared';
import { Input, Skeleton, Badge } from '@edukea/ui';
import { Search, X, Download } from 'lucide-react';

interface Props { schoolId: string; }

export function StudentsListView({ schoolId }: Props) {
  const [search, setSearch] = useState('');
  const [classroomId, setClassroomId] = useState<string>('');
  const [studentTypeId, setStudentTypeId] = useState<string>('');

  const { data: types } = useStudentTypes(schoolId);
  const { data: structure } = useSchoolStructure(schoolId);
  const { data: students, isLoading } = useStudentsList({
    schoolId,
    search: search || undefined,
    classroomId: classroomId || undefined,
    studentTypeId: studentTypeId || undefined,
    limit: 500,
  });

  const allClassrooms = (structure?.tree ?? []).flatMap((c) => c.levels).flatMap((l) => l.classrooms);
  const hasFilters = search || classroomId || studentTypeId;
  const selectedClassroom = classroomId ? allClassrooms.find((c) => c.id === classroomId) : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par matricule ou nom…"
            className="pl-9"
          />
        </div>
        <select
          value={classroomId}
          onChange={(e) => setClassroomId(e.target.value)}
          className="rounded border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">Toutes classes</option>
          {allClassrooms.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={studentTypeId}
          onChange={(e) => setStudentTypeId(e.target.value)}
          className="rounded border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">Tous types</option>
          {(types ?? []).map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setClassroomId(''); setStudentTypeId(''); }}
            className="inline-flex items-center gap-1 rounded px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            <X className="h-4 w-4" /> Effacer
          </button>
        )}
      </div>

      {/* PDF export bar — visible only when a classroom filter is active */}
      {selectedClassroom && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-sm font-medium text-slate-700">
            Exports PDF — {selectedClassroom.name} :
          </span>
          <a
            href={`/api/pdf/class-grades-sheet/${selectedClassroom.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-[#E97423] hover:text-[#E97423]"
          >
            <Download className="h-3.5 w-3.5" /> Liste classe (grille)
          </a>
          <a
            href={`/api/pdf/class-roll-call/${selectedClassroom.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-[#E97423] hover:text-[#E97423]"
          >
            <Download className="h-3.5 w-3.5" /> Liste d'appel
          </a>
          <a
            href={`/api/pdf/parent-contact-list/${selectedClassroom.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-[#E97423] hover:text-[#E97423]"
          >
            <Download className="h-3.5 w-3.5" /> Liste parents
          </a>
          <a
            href={`/api/pdf/class-entry-tickets/${selectedClassroom.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-[#E97423] hover:text-[#E97423]"
          >
            <Download className="h-3.5 w-3.5" /> Billets d'entrée
          </a>
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          <p className="text-xs text-slate-500">{(students ?? []).length} élève(s)</p>
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead className="border-b-2 border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 text-left">Matricule</th>
                  <th className="px-4 py-2.5 text-left">Nom</th>
                  <th className="px-4 py-2.5 text-left hidden md:table-cell">Prénoms</th>
                  <th className="px-4 py-2.5 text-left hidden sm:table-cell">Sexe</th>
                  <th className="px-4 py-2.5 text-left">Classe</th>
                  <th className="px-4 py-2.5 text-left hidden md:table-cell">Type</th>
                  <th className="px-4 py-2.5 text-left hidden lg:table-cell">Année</th>
                </tr>
              </thead>
              <tbody>
                {(students ?? []).map((s, idx) => (
                  <tr key={s.id} className={`border-b last:border-none hover:bg-orange-50/50 ${idx % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                    <td className="px-4 py-2.5"><code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs">{s.matricule ?? '—'}</code></td>
                    <td className="px-4 py-2.5"><Link href={`/dashboard/students/${s.id}`} className="font-semibold text-slate-900 hover:text-orange-600">{s.lastname ?? '—'}</Link></td>
                    <td className="px-4 py-2.5 hidden md:table-cell text-slate-600">{s.firstname ?? '—'}</td>
                    <td className="px-4 py-2.5 hidden sm:table-cell text-slate-600">{s.sex ?? '—'}</td>
                    <td className="px-4 py-2.5">{s.current_classroom_name ?? <span className="text-xs italic text-slate-400">Aucune</span>}</td>
                    <td className="px-4 py-2.5 hidden md:table-cell">{s.student_type_label ? <Badge>{s.student_type_label}</Badge> : '—'}</td>
                    <td className="px-4 py-2.5 hidden lg:table-cell text-xs text-slate-500">{s.current_school_year_name ?? '—'}</td>
                  </tr>
                ))}
                {(students ?? []).length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                    Aucun élève ne correspond aux filtres.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

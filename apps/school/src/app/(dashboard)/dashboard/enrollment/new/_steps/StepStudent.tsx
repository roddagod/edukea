'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, UserCheck, Check, X, Loader2 } from 'lucide-react';
import {
  FormField, Input, Checkbox, DatePicker, RadioCards, SearchInput,
  Card, Avatar, toneFromSeed,
} from '@edukea/ui';
import { useStudentSearch, useStudentTypes, useStudentReenrollStatus, reenrollStatusColor, supabase } from '@edukea/shared';
import { useQuery } from '@tanstack/react-query';
import type { EnrollmentFormState } from '../_types';

// Verification unicite matricule en temps reel (debounce naturel via useQuery + staleTime)
function useMatriculeAvailable(schoolId: string | undefined, matricule: string) {
  const trimmed = matricule.trim();
  return useQuery<boolean>({
    queryKey: ['matricule-available', schoolId, trimmed],
    enabled: !!schoolId && trimmed.length >= 2,
    staleTime: 5 * 1000,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: unknown }>)('check_matricule_available', {
        p_school_id: schoolId,
        p_matricule: trimmed,
        p_exclude_student_id: null,
      });
      if (error) throw error as Error;
      return Boolean(data);
    },
  });
}

function MatriculeInput({
  schoolId,
  value,
  onChange,
}: {
  schoolId: string | undefined;
  value: string;
  onChange: (v: string) => void;
}) {
  const { data: available, isFetching } = useMatriculeAvailable(schoolId, value);
  const trimmed = value.trim();
  const showStatus = trimmed.length >= 2 && !isFetching;
  const isTaken = showStatus && available === false;
  const isOk = showStatus && available === true;

  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Ex : 24BAC001234"
      suffix={
        isFetching ? <Loader2 className="h-4 w-4 animate-spin text-ink-3" /> :
        isTaken ? <X className="h-4 w-4 text-destructive" /> :
        isOk ? <Check className="h-4 w-4 text-green-600" /> : null
      }
      error={isTaken ? 'Ce matricule est déjà utilisé dans cette école' : undefined}
    />
  );
}

export function StepStudent({
  schoolId,
  qsSuffix,
  value,
  onChange,
  typeStudentId,
  onTypeStudentChange,
}: {
  schoolId: string | undefined;
  qsSuffix: string;
  value: EnrollmentFormState['student'];
  onChange: (v: EnrollmentFormState['student']) => void;
  typeStudentId: string | undefined;
  onTypeStudentChange: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const { data: results } = useStudentSearch(schoolId, query);
  const { data: studentTypes } = useStudentTypes(schoolId);

  const studentIds = (results ?? []).map((s) => s.id);
  const { data: statusMap } = useStudentReenrollStatus(studentIds);

  // Auto-sélectionner le type par défaut (is_default=true, sinon le premier)
  useEffect(() => {
    if (typeStudentId || !studentTypes?.length) return;
    const defaultType = studentTypes.find((t) => t.is_default) ?? studentTypes[0];
    if (defaultType) onTypeStudentChange(defaultType.id);
  }, [studentTypes, typeStudentId, onTypeStudentChange]);

  return (
    <div className="flex flex-col gap-5">
      <Card className="bg-primary/[0.03]">
        <div className="mb-2 flex items-center gap-2 text-body-sm font-semibold text-primary">
          <Search className="h-4 w-4" /> Vérifier si l'élève existe déjà
        </div>
        <SearchInput value={query} onChange={setQuery} placeholder="Nom, prénom, matricule…" />
        {results && results.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {results.map((s) => {
              const rs = statusMap?.get(s.id);
              const sc = rs ? reenrollStatusColor(rs.status) : null;
              return (
                <Link
                  key={s.id}
                  href={`/dashboard/enrollment/re/${s.id}${qsSuffix}`}
                  className="flex items-center gap-3 rounded-md border border-line bg-white p-3 hover:border-primary hover:bg-primary/[0.04]"
                >
                  <Avatar
                    initials={`${(s.lastname ?? '?')[0] ?? ''}${(s.firstname ?? '?')[0] ?? ''}`.toUpperCase()}
                    tone={toneFromSeed(s.id)}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-ink">{s.lastname} {s.firstname}</div>
                    <div className="flex items-center gap-2">
                      {s.matricule && <span className="text-caption text-ink-3">Matr. {s.matricule}</span>}
                      {rs?.last_school_year_name && (
                        <span className="text-caption text-ink-3">{rs.last_school_year_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sc && (
                      <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${sc.className}`}>
                        {sc.label}
                      </span>
                    )}
                    <div className="text-body-xs font-semibold text-primary">Réinscrire →</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        {results && query.length >= 2 && results.length === 0 && (
          <div className="mt-2 flex items-center gap-2 text-body-xs text-ink-3">
            <UserCheck className="h-4 w-4" /> Aucun élève existant — continuer la création ci-dessous
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Matricule (Ministère)"
          required
          hint="Numéro officiel du Ministère de l'Éducation. Doit être unique dans l'école."
          className="sm:col-span-2"
        >
          <MatriculeInput
            schoolId={schoolId}
            value={value.matricule}
            onChange={(v) => onChange({ ...value, matricule: v })}
          />
        </FormField>
        <FormField label="Nom" required>
          <Input value={value.lastname} onChange={(e) => onChange({ ...value, lastname: e.target.value })} />
        </FormField>
        <FormField label="Prénom(s)" required>
          <Input value={value.firstname} onChange={(e) => onChange({ ...value, firstname: e.target.value })} />
        </FormField>
        <FormField label="Sexe" required>
          <RadioCards
            name="sex"
            columns={2}
            options={[
              { value: 'M', label: 'Masculin' },
              { value: 'F', label: 'Féminin' },
            ]}
            value={value.sex || undefined}
            onChange={(v) => onChange({ ...value, sex: v as 'M' | 'F' })}
          />
        </FormField>
        <FormField label="Date de naissance" required>
          <DatePicker value={value.birthdate} onChange={(e) => onChange({ ...value, birthdate: e.target.value })} />
        </FormField>
        <FormField label="Lieu de naissance">
          <Input value={value.birthplace} onChange={(e) => onChange({ ...value, birthplace: e.target.value })} />
        </FormField>
        <FormField label="Nationalité">
          <Input value={value.nationality} onChange={(e) => onChange({ ...value, nationality: e.target.value })} />
        </FormField>
      </div>

      <Checkbox
        checked={value.redoublant}
        onChange={(e) => onChange({ ...value, redoublant: e.target.checked })}
        label="Élève redoublant"
        hint="Cocher si l'élève reprend la même classe qu'à l'année N-1"
      />
    </div>
  );
}

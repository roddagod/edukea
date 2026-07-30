'use client';

import { useState } from 'react';
import { useUpdateStudent, useUpdateSsyl, useStudentTypes, useSchoolStructure } from '@edukea/shared';
import { Modal, Button, Input } from '@edukea/ui';

interface Props {
  student: {
    id: string;
    matricule: string | null;
    firstname: string | null;
    lastname: string | null;
    sex: string | null;
    date_of_birth: string | null;
    place_of_birth: string | null;
    nationality: string | null;
    birth_certificate_number: string | null;
    email: string | null;
    student_type_id: string | null;
    school_id: string;
  };
  currentSsyl: {
    id: string;
    classroom_id: string;
    is_redoublant: boolean;
    lv2_subject_id: string | null;
    mat_secondaire_subject_id: string | null;
    eps_exemption: boolean;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditStudentDialog({ student, currentSsyl, isOpen, onClose }: Props) {
  const updateStudent = useUpdateStudent();
  const updateSsyl = useUpdateSsyl();
  const { data: types } = useStudentTypes(student.school_id);
  const { data: structure } = useSchoolStructure(student.school_id);

  // Identite states
  const [firstname, setFirstname] = useState(student.firstname ?? '');
  const [lastname, setLastname] = useState(student.lastname ?? '');
  const [sex, setSex] = useState<'M' | 'F' | ''>(
    (student.sex as 'M' | 'F' | '') || '',
  );
  const [dateOfBirth, setDateOfBirth] = useState(student.date_of_birth ?? '');
  const [placeOfBirth, setPlaceOfBirth] = useState(student.place_of_birth ?? '');
  const [nationality, setNationality] = useState(student.nationality ?? '');
  const [birthCert, setBirthCert] = useState(
    student.birth_certificate_number ?? '',
  );
  const [email, setEmail] = useState(student.email ?? '');
  const [studentTypeId, setStudentTypeId] = useState(
    student.student_type_id ?? '',
  );

  // Inscription states
  const [classroomId, setClassroomId] = useState(
    currentSsyl?.classroom_id ?? '',
  );
  const [isRedoublant, setIsRedoublant] = useState(
    currentSsyl?.is_redoublant ?? false,
  );
  const [epsExemption, setEpsExemption] = useState(
    currentSsyl?.eps_exemption ?? false,
  );

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setSaving(true);
    try {
      // Build student patch — only changed fields
      const studentPatch: Record<string, unknown> = { id: student.id };
      if (firstname !== (student.firstname ?? ''))
        studentPatch.firstname = firstname || null;
      if (lastname !== (student.lastname ?? ''))
        studentPatch.lastname = lastname || null;
      if (sex !== (student.sex ?? ''))
        studentPatch.sex = sex || null;
      if (dateOfBirth !== (student.date_of_birth ?? ''))
        studentPatch.date_of_birth = dateOfBirth || null;
      if (placeOfBirth !== (student.place_of_birth ?? ''))
        studentPatch.place_of_birth = placeOfBirth || null;
      if (nationality !== (student.nationality ?? ''))
        studentPatch.nationality = nationality || null;
      if (birthCert !== (student.birth_certificate_number ?? ''))
        studentPatch.birth_certificate_number = birthCert || null;
      if (email !== (student.email ?? ''))
        studentPatch.email = email || null;
      if (studentTypeId !== (student.student_type_id ?? ''))
        studentPatch.student_type_id = studentTypeId || null;

      if (Object.keys(studentPatch).length > 1) {
        await updateStudent.mutateAsync(
          studentPatch as unknown as Parameters<typeof updateStudent.mutateAsync>[0],
        );
      }

      // Build ssyl patch — only changed fields
      if (currentSsyl) {
        const ssylPatch: Record<string, unknown> = { id: currentSsyl.id };
        if (classroomId !== currentSsyl.classroom_id)
          ssylPatch.classroom_id = classroomId;
        if (isRedoublant !== currentSsyl.is_redoublant)
          ssylPatch.is_redoublant = isRedoublant;
        if (epsExemption !== currentSsyl.eps_exemption)
          ssylPatch.eps_exemption = epsExemption;
        if (Object.keys(ssylPatch).length > 1) {
          await updateSsyl.mutateAsync(
            ssylPatch as unknown as Parameters<typeof updateSsyl.mutateAsync>[0],
          );
        }
      }

      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  };

  // Flatten classroom options grouped by cycle > level > classroom
  const classroomOptions = (structure?.tree ?? []).flatMap((cycle) =>
    cycle.levels.flatMap((level) =>
      level.classrooms.map((classroom) => ({
        id: classroom.id,
        label: `${cycle.name} → ${level.name} → ${classroom.name}`,
      })),
    ),
  );

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Editer l'eleve"
      description={`Matricule ${student.matricule ?? '—'}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-md bg-[#E97423] px-4 py-2 text-sm font-medium text-white hover:bg-[#c9621d] disabled:opacity-50"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Identite */}
        <section>
          <h3 className="mb-3 text-body-xs font-semibold uppercase text-ink-3">
            Identite
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-body-xs font-semibold text-ink-2">
                Prenom
              </label>
              <Input
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
              />
            </div>
            <div>
              <label className="text-body-xs font-semibold text-ink-2">
                Nom
              </label>
              <Input
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
              />
            </div>
            <div>
              <label className="text-body-xs font-semibold text-ink-2">
                Sexe
              </label>
              <div className="mt-1 flex gap-3">
                {(['M', 'F'] as const).map((v) => (
                  <label key={v} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={sex === v}
                      onChange={() => setSex(v)}
                    />
                    {v === 'M' ? 'Masculin' : 'Feminin'}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-body-xs font-semibold text-ink-2">
                Date de naissance
              </label>
              <Input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>
            <div>
              <label className="text-body-xs font-semibold text-ink-2">
                Lieu de naissance
              </label>
              <Input
                value={placeOfBirth}
                onChange={(e) => setPlaceOfBirth(e.target.value)}
              />
            </div>
            <div>
              <label className="text-body-xs font-semibold text-ink-2">
                Nationalite
              </label>
              <Input
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-body-xs font-semibold text-ink-2">
                N&deg; extrait naissance
              </label>
              <Input
                value={birthCert}
                onChange={(e) => setBirthCert(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-body-xs font-semibold text-ink-2">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-body-xs font-semibold text-ink-2">
                Type d&apos;eleve
              </label>
              <select
                value={studentTypeId}
                onChange={(e) => setStudentTypeId(e.target.value)}
                className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">&mdash; Aucun &mdash;</option>
                {(types ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Inscription courante */}
        {currentSsyl && (
          <section>
            <h3 className="mb-3 text-body-xs font-semibold uppercase text-ink-3">
              Inscription courante
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-body-xs font-semibold text-ink-2">
                  Classe
                </label>
                <select
                  value={classroomId}
                  onChange={(e) => setClassroomId(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                >
                  {classroomOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Attention&nbsp;: changer de classe ne recalcule pas les
                  echeances deja generees.
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isRedoublant}
                  onChange={(e) => setIsRedoublant(e.target.checked)}
                />
                Redoublant
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={epsExemption}
                  onChange={(e) => setEpsExemption(e.target.checked)}
                />
                Dispense EPS
              </label>
            </div>
          </section>
        )}

        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>
    </Modal>
  );
}

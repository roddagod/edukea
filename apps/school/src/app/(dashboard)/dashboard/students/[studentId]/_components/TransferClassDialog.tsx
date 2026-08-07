'use client';

import { useMemo, useState } from 'react';
import { useUpdateSsyl, useSchoolStructure } from '@edukea/shared';
import { Modal, Button, Select } from '@edukea/ui';
import { ArrowRight } from 'lucide-react';

interface Props {
  ssylId: string;
  schoolId: string;
  studentFullName: string;
  currentClassroomId: string;
  currentClassroomName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Dialog dedie au transfert d'un eleve vers une autre classe de la meme ecole.
 * Selection en 2 etapes :
 *   1. Niveau cible (depuis la structure)
 *   2. Classe cible (parmi les classes du niveau)
 * Empeche le transfert vers la classe actuelle.
 */
export function TransferClassDialog({
  ssylId,
  schoolId,
  studentFullName,
  currentClassroomId,
  currentClassroomName,
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const { data: structure } = useSchoolStructure(schoolId);
  const updateSsyl = useUpdateSsyl();
  const [targetLevelId, setTargetLevelId] = useState('');
  const [targetClassroomId, setTargetClassroomId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const allLevels = useMemo(
    () => (structure?.tree ?? []).flatMap((c) => c.levels.map((l) => ({ ...l, cycleName: c.name }))),
    [structure],
  );

  const levelOptions = useMemo(
    () =>
      allLevels
        .sort((a, b) => a.order_by - b.order_by)
        .map((l) => ({ value: l.id, label: `${l.cycleName} · ${l.name}` })),
    [allLevels],
  );

  const classroomsOfLevel = useMemo(
    () => allLevels.find((l) => l.id === targetLevelId)?.classrooms ?? [],
    [allLevels, targetLevelId],
  );

  const targetClassroomName = classroomsOfLevel.find((c) => c.id === targetClassroomId)?.name;

  const handleSubmit = async () => {
    setError(null);
    if (!targetClassroomId) { setError('Sélectionne une classe cible'); return; }
    if (targetClassroomId === currentClassroomId) { setError('Classe cible identique à la classe actuelle'); return; }
    try {
      await updateSsyl.mutateAsync({ id: ssylId, classroom_id: targetClassroomId });
      onSuccess?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Transférer vers une autre classe"
      description={studentFullName}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={updateSsyl.isPending}>Annuler</Button>
          <Button
            variant="accent"
            onClick={handleSubmit}
            disabled={updateSsyl.isPending || !targetClassroomId || targetClassroomId === currentClassroomId}
          >
            {updateSsyl.isPending ? 'Transfert…' : 'Confirmer le transfert'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Recap actuel -> cible */}
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex-1 text-center">
            <p className="text-xs text-slate-500">Classe actuelle</p>
            <p className="mt-1 font-semibold text-slate-900">{currentClassroomName}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400" />
          <div className="flex-1 text-center">
            <p className="text-xs text-slate-500">Classe cible</p>
            <p className={`mt-1 font-semibold ${targetClassroomName ? 'text-primary' : 'text-slate-400'}`}>
              {targetClassroomName ?? '—'}
            </p>
          </div>
        </div>

        {/* Etape 1 : niveau */}
        <div>
          <label className="mb-1 block text-body-xs font-semibold text-ink-2">1. Niveau cible</label>
          <Select
            options={levelOptions}
            placeholder="Choisir un niveau…"
            value={targetLevelId}
            onChange={(e) => {
              setTargetLevelId(e.target.value);
              setTargetClassroomId('');
            }}
          />
        </div>

        {/* Etape 2 : classe */}
        {targetLevelId && (
          <div>
            <label className="mb-1 block text-body-xs font-semibold text-ink-2">2. Classe cible</label>
            {classroomsOfLevel.length === 0 ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Aucune classe configurée pour ce niveau.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {classroomsOfLevel.map((c) => {
                  const isCurrent = c.id === currentClassroomId;
                  const isSelected = c.id === targetClassroomId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => !isCurrent && setTargetClassroomId(c.id)}
                      disabled={isCurrent}
                      className={`rounded-md border p-2 text-sm font-semibold transition-colors ${
                        isCurrent
                          ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                          : isSelected
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-line bg-white text-ink-2 hover:border-primary/40'
                      }`}
                      title={isCurrent ? 'Classe actuelle' : ''}
                    >
                      {c.name}
                      {isCurrent && <span className="ml-1 text-xs">(actuelle)</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
          <p className="font-semibold">Ce que fait le transfert :</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            <li>Change la classe de l&apos;élève dans son inscription courante</li>
            <li>Les paiements déjà enregistrés sont conservés</li>
            <li>Les frais de la nouvelle classe seront appliqués automatiquement</li>
          </ul>
        </div>

        {error && <div className="text-caption text-destructive">{error}</div>}
      </div>
    </Modal>
  );
}

'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  GraduationCap,
  Calendar,
  MapPin,
  User,
  Globe,
  CreditCard,
} from 'lucide-react';
import { useStudent, useStudentEnrollments } from '@/hooks/useStudents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@edukea/shared';

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const { data: student, isLoading } = useStudent(studentId);
  const { data: enrollments = [] } = useStudentEnrollments(studentId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <p className="text-center text-muted-foreground">Eleve non trouve</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/students')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
            <GraduationCap className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{student.lastname} {student.firstname}</h1>
            {student.matricule && <p className="text-sm text-muted-foreground">Matricule : {student.matricule}</p>}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={User} label="Sexe" value={student.sex === 'M' ? 'Masculin' : student.sex === 'F' ? 'Feminin' : student.sex || '-'} />
            <InfoRow
              icon={Calendar}
              label="Date de naissance"
              value={student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
            />
            <InfoRow icon={MapPin} label="Lieu de naissance" value={student.place_of_birth || '-'} />
            <InfoRow icon={Globe} label="Nationalite" value={student.nationality || '-'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Liens familiaux</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FamilyRow label="Pere" id={student.father_id} />
            <FamilyRow label="Mere" id={student.mother_id} />
            <FamilyRow label="Tuteur" id={student.tutor_id} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Aucune inscription trouvee</p>
          ) : (
            <div className="space-y-3">
              {enrollments.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Inscription #{e.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.registration_date ? new Date(e.registration_date).toLocaleDateString('fr-FR') : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(e.school_fees_paid)} / {formatCurrency(e.school_fees_total)}</p>
                    <Badge variant={e.paiement_status === '3' ? 'default' : e.paiement_status === '2' ? 'warning' : 'secondary'} className="mt-1">
                      {e.paiement_status === '3' ? 'Solde' : e.paiement_status === '2' ? 'En cours' : 'Initial'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function FamilyRow({ label, id }: { label: string; id: string | null }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{id ? `${id.slice(0, 12)}...` : 'Non renseigne'}</span>
    </div>
  );
}

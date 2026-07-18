'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, MoreHorizontal, Eye } from 'lucide-react';
import { useStudents, type StudentWithDetails } from '@/hooks/useStudents';
import { DataTable, type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function StudentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { data: students = [], isLoading } = useStudents(search);

  const columns: Column<StudentWithDetails>[] = [
    {
      key: 'name',
      header: 'Nom complet',
      render: (student) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
            <GraduationCap className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="font-medium">{student.lastname} {student.firstname}</p>
            {student.matricule && <p className="text-xs text-muted-foreground">{student.matricule}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'sex',
      header: 'Sexe',
      render: (student) => (
        <Badge variant="outline">{student.sex === 'M' ? 'Masculin' : student.sex === 'F' ? 'Feminin' : student.sex || '-'}</Badge>
      ),
    },
    {
      key: 'date_of_birth',
      header: 'Date de naissance',
      render: (student) => (
        <span className="text-sm text-muted-foreground">
          {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('fr-FR') : '-'}
        </span>
      ),
    },
    {
      key: 'place_of_birth',
      header: 'Lieu de naissance',
      render: (student) => (
        <span className="text-sm text-muted-foreground">{student.place_of_birth || '-'}</span>
      ),
    },
    {
      key: 'nationality',
      header: 'Nationalite',
      render: (student) => (
        <span className="text-sm text-muted-foreground">{student.nationality || '-'}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (student) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/students/${student.id}`); }}>
              <Eye className="mr-2 h-4 w-4" />
              Voir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Eleves</h1>
        <p className="text-muted-foreground">Liste de tous les eleves de la plateforme</p>
      </div>

      <DataTable
        columns={columns}
        data={students}
        isLoading={isLoading}
        searchPlaceholder="Rechercher par nom ou matricule..."
        onSearch={setSearch}
        searchValue={search}
        onRowClick={(student) => router.push(`/dashboard/students/${student.id}`)}
        emptyMessage="Aucun eleve trouve"
        getRowKey={(student) => student.id}
      />
    </div>
  );
}

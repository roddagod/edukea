'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { School, MoreHorizontal, Eye } from 'lucide-react';
import { useClassrooms, type ClassroomWithDetails } from '@/hooks/useClassrooms';
import { DataTable, type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ClassesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { data: classrooms = [], isLoading } = useClassrooms(search);

  const columns: Column<ClassroomWithDetails>[] = [
    {
      key: 'name',
      header: 'Classe',
      render: (classroom) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
            <School className="h-4 w-4 text-green-600" />
          </div>
          <p className="font-medium">{classroom.name}</p>
        </div>
      ),
    },
    {
      key: 'school_name',
      header: 'Etablissement',
      render: (classroom) => (
        <Badge variant="outline">{classroom.school_name || '-'}</Badge>
      ),
    },
    {
      key: 'level_name',
      header: 'Niveau',
      render: (classroom) => (
        <span className="text-sm text-muted-foreground">{classroom.level_name || '-'}</span>
      ),
    },
    {
      key: 'school_year_name',
      header: 'Annee scolaire',
      render: (classroom) => (
        <span className="text-sm text-muted-foreground">{classroom.school_year_name || '-'}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (classroom) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/classes/${classroom.id}`); }}>
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
        <h1 className="text-2xl font-bold">Classes</h1>
        <p className="text-muted-foreground">Liste de toutes les classes de la plateforme</p>
      </div>

      <DataTable
        columns={columns}
        data={classrooms}
        isLoading={isLoading}
        searchPlaceholder="Rechercher par nom, etablissement ou niveau..."
        onSearch={setSearch}
        searchValue={search}
        onRowClick={(classroom) => router.push(`/dashboard/classes/${classroom.id}`)}
        emptyMessage="Aucune classe trouvee"
        getRowKey={(classroom) => classroom.id}
      />
    </div>
  );
}

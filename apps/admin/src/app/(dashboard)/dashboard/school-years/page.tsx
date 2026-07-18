'use client';

import { useState } from 'react';
import { Calendar, Building2 } from 'lucide-react';
import { useSchoolYears, type SchoolYearWithDetails } from '@/hooks/useSchoolYears';
import { DataTable, type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';

export default function SchoolYearsPage() {
  const [search, setSearch] = useState('');
  const { data: schoolYears = [], isLoading } = useSchoolYears(search);

  const columns: Column<SchoolYearWithDetails>[] = [
    {
      key: 'name',
      header: 'Annee scolaire',
      render: (sy) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <p className="font-medium">{sy.name}</p>
        </div>
      ),
    },
    {
      key: 'school_name',
      header: 'Etablissement',
      render: (sy) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm">{sy.school_name || '-'}</span>
        </div>
      ),
    },
    {
      key: 'date_start',
      header: 'Debut',
      render: (sy) => (
        <span className="text-sm text-muted-foreground">
          {sy.date_start ? new Date(sy.date_start).toLocaleDateString('fr-FR') : '-'}
        </span>
      ),
    },
    {
      key: 'date_end',
      header: 'Fin',
      render: (sy) => (
        <span className="text-sm text-muted-foreground">
          {sy.date_end ? new Date(sy.date_end).toLocaleDateString('fr-FR') : '-'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (sy) => {
        const now = new Date();
        const start = sy.date_start ? new Date(sy.date_start) : null;
        const end = sy.date_end ? new Date(sy.date_end) : null;
        const isActive = start && end && now >= start && now <= end;
        const isPast = end && now > end;
        return (
          <Badge variant={isActive ? 'default' : isPast ? 'secondary' : 'outline'}>
            {isActive ? 'En cours' : isPast ? 'Terminee' : 'A venir'}
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Annees scolaires</h1>
        <p className="text-muted-foreground">Liste de toutes les annees scolaires par etablissement</p>
      </div>

      <DataTable
        columns={columns}
        data={schoolYears}
        isLoading={isLoading}
        searchPlaceholder="Rechercher par nom ou etablissement..."
        onSearch={setSearch}
        searchValue={search}
        emptyMessage="Aucune annee scolaire trouvee"
        getRowKey={(sy) => sy.id}
      />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Users, Phone, Mail } from 'lucide-react';
import { useFamilies, type FamilyWithDetails } from '@/hooks/useFamilies';
import { DataTable, type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';

export default function FamiliesPage() {
  const [search, setSearch] = useState('');
  const { data: families = [], isLoading } = useFamilies(search);

  const columns: Column<FamilyWithDetails>[] = [
    {
      key: 'name',
      header: 'Nom',
      render: (family) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
            <Users className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <p className="font-medium">{family.lastname} {family.firstname}</p>
            {family.code && <p className="text-xs text-muted-foreground">{family.code}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'type_name',
      header: 'Type',
      render: (family) => (
        <Badge variant="outline">{family.type_name || '-'}</Badge>
      ),
    },
    {
      key: 'school_name',
      header: 'Etablissement',
      render: (family) => (
        <Badge variant="outline">{family.school_name || '-'}</Badge>
      ),
    },
    {
      key: 'phone',
      header: 'Telephone',
      render: (family) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {family.phone ? <><Phone className="h-3 w-3" />{family.phone}</> : '-'}
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (family) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {family.email ? <><Mail className="h-3 w-3" />{family.email}</> : '-'}
        </div>
      ),
    },
    {
      key: 'job',
      header: 'Profession',
      render: (family) => (
        <span className="text-sm text-muted-foreground">{family.job || '-'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Familles</h1>
        <p className="text-muted-foreground">Liste de toutes les familles de la plateforme</p>
      </div>

      <DataTable
        columns={columns}
        data={families}
        isLoading={isLoading}
        searchPlaceholder="Rechercher par nom, telephone ou email..."
        onSearch={setSearch}
        searchValue={search}
        emptyMessage="Aucune famille trouvee"
        getRowKey={(family) => family.id}
      />
    </div>
  );
}

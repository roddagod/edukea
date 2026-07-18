'use client';

import { useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  title?: string;
  description?: string;
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  searchValue?: string;
  actions?: React.ReactNode;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  pageSize?: number;
  getRowKey: (item: T) => string;
}

export function DataTable<T>({
  title,
  description,
  columns,
  data,
  isLoading,
  searchPlaceholder = 'Rechercher...',
  onSearch,
  searchValue,
  actions,
  onRowClick,
  emptyMessage = 'Aucun resultat',
  pageSize = 10,
  getRowKey,
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(data.length / pageSize);
  const paginatedData = data.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <Card>
      {(title || actions || onSearch) && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            {title && <CardTitle className="text-base">{title}</CardTitle>}
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className="flex items-center gap-3">
            {onSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchValue ?? ''}
                  onChange={(e) => {
                    onSearch(e.target.value);
                    setPage(0);
                  }}
                  className="w-64 pl-9"
                />
              </div>
            )}
            {actions}
          </div>
        </CardHeader>
      )}
      <CardContent className={title || actions || onSearch ? 'pt-0' : ''}>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col.key} className={col.className}>{col.header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item) => (
                  <TableRow
                    key={getRowKey(item)}
                    className={onRowClick ? 'cursor-pointer' : ''}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((col) => (
                      <TableCell key={col.key} className={col.className}>
                        {col.render ? col.render(item) : (item as any)[col.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  {data.length} resultat{data.length > 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {page + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

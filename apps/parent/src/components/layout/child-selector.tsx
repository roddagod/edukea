'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { useChildren, type ChildWithClassroom } from '@edukea/shared';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ChildContextType {
  selectedChild: ChildWithClassroom | null;
  setSelectedChildId: (id: string) => void;
  children: ChildWithClassroom[];
  isLoading: boolean;
}

const ChildContext = createContext<ChildContextType>({
  selectedChild: null,
  setSelectedChildId: () => {},
  children: [],
  isLoading: true,
});

export function useSelectedChild() {
  return useContext(ChildContext);
}

export function ChildProvider({ children: childrenNode }: { children: React.ReactNode }) {
  const { data: childrenData = [], isLoading } = useChildren();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedChild = selectedId
    ? childrenData.find((c) => c.id === selectedId) || childrenData[0] || null
    : childrenData[0] || null;

  const setSelectedChildId = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  return (
    <ChildContext.Provider
      value={{
        selectedChild,
        setSelectedChildId,
        children: childrenData,
        isLoading,
      }}
    >
      {childrenNode}
    </ChildContext.Provider>
  );
}

export function ChildSelector() {
  const { selectedChild, setSelectedChildId, children, isLoading } = useSelectedChild();

  if (isLoading) {
    return <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />;
  }

  if (children.length === 0) {
    return <span className="text-sm text-muted-foreground">Aucun enfant</span>;
  }

  if (children.length === 1) {
    const child = children[0];
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {child.firstname} {child.lastname}
        </span>
        {child.current_classroom && (
          <span className="rounded-md bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">
            {child.current_classroom.name}
          </span>
        )}
      </div>
    );
  }

  return (
    <Select
      value={selectedChild?.id || ''}
      onValueChange={(value) => setSelectedChildId(value)}
    >
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Choisir un enfant" />
      </SelectTrigger>
      <SelectContent>
        {children.map((child) => (
          <SelectItem key={child.id} value={child.id}>
            {child.firstname} {child.lastname}
            {child.current_classroom ? ` - ${child.current_classroom.name}` : ''}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

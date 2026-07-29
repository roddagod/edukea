'use client';

import { useState } from 'react';
import type { StructureCycle } from '@edukea/shared';
import { ChevronRight, ChevronDown, Building2, Layers, DoorOpen } from 'lucide-react';
import type { SelectedNode } from './StructureLayout';

interface Props {
  structure: StructureCycle[];
  selected: SelectedNode;
  onSelect: (node: SelectedNode) => void;
}

export function StructureTree({ structure, selected, onSelect }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) => {
    const s = new Set(expanded);
    if (s.has(id)) s.delete(id); else s.add(id);
    setExpanded(s);
  };

  const nodeClass = (kind: string, id: string) => {
    const isSelected = selected?.type === kind && selected.id === id;
    return `flex items-center gap-2 rounded px-2 py-1 text-sm cursor-pointer ${
      isSelected ? 'bg-orange-100 text-orange-900 font-medium' : 'hover:bg-slate-50'
    }`;
  };

  return (
    <div className="space-y-1">
      {structure.map((cycle) => {
        const cycleExp = expanded.has(cycle.id);
        return (
          <div key={cycle.id}>
            <div className={nodeClass('cycle', cycle.id)} onClick={() => onSelect({ type: 'cycle', id: cycle.id })}>
              <button type="button" onClick={(e) => { e.stopPropagation(); toggle(cycle.id); }}>
                {cycleExp ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
              <Building2 className="h-4 w-4 text-slate-500" />
              <span>{cycle.name}</span>
            </div>
            {cycleExp && cycle.levels.map((level) => {
              const levelExp = expanded.has(level.id);
              return (
                <div key={level.id} className="ml-6">
                  <div className={nodeClass('level', level.id)} onClick={() => onSelect({ type: 'level', id: level.id })}>
                    <button type="button" onClick={(e) => { e.stopPropagation(); toggle(level.id); }}>
                      {levelExp ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </button>
                    <Layers className="h-4 w-4 text-slate-500" />
                    <span>{level.name}</span>
                  </div>
                  {levelExp && level.classrooms.map((cr) => (
                    <div
                      key={cr.id}
                      className={`${nodeClass('classroom', cr.id)} ml-6`}
                      onClick={() => onSelect({ type: 'classroom', id: cr.id })}
                    >
                      <span className="w-3" />
                      <DoorOpen className="h-4 w-4 text-slate-500" />
                      <span>{cr.name}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

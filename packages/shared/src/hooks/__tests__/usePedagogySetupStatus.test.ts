import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePedagogySetupStatus } from '../usePedagogySetupStatus';

// ---------------------------------------------------------------------------
// Mock supabase — use vi.hoisted so variables are available before vi.mock hoists
// ---------------------------------------------------------------------------
const { mockFrom, mockSelect, mockEq, mockMaybeSingle } = vi.hoisted(() => {
  const mockMaybeSingle = vi.fn();
  const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));
  return { mockFrom, mockSelect, mockEq, mockMaybeSingle };
});

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

const MOCK_ROW = {
  school_id: 'school-abc',
  school_year_id: 'year-xyz',
  school_year_name: '2025-2026',
  periode_type: 'trimestre' as const,
  step_year_done: true,
  step_grading_done: true,
  step_bulletin_customized: false,
  student_types_count: 3,
  levels_count: 0,
  classrooms_count: 0,
  periodes_count: 3,
  subjects_count: 0,
  fee_lines_count: 0,
  teachers_count: 0,
  classroom_subjects_with_teacher_count: 0,
  classrooms_with_principal_count: 0,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('usePedagogySetupStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null data when schoolId is undefined', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => usePedagogySetupStatus(undefined), { wrapper });

    // When disabled, query stays in pending/idle — data is undefined, not null
    expect(result.current.data).toBeUndefined();
    expect(result.current.steps).toBeUndefined();
    // The query should not be fetching (disabled)
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches v_pedagogy_setup_status and returns the row', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: MOCK_ROW, error: null });

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePedagogySetupStatus('school-abc'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('v_pedagogy_setup_status');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('school_id', 'school-abc');
    expect(result.current.data).toEqual(MOCK_ROW);
  });

  it('computes step statuses correctly from mock row', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: MOCK_ROW, error: null });

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePedagogySetupStatus('school-abc'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const steps = result.current.steps!;
    expect(steps).toBeDefined();

    // step_year_done=true → 'done'
    expect(steps.year.status).toBe('done');

    // step_grading_done=true → 'done'
    expect(steps.grading.status).toBe('done');

    // step_bulletin_customized=false → 'optional'
    expect(steps.bulletin_customization.status).toBe('optional');

    // student_types_count=3 → 'done'
    expect(steps.student_types.status).toBe('done');

    // levels_count=0 or classrooms_count=0 → structureDone=false → 'todo'
    expect(steps.structure.status).toBe('todo');

    // step_year_done=true, periodes_count=3, periode_type='trimestre' → 3 >= 3 → 'done'
    expect(steps.periods.status).toBe('done');

    // structureDone=false → 'locked'
    expect(steps.subjects.status).toBe('locked');

    // !(typesDone && structureDone) = !(true && false) = true → 'locked'
    expect(steps.fees.status).toBe('locked');

    // !(structureDone && subjectsDone) = !(false && false) = true → 'locked'
    expect(steps.teachers_assignments.status).toBe('locked');
  });
});

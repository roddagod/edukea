export interface EnrollmentFormState {
  student: {
    firstname: string;
    lastname: string;
    sex: 'M' | 'F' | '';
    birthdate: string;
    birthplace: string;
    nationality: string;
    redoublant: boolean;
  };
  father?: { id?: string; firstname: string; lastname: string; phone: string; email: string; job: string; address: string; residence: string };
  mother?: { id?: string; firstname: string; lastname: string; phone: string; email: string; job: string; address: string; residence: string };
  tutor?:  { id?: string; firstname: string; lastname: string; phone: string; email: string; job: string; address: string; residence: string };
  classroomId: string;
  /** Optionnel : selection intermediaire du niveau (persiste entre passages sur StepClassroom) */
  levelId?: string;
  feesId: string;
  typeStudentId?: string;
  billedTotal: number;
  discount?: { amount: number; reason: string; note: string };
  firstPaymentEnabled: boolean;
  firstPayment: { amount: number; source: 'cash' | 'bank_transfer' | 'internal'; memo: string };
}

export const DEFAULT_ENROLLMENT_STATE: EnrollmentFormState = {
  student: { firstname: '', lastname: '', sex: '', birthdate: '', birthplace: '', nationality: 'Ivoirienne', redoublant: false },
  father: undefined,
  mother: undefined,
  tutor: undefined,
  classroomId: '',
  feesId: '',
  billedTotal: 0,
  firstPaymentEnabled: true,
  firstPayment: { amount: 0, source: 'cash', memo: '' },
};

export function isStepStudentValid(s: EnrollmentFormState['student'], typeStudentId: string | undefined): boolean {
  return !!s.firstname.trim() && !!s.lastname.trim() && !!s.sex && !!s.birthdate && !!typeStudentId;
}

export function isStepFamilyValid(state: EnrollmentFormState): boolean {
  const hasFather = !!state.father?.phone?.trim();
  const hasMother = !!state.mother?.phone?.trim();
  const hasTutor  = !!state.tutor?.phone?.trim();
  return hasFather || hasMother || hasTutor;
}

export function isStepClassroomValid(state: EnrollmentFormState): boolean {
  return !!state.classroomId;
}

export function isStepFeesValid(state: EnrollmentFormState): boolean {
  if (!state.firstPaymentEnabled) return true;
  return state.firstPayment.amount > 0;
}

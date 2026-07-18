import type { Tables } from './database.types';

export interface ParentProfile extends Tables<'parent_profiles'> {
  // Related family members (father, mother, tutor)
  father?: Tables<'families'> | null;
  mother?: Tables<'families'> | null;
  tutor?: Tables<'families'> | null;
}

export interface AuthState {
  user: { id: string; email: string } | null;
  profile: ParentProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  fullName: string;
}

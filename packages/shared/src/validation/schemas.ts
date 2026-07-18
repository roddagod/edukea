import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caracteres'),
});

export const signUpSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caracteres'),
  fullName: z.string().min(2, 'Le nom doit contenir au moins 2 caracteres'),
});

export const messageSchema = z.object({
  content: z.string().min(1, 'Le message ne peut pas etre vide').max(5000),
  fileUrl: z.string().url().optional(),
  fileName: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type MessageInput = z.infer<typeof messageSchema>;

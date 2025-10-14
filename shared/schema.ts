/** Minimal schema stub to satisfy server imports during bring-up */
export interface Consultation {
  id: number;
  name: string;
  email: string;
  phone: string;
  preferred_clinic?: string | null;
  issue_category?: string | null;
  createdAt?: Date | null;
  [key: string]: any;
}
export type InsertConsultation = Partial<Consultation>;

// Placeholder export so `import { consultations } from "@shared/schema"` compiles
export const consultations: any = {};

// Minimal parser stub used by routes: just returns the input as-is.
export const insertConsultationSchema = {
  parse(input: any): InsertConsultation {
    return input as InsertConsultation;
  },
};

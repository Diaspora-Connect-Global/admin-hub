/**
 * Opportunity and Application types aligned with the Opportunities GraphQL API.
 * @see docs/GRAPHQL-API.md § Opportunity Service
 */

export type OpportunityType =
  | "job"
  | "volunteer"
  | "training"
  | "funding"
  | "scholarship"
  | "EMPLOYMENT"
  | "SCHOLARSHIP"
  | "INVESTMENT"
  | "FELLOWSHIP"
  | "INITIATIVE"
  | "GRANT"
  | "PROGRAM"
  | "VOLUNTEER"
  | "CONTRACT";

export type ApplicantStatus =
  | "pending"
  | "reviewing"
  | "shortlisted"
  | "accepted"
  | "rejected"
  | "withdrawn"
  | "PENDING"
  | "REVIEWING"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

export interface Opportunity {
  id: string;
  title: string;
  shortDescription?: string;
  type: OpportunityType;
  category?: string;
  status: string;
  visibility?: string;
  location?: string | null;
  deadline?: string | null;
  /** From API: applicationCount. UI may alias as applicantsCount. */
  applicationCount?: number;
  applicantsCount?: number;
  shortlistCount?: number;
  hireCount?: number;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  [key: string]: unknown;
}

export interface Applicant {
  id: string;
  opportunityId: string;
  name?: string;
  email?: string;
  phone?: string;
  status: ApplicantStatus;
  appliedAt?: string;
  screeningScore?: number;
  cvUrl?: string;
  [key: string]: unknown;
}

export interface FormField {
  key: string;
  label: string;
  required?: boolean;
  type?: string;
}

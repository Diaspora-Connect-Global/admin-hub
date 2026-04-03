/**
 * Opportunity Service — Frontend Integration Types
 * Source of truth: API Gateway resolver at services/api-gateway/src/opportunity/opportunity.resolver.ts
 * @see docs/GRAPHQL-API.md § Opportunity Service
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum OpportunityType {
  EMPLOYMENT  = 'EMPLOYMENT',
  SCHOLARSHIP = 'SCHOLARSHIP',
  INVESTMENT  = 'INVESTMENT',
  FELLOWSHIP  = 'FELLOWSHIP',
  INITIATIVE  = 'INITIATIVE',
  GRANT       = 'GRANT',
  PROGRAM     = 'PROGRAM',
  VOLUNTEER   = 'VOLUNTEER',
  CONTRACT    = 'CONTRACT',
}

export enum OpportunityCategory {
  EMPLOYMENT_CAREER              = 'EMPLOYMENT_CAREER',
  EDUCATION_TRAINING             = 'EDUCATION_TRAINING',
  FUNDING_GRANTS                 = 'FUNDING_GRANTS',
  FELLOWSHIPS_LEADERSHIP         = 'FELLOWSHIPS_LEADERSHIP',
  BUSINESS_INVESTMENT            = 'BUSINESS_INVESTMENT',
  VOLUNTEERING_SOCIAL_IMPACT     = 'VOLUNTEERING_SOCIAL_IMPACT',
  EVENT_CREATIVE_INDUSTRY        = 'EVENT_CREATIVE_INDUSTRY',
  AGRICULTURE_SUSTAINABILITY     = 'AGRICULTURE_SUSTAINABILITY',
  REAL_ESTATE_INFRASTRUCTURE     = 'REAL_ESTATE_INFRASTRUCTURE',
  GOVERNMENT_EMBASSY_INITIATIVES = 'GOVERNMENT_EMBASSY_INITIATIVES',
  INNOVATION_RESEARCH            = 'INNOVATION_RESEARCH',
  FINANCE_ECONOMICS              = 'FINANCE_ECONOMICS',
  RETURN_REINTEGRATION           = 'RETURN_REINTEGRATION',
}

export enum DeliveryMode {
  REMOTE = 'REMOTE',
  IN_PERSON = 'IN_PERSON',
  HYBRID = 'HYBRID',
  ONLINE = 'ONLINE',
}

export enum CommitmentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  ONE_TIME = 'ONE_TIME',
  FLEXIBLE = 'FLEXIBLE',
  PROJECT_BASED = 'PROJECT_BASED',
  ONGOING = 'ONGOING',
}

export enum CompensationType {
  SALARY = 'SALARY',
  GRANT = 'GRANT',
  STIPEND = 'STIPEND',
  INVESTMENT = 'INVESTMENT',
  PRIZE = 'PRIZE',
  EQUITY = 'EQUITY',
  HONORARIUM = 'HONORARIUM',
  NONE = 'NONE',
}

export enum Visibility {
  PUBLIC           = 'PUBLIC',
  COMMUNITY_ONLY   = 'COMMUNITY_ONLY',
  ASSOCIATION_ONLY = 'ASSOCIATION_ONLY',
}

export enum ApplicationMethod {
  EXTERNAL_LINK    = 'EXTERNAL_LINK',
  IN_PLATFORM_FORM = 'IN_PLATFORM_FORM',
  EMAIL_REQUEST    = 'EMAIL_REQUEST',
}

export enum OpportunityStatus {
  DRAFT     = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CLOSED    = 'CLOSED',
  ARCHIVED  = 'ARCHIVED',
}

export type OpportunityStatusFilter = OpportunityStatus | 'ALL';

export enum OwnerType {
  USER        = 'USER',
  COMMUNITY   = 'COMMUNITY',
  ASSOCIATION = 'ASSOCIATION',
}

export enum PriorityLevel {
  HIGH   = 'HIGH',
  NORMAL = 'NORMAL',
  LOW    = 'LOW',
}

export enum ApplicationStatus {
  PENDING   = 'PENDING',
  REVIEWING = 'REVIEWING',
  ACCEPTED  = 'ACCEPTED',
  REJECTED  = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

// ─── Object Types ─────────────────────────────────────────────────────────────

export interface OpportunityOwner {
  id: string;
  name: string;
  avatarUrl?: string | null;
  type: string;     // 'USER' | 'COMMUNITY' | 'ASSOCIATION'
}

export interface Opportunity {
  id: string;
  ownerType: OwnerType;
  ownerId: string;
  owner?: OpportunityOwner | null;        // Resolved dynamically; falls back to { id, name: ownerId, type }
  type: OpportunityType;
  category: OpportunityCategory;
  subCategory?: string | null;
  title: string;
  description: string;
  scope?: string | null;
  eligibilityCriteria?: string | null;
  deliveryMode?: DeliveryMode | null;
  commitmentType?: CommitmentType | null;
  location?: string | null;
  visibility: Visibility;
  applicationMethod?: ApplicationMethod | null;  // Nullable from backend, defaults to IN_PLATFORM_FORM
  externalLink?: string | null;
  applicationEmail?: string | null;
  formFields?: FormField[] | null;
  status: OpportunityStatus;
  priorityLevel: PriorityLevel;
  compensationMin?: number | null;
  compensationMax?: number | null;
  compensationCurrency?: string | null;
  compensationType?: CompensationType | null;
  duration?: string | null;
  eligibilityRegions?: string[] | null;
  benefitsSummary?: string | null;
  deadline?: string | null;
  skills?: string[] | null;
  tags?: string[] | null;
  applicationCount?: number | null;
  isSavedByCurrentUser?: boolean | null;
  hasCurrentUserApplied?: boolean | null;
  currentUserApplicationId?: string | null;
  // UI-derived optional fields
  applicantsCount?: number;
  shortlistCount?: number;
  hireCount?: number;
  shortDescription?: string;
  formType?: string;
  requireCv?: boolean;
  reviewWorkflow?: string;
  reviewers?: string[];
  maxApplicants?: number | null;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  closedAt?: string | null;
}

export interface FileRef {
  path: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface Application {
  id: string;
  opportunityId: string;
  applicantId: string;
  status: ApplicationStatus;
  resumeFileRef?: FileRef | null;
  coverLetter?: string | null;
  customAnswers?: string | null;
  reviewNotes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  opportunity?: Opportunity | null;
}

export interface SavedOpportunity {
  id: string;
  opportunityId: string;
  userId: string;
  savedAt: string;
  opportunity?: Opportunity | null;
}

// ─── Response Types ────────────────────────────────────────────────────────────

export interface OpportunityListResponse {
  opportunities: Opportunity[];
  total: number;
}

export interface ApplicationListResponse {
  applications: Application[];
  total: number;
}

export interface SavedOpportunityListResponse {
  savedOpportunities: SavedOpportunity[];
  total: number;
}

// ─── Input Types ───────────────────────────────────────────────────────────────

// NOTE: Ownership rules per backend contract:
// - Any verified user can create for themselves (ownerType: USER, ownerId = their ID)
// - Community admins can create for their community (ownerType: COMMUNITY, ownerId = community ID)
// - Association admins can create for their association (ownerType: ASSOCIATION, ownerId = association ID)
// - Super admins can create for anyone
// 
// Conditional field rules:
// - applicationEmail is REQUIRED when applicationMethod is EMAIL_REQUEST
// - externalLink is REQUIRED when applicationMethod is EXTERNAL_LINK
// 
// Optional fields: subCategory, skills, tags, scope, eligibilityCriteria, deliveryMode,
// commitmentType, location, compensationMin, compensationMax, compensationCurrency,
// compensationType, duration, eligibilityRegions, benefitsSummary, deadline
export interface CreateOpportunityInput {
  ownerType: OwnerType;  // USER | COMMUNITY | ASSOCIATION
  ownerId: string;       // Must match user's ID or owned entity (community/association)
  type: OpportunityType;
  category: OpportunityCategory;
  title: string;
  description: string;
  scope?: string;
  eligibilityCriteria?: string;
  deliveryMode?: DeliveryMode;
  commitmentType?: CommitmentType;
  compensationMin?: number;
  compensationMax?: number;
  compensationCurrency?: string;    // ISO currency code e.g. "GHS"
  compensationType?: CompensationType;
  duration?: string;
  eligibilityRegions?: string[];
  benefitsSummary?: string;
  deadline?: string;          // ISO 8601 date string
  subCategory?: string;
  skills?: string[];
  tags?: string[];
  visibility: Visibility;
  applicationMethod?: ApplicationMethod;  // Optional, defaults to IN_PLATFORM_FORM
  applicationEmail?: string;  // REQUIRED if applicationMethod is EMAIL_REQUEST
  externalLink?: string;      // REQUIRED if applicationMethod is EXTERNAL_LINK
  formFields?: FormField[];   // Replaces all form fields; omit to use defaults
  location?: string;
}

export interface UpdateOpportunityInput {
  title?: string;
  description?: string;
  scope?: string;
  eligibilityCriteria?: string;
  deliveryMode?: DeliveryMode;
  commitmentType?: CommitmentType;
  location?: string;
  compensationMin?: number;
  compensationMax?: number;
  compensationCurrency?: string;
  compensationType?: CompensationType;
  duration?: string;
  eligibilityRegions?: string[];
  benefitsSummary?: string;
  deadline?: string;
  subCategory?: string;
  skills?: string[];
  tags?: string[];
  // Application method — only send fields you intend to change.
  // Backend ignores empty strings; stale email/link is auto-cleared on method change.
  applicationMethod?: ApplicationMethod;
  applicationEmail?: string;  // Required when applicationMethod is EMAIL_REQUEST
  externalLink?: string;      // Required when applicationMethod is EXTERNAL_LINK
  formFields?: FormField[];   // Replaces all form fields when provided
}

export interface ListOpportunitiesInput {
  limit?: number;        // default: 20
  offset?: number;       // default: 0
  type?: OpportunityType;
  category?: OpportunityCategory;
  subCategory?: string;
  searchTerm?: string;
  ownerType?: OwnerType;
  ownerId?: string;
  status?: OpportunityStatusFilter;
  deliveryMode?: DeliveryMode;
  commitmentType?: CommitmentType;
  location?: string;
  sortBy?: string;       // 'CREATED_AT' | 'DEADLINE' | 'SALARY' | 'RELEVANCE'
  sortOrder?: string;    // 'ASC' | 'DESC'
}

export interface GetOpportunityFeedInput {
  limit?: number;
  offset?: number;
  category?: string;
  type?: string;
}

export interface ApplicationDataInput {
  fullName: string;
  email: string;
  phoneNumber?: string;
  linkedInProfile?: string;
  portfolioUrl?: string;
  coverLetter?: string;
  customAnswers?: string;
}

export interface FileReferenceInput {
  path: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface SubmitApplicationInput {
  opportunityId: string;
  applicationData: ApplicationDataInput;
  resumeFileRef?: FileReferenceInput;
}

export interface GetApplicationsInput {
  opportunityId: string;
  limit?: number;
  offset?: number;
  status?: ApplicationStatus;
}

// Legacy types for backward compatibility
export type ApplicantStatus = ApplicationStatus;
export interface Applicant extends Application {
  name?: string;
  email?: string;
  phone?: string;
  appliedAt?: string;
  screeningScore?: number;
  cvUrl?: string;
}

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'textarea' | 'file_upload';
  required: boolean;
}

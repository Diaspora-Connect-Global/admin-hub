/**
 * Opportunity taxonomy — single source of truth for Category and Sub-category
 * options exposed in the admin portal.
 *
 * IMPORTANT: These values MUST stay in sync with the public site
 * (diasporaconnect), specifically:
 *   - Category slugs ↔ src/app/[locale]/(public)/opportunities/[id]/OpportunityDetailClient.tsx (CATEGORY_SLUG_TO_API)
 *   - Sub-category `value`s ↔ src/app/[locale]/(public)/opportunities/[id]/data.tsx (tab `filter` slugs)
 *
 * The public category pages filter opportunities client-side by normalizing the
 * sub-tab `filter` slug and matching it against the item's `subCategory`. Storing
 * the slug here (not a pretty label) is what makes those sub-tabs resolve to
 * real content. Do not change a `value` without changing the matching public slug.
 */
import { OpportunityType, OpportunityCategory } from "@/types/opportunities";

export interface CategoryOption {
  value: OpportunityCategory;
  label: string;
  /** Public route slug, e.g. /opportunities/employment-career */
  slug: string;
}

/** All 13 categories the public Explore page exposes, in display order. */
export const OPPORTUNITY_CATEGORIES: CategoryOption[] = [
  { value: OpportunityCategory.EMPLOYMENT_CAREER,              label: "Employment & Career",            slug: "employment-career" },
  { value: OpportunityCategory.EDUCATION_TRAINING,             label: "Education & Training",           slug: "education-training" },
  { value: OpportunityCategory.FUNDING_GRANTS,                 label: "Funding & Grants",               slug: "funding-grants" },
  { value: OpportunityCategory.FELLOWSHIPS_LEADERSHIP,         label: "Fellowships & Leadership",       slug: "fellowships-leadership" },
  { value: OpportunityCategory.BUSINESS_INVESTMENT,            label: "Business & Investment",          slug: "business-investment" },
  { value: OpportunityCategory.VOLUNTEERING_SOCIAL_IMPACT,     label: "Volunteering & Social Impact",   slug: "volunteering-social-impact" },
  { value: OpportunityCategory.EVENT_CREATIVE_INDUSTRY,        label: "Event & Creative Industry",      slug: "event-creative-industry" },
  { value: OpportunityCategory.AGRICULTURE_SUSTAINABILITY,     label: "Agriculture & Sustainability",   slug: "agriculture-sustainability" },
  { value: OpportunityCategory.REAL_ESTATE_INFRASTRUCTURE,     label: "Real Estate & Infrastructure",   slug: "real-estate-infrastructure" },
  { value: OpportunityCategory.GOVERNMENT_EMBASSY_INITIATIVES, label: "Gov't & Embassy Initiatives",    slug: "government-embassy-initiatives" },
  { value: OpportunityCategory.INNOVATION_RESEARCH,            label: "Innovation & Research",          slug: "innovation-research" },
  { value: OpportunityCategory.FINANCE_ECONOMICS,             label: "Finance & Economics",            slug: "finance-economics" },
  { value: OpportunityCategory.RETURN_REINTEGRATION,          label: "Return & Reintegration",         slug: "return-reintegration" },
];

export interface SubCategoryOption {
  /** Matches the public sub-tab `filter` slug exactly (see file header). */
  value: string;
  label: string;
}

/**
 * Sub-categories per category. Only categories that expose sub-tabs on the
 * public site have entries; the rest intentionally have none (the public page
 * only renders an "All" tab for them).
 */
export const SUBCATEGORIES_BY_CATEGORY: Partial<Record<OpportunityCategory, SubCategoryOption[]>> = {
  [OpportunityCategory.EMPLOYMENT_CAREER]: [
    { value: "internships",               label: "Internships" },
    { value: "vocational-training",       label: "Apprenticeships / Vocational Training" },
    { value: "graduate-trainee-programs", label: "Graduate Trainee Programs" },
    { value: "career-fairs",              label: "Career Fairs" },
  ],
  [OpportunityCategory.EDUCATION_TRAINING]: [
    { value: "online-courses",        label: "Online Courses" },
    { value: "certification-programs", label: "Certification Programs" },
    { value: "workshops-seminars",    label: "Workshops & Seminars" },
    { value: "skill-development",     label: "Skill Development" },
    { value: "professional-training", label: "Professional Training" },
  ],
};

export const getSubCategoryOptions = (category: OpportunityCategory): SubCategoryOption[] =>
  SUBCATEGORIES_BY_CATEGORY[category] ?? [];

/**
 * Convenience default category for a given type — used to pre-fill the Category
 * field when an admin picks a type. The admin can still override it.
 */
export const defaultCategoryForType: Record<OpportunityType, OpportunityCategory> = {
  [OpportunityType.EMPLOYMENT]:  OpportunityCategory.EMPLOYMENT_CAREER,
  [OpportunityType.CONTRACT]:    OpportunityCategory.EMPLOYMENT_CAREER,
  [OpportunityType.SCHOLARSHIP]: OpportunityCategory.EDUCATION_TRAINING,
  [OpportunityType.PROGRAM]:     OpportunityCategory.EDUCATION_TRAINING,
  [OpportunityType.INVESTMENT]:  OpportunityCategory.BUSINESS_INVESTMENT,
  [OpportunityType.FELLOWSHIP]:  OpportunityCategory.FELLOWSHIPS_LEADERSHIP,
  [OpportunityType.INITIATIVE]:  OpportunityCategory.GOVERNMENT_EMBASSY_INITIATIVES,
  [OpportunityType.GRANT]:       OpportunityCategory.FUNDING_GRANTS,
  [OpportunityType.VOLUNTEER]:   OpportunityCategory.VOLUNTEERING_SOCIAL_IMPACT,
};

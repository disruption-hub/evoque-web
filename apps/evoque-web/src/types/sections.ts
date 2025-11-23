/**
 * Type definitions for section components
 */

export interface ResponsiveBackgroundImage {
  mobile?: string;
  desktop?: string;
}

export interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  description?: string;
  backgroundImage?: ResponsiveBackgroundImage | string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
}

export interface AboutSectionProps {
  title?: string;
  description?: string;
  content?: string;
  image?: string;
  imageAlt?: string;
  backgroundImage?: ResponsiveBackgroundImage | string;
}

export interface CapabilityItem {
  title: string;
  description: string;
  icon?: string;
}

export interface CapabilitiesGridProps {
  title?: string;
  items: CapabilityItem[];
}

export interface Solution {
  category: string;
  items: string[];
}

export interface SolutionsListProps {
  title?: string;
  description?: string;
  solutions?: Solution[];
  image?: string;
  images?: string[];
  imageAlt?: string;
  content?: string;
}

export interface HumanResourcesItem {
  text: string;
  icon?: string;
}

export interface HumanResourcesSectionProps {
  title: string;
  description: string;
  items: HumanResourcesItem[] | string[];
}

export interface WhyPeruSectionProps {
  title: string;
  points?: string[];
  content?: string;
  image?: string;
  imageAlt?: string;
}

export interface Feature {
  title: string;
  description?: string;
  image?: string;
}

export interface OpportunitiesFeaturesProps {
  title?: string;
  features: Feature[];
}

export interface TrainingSectionProps {
  title: string;
  bullets?: string[];
  content?: string;
  image?: string;
  imageAlt?: string;
}

export interface ComparisonData {
  location: string;
  cost: string;
}

export interface CompetitiveAdvantageSectionProps {
  title: string;
  paragraph?: string;
  content?: string;
  showComparison?: boolean;
  comparisonData?: ComparisonData[];
  backgroundImage?: ResponsiveBackgroundImage | string;
}

export interface ContactSectionProps {
  title?: string;
  description?: string;
  address?: string;
  addressDescription?: string;
  email?: string;
  website?: string;
  mapEmbed?: string;
  ctaText?: string;
  ctaLink?: string;
  ctaDescription?: string;
}

export interface LocationSectionProps {
  title?: string;
  location?: string;
  facilityTitle?: string;
  facilityDescription?: string;
  image?: string;
  imageAlt?: string;
}

export interface MissionSectionProps {
  title?: string;
  description?: string;
  backgroundImage?: ResponsiveBackgroundImage | string;
  content?: string;
}

export interface VisionSectionProps {
  title?: string;
  description?: string;
  backgroundImage?: ResponsiveBackgroundImage | string;
  content?: string;
}

export interface ValueItem {
  title: string;
  description: string;
  icon?: string;
}

export interface ValuesSectionProps {
  title?: string;
  values: ValueItem[];
  backgroundImage?: ResponsiveBackgroundImage | string;
  content?: string;
}

export interface NavLink {
  label: string;
  url: string;
  isExternal?: boolean;
}

export interface NavigationHeaderProps {
  logo?: string;
  logoAlt?: string;
  links: NavLink[];
}

export interface SocialLink {
  platform: string;
  url: string;
  icon?: string;
}

export interface BrandFooterProps {
  copyright?: string;
  socialLinks?: SocialLink[];
  links?: NavLink[];
}

export interface ServiceItem {
  icon?: string;
  title: string;
  description: string;
  href?: string;
}

export interface ServicesSectionProps {
  title?: string;
  description?: string;
  services: ServiceItem[];
}

export interface FormSectionProps {
  title?: string;
  description?: string;
  formType?: 'signin' | 'joinus';
  layout?: 'vertical' | 'horizontal';
  heroTitle?: string;
  heroDescription?: string;
  formPosition?: 'left' | 'right';
}

export interface BeyondStandardsSectionProps {
  title?: string;
  description?: string;
  items: string[];
  backgroundImage?: ResponsiveBackgroundImage | string;
}

export interface WeKnowOurPeopleSectionProps {
  title?: string;
  backgroundImage?: ResponsiveBackgroundImage | string;
  content?: string;
}


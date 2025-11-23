import React from 'react';
import Image from 'next/image';
import { Section } from '@/types';
import { getBrandColor } from '@/config/brand-colors';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { 
  HeroSectionProps, 
  AboutSectionProps,
  ContactSectionProps, 
  SolutionsListProps,
  ServicesSectionProps,
  LocationSectionProps,
  MissionSectionProps,
  VisionSectionProps,
  ValuesSectionProps,
  HumanResourcesSectionProps,
  WhyPeruSectionProps,
  OpportunitiesFeaturesProps,
  TrainingSectionProps,
  CompetitiveAdvantageSectionProps,
  FormSectionProps,
  BeyondStandardsSectionProps,
  WeKnowOurPeopleSectionProps,
  ResponsiveBackgroundImage
} from '@/types/sections';
import Hero from '@/components/sections/Hero';
import About from '@/components/sections/About';
import Contact from '@/components/sections/Contact';
import Solutions from '@/components/sections/Solutions';
import Services from '@/components/sections/Services';
import Location from '@/components/sections/Location';
import Mission from '@/components/sections/Mission';
import Vision from '@/components/sections/Vision';
import Values from '@/components/sections/Values';
import HumanResources from '@/components/sections/HumanResources';
import WhyPeru from '@/components/sections/WhyPeru';
import Opportunities from '@/components/sections/Opportunities';
import Training from '@/components/sections/Training';
import CompetitiveAdvantage from '@/components/sections/CompetitiveAdvantage';
import Form from '@/components/sections/Form';
import BeyondStandards from '@/components/sections/BeyondStandards';
import WeKnowOurPeople from '@/components/sections/WeKnowOurPeople';
import SpacerSection from '@/components/sections/SpacerSection';

interface SectionComponentRendererProps {
  section: Section;
}

/**
 * Convert backgroundImage from string or object to ResponsiveBackgroundImage format
 */
function normalizeBackgroundImage(
  backgroundImage: string | ResponsiveBackgroundImage | undefined
): ResponsiveBackgroundImage | undefined {
  if (!backgroundImage) return undefined;
  
  // If it's already a ResponsiveBackgroundImage object, return it
  if (typeof backgroundImage === 'object' && ('mobile' in backgroundImage || 'desktop' in backgroundImage)) {
    return backgroundImage;
  }
  
  // If it's a string, convert to ResponsiveBackgroundImage with desktop property
  if (typeof backgroundImage === 'string') {
    return { desktop: backgroundImage };
  }
  
  return undefined;
}

export default async function SectionComponentRenderer({ section }: SectionComponentRendererProps) {
  if (!section || !section.isActive || !section.type) {
    return null;
  }

  const sectionData = section.sectionData || {};
  const image = sectionData.image as string | undefined;
  const imageAlt = (sectionData.imageAlt as string) || 'Section image';

  // Handle HERO type sections specially
  if (section.type === 'HERO') {
    // Start with JSON props
    const heroProps: HeroSectionProps = {
      title: sectionData.title as string | undefined,
      subtitle: sectionData.subtitle as string | undefined,
      description: sectionData.description as string | undefined,
      backgroundImage: normalizeBackgroundImage(sectionData.backgroundImage as string | ResponsiveBackgroundImage | undefined),
      ctaText: sectionData.ctaText as string | undefined,
      ctaLink: sectionData.ctaLink as string | undefined,
      secondaryCtaText: sectionData.secondaryCtaText as string | undefined,
      secondaryCtaLink: sectionData.secondaryCtaLink as string | undefined,
    };


    return <Hero {...heroProps} />;
  }

  // Handle CONTACT type sections specially
  if (section.type === 'CONTACT') {
    // Start with JSON props
    const contactProps: ContactSectionProps = {
      title: sectionData.title as string | undefined,
      description: sectionData.description as string | undefined,
      address: sectionData.address as string | undefined,
      addressDescription: sectionData.addressDescription as string | undefined,
      email: sectionData.email as string | undefined,
      website: sectionData.website as string | undefined,
      mapEmbed: sectionData.mapEmbed as string | undefined,
      ctaText: sectionData.ctaText as string | undefined,
      ctaLink: sectionData.ctaLink as string | undefined,
      ctaDescription: sectionData.ctaDescription as string | undefined,
    };


    return <Contact {...contactProps} />;
  }

  // Handle SOLUTIONS_LIST type sections specially
  if (section.type === 'SOLUTIONS_LIST') {
    // Start with JSON props
    const solutionsProps: SolutionsListProps = {
      title: sectionData.title as string | undefined,
      description: sectionData.description as string | undefined,
      solutions: (sectionData.solutions as SolutionsListProps['solutions']) || undefined,
      image: (sectionData.image as string) || undefined,
      images: (sectionData.images as string[]) || undefined,
      imageAlt: (sectionData.imageAlt as string) || undefined,
      content: (sectionData.content as string) || undefined,
    };

    return <Solutions {...solutionsProps} />;
  }

  // Handle SERVICES type sections specially
  if (section.type === 'SERVICES') {
    // Start with JSON props
    const servicesProps: ServicesSectionProps = {
      title: sectionData.title as string | undefined,
      description: sectionData.description as string | undefined,
      services: (sectionData.services as ServicesSectionProps['services']) || [],
    };


    return <Services {...servicesProps} />;
  }

  // Handle ABOUT type sections specially
  if (section.type === 'ABOUT') {
    // Start with JSON props
    const aboutProps: AboutSectionProps = {
      title: sectionData.title as string | undefined,
      description: (sectionData.description as string) || (sectionData.content as string) || undefined,
      content: (sectionData.content as string) || '',
      image: (sectionData.image as string) || undefined,
      imageAlt: (sectionData.imageAlt as string) || undefined,
      backgroundImage: normalizeBackgroundImage(sectionData.backgroundImage as string | ResponsiveBackgroundImage | undefined),
    };

    // Use content from sectionData if available
    if (sectionData.content) {
      aboutProps.content = sectionData.content as string;
    }

    return <About {...aboutProps} />;
  }

  // Handle LOCATION type sections
  if (section.type === 'LOCATION') {
    // Start with JSON props
    const locationProps: LocationSectionProps = {
      title: sectionData.title as string | undefined,
      location: sectionData.location as string | undefined,
      facilityTitle: sectionData.facilityTitle as string | undefined,
      facilityDescription: sectionData.facilityDescription as string | undefined,
      image: (sectionData.image as string) || undefined,
      imageAlt: (sectionData.imageAlt as string) || undefined,
    };


    return <Location {...locationProps} />;
  }

  // Handle MISSION type sections
  if (section.type === 'MISSION') {
    // Start with JSON props
    const missionProps: MissionSectionProps = {
      title: sectionData.title as string | undefined,
      description: sectionData.description as string | undefined,
      backgroundImage: normalizeBackgroundImage(sectionData.backgroundImage as string | ResponsiveBackgroundImage | undefined),
    };

    return <Mission {...missionProps} />;
  }

  // Handle VISION type sections
  if (section.type === 'VISION') {
    // Start with JSON props
    const visionProps: VisionSectionProps = {
      title: sectionData.title as string | undefined,
      description: sectionData.description as string | undefined,
      backgroundImage: normalizeBackgroundImage(sectionData.backgroundImage as string | ResponsiveBackgroundImage | undefined),
    };

    return <Vision {...visionProps} />;
  }

  // Handle VALUES type sections
  if (section.type === 'VALUES') {
    const valuesProps: ValuesSectionProps = {
      title: sectionData.title as string | undefined,
      values: (sectionData.values as ValuesSectionProps['values']) || [],
      backgroundImage: normalizeBackgroundImage(sectionData.backgroundImage as string | ResponsiveBackgroundImage | undefined),
    };

    return <Values {...valuesProps} />;
  }

  // Handle HUMAN_RESOURCES type sections
  if (section.type === 'HUMAN_RESOURCES') {
    // Start with JSON props
    const hrProps: HumanResourcesSectionProps = {
      title: (sectionData.title as string) || '',
      description: (sectionData.description as string) || '',
      items: (sectionData.items as string[]) || [],
    };


    return <HumanResources {...hrProps} />;
  }

  // Handle WHY_PERU type sections
  if (section.type === 'WHY_PERU') {
    // Start with JSON props
    const whyPeruProps: WhyPeruSectionProps = {
      title: (sectionData.title as string) || '',
      points: (sectionData.points as string[]) || undefined,
      content: (sectionData.content as string) || undefined,
      image: (sectionData.image as string) || undefined,
      imageAlt: (sectionData.imageAlt as string) || undefined,
    };

    // Use content from sectionData if available (for markdown rendering)
    if (sectionData.content) {
      whyPeruProps.content = sectionData.content as string;
    } else if (sectionData.markdownContent) {
      whyPeruProps.content = sectionData.markdownContent as string;
    }

    return <WhyPeru {...whyPeruProps} />;
  }

  // Handle OPPORTUNITIES_FEATURES type sections
  if (section.type === 'OPPORTUNITIES_FEATURES') {
    // Start with JSON props
    const opportunitiesProps: OpportunitiesFeaturesProps = {
      title: sectionData.title as string | undefined,
      features: (sectionData.features as OpportunitiesFeaturesProps['features']) || [],
    };


    return <Opportunities {...opportunitiesProps} />;
  }

  // Handle TRAINING type sections
  if (section.type === 'TRAINING') {
    // Start with JSON props
    const trainingProps: TrainingSectionProps = {
      title: (sectionData.title as string) || '',
      bullets: (sectionData.bullets as string[]) || undefined,
      content: (sectionData.content as string) || undefined,
      image: (sectionData.image as string) || undefined,
      imageAlt: (sectionData.imageAlt as string) || undefined,
    };

    // Use content from sectionData if available
    if (sectionData.content) {
      trainingProps.content = sectionData.content as string;
    }

    return <Training {...trainingProps} />;
  }

  // Handle COMPETITIVE_ADVANTAGE type sections
  if (section.type === 'COMPETITIVE_ADVANTAGE') {
    // Start with JSON props
    const advantageProps: CompetitiveAdvantageSectionProps = {
      title: (sectionData.title as string) || '',
      paragraph: (sectionData.paragraph as string) || undefined,
      content: (sectionData.content as string) || undefined,
      backgroundImage: normalizeBackgroundImage(sectionData.backgroundImage as string | ResponsiveBackgroundImage | undefined),
    };

    // Use content from sectionData if available
    if (sectionData.content) {
      advantageProps.content = sectionData.content as string;
    } else if (sectionData.markdownContent) {
      advantageProps.content = sectionData.markdownContent as string;
    }

    return <CompetitiveAdvantage {...advantageProps} />;
  }

  // Handle FORM type sections
  if (section.type === 'FORM') {
    // Start with JSON props
    const formProps: FormSectionProps = {
      title: (sectionData.title as string) || undefined,
      description: (sectionData.description as string) || undefined,
      formType: (sectionData.formType as 'signin' | 'joinus') || 'signin',
      layout: (sectionData.layout as 'vertical' | 'horizontal') || 'vertical',
      heroTitle: (sectionData.heroTitle as string) || undefined,
      heroDescription: (sectionData.heroDescription as string) || undefined,
      formPosition: (sectionData.formPosition as 'left' | 'right') || 'right',
    };


    return <Form {...formProps} />;
  }

  // Handle BEYOND_STANDARDS type sections
  if (section.type === 'BEYOND_STANDARDS') {
    // Start with JSON props
    const beyondStandardsProps: BeyondStandardsSectionProps = {
      title: (sectionData.title as string) || undefined,
      description: (sectionData.description as string) || undefined,
      items: (sectionData.items as string[]) || [],
      backgroundImage: normalizeBackgroundImage(sectionData.backgroundImage as string | ResponsiveBackgroundImage | undefined),
    };


    return <BeyondStandards {...beyondStandardsProps} />;
  }

  // Handle WE_KNOW_OUR_PEOPLE type sections
  if (section.type === 'WE_KNOW_OUR_PEOPLE') {
    const weKnowOurPeopleProps: WeKnowOurPeopleSectionProps = {
      title: (sectionData.title as string) || undefined,
      backgroundImage: normalizeBackgroundImage(sectionData.backgroundImage as string | ResponsiveBackgroundImage | undefined),
      content: (sectionData.content as string) || undefined,
    };

    // Use content from sectionData if available
    if (sectionData.content) {
      weKnowOurPeopleProps.content = sectionData.content as string;
    } else if (sectionData.markdownContent) {
      weKnowOurPeopleProps.content = sectionData.markdownContent as string;
    }

    return <WeKnowOurPeople {...weKnowOurPeopleProps} />;
  }

  // Handle SPACER type sections
  if (section.type === 'SPACER') {
    return <SpacerSection />;
  }

  // Render markdown content if available
  const content = sectionData.content as string | undefined;
  if (!content) {
    return null;
  }

  return (
    <section 
      data-section={section.sectionKey || section.id} 
      className="py-16 px-4" 
      style={{ backgroundColor: getBrandColor('white') }}
    >
      <div className="container mx-auto max-w-6xl">
        <div className={`grid ${image ? 'md:grid-cols-2' : ''} gap-12 items-center`}>
          {image && (
            <div className="relative w-full h-96 rounded-lg overflow-hidden">
              <Image
                src={image}
                alt={imageAlt}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div>
            <div 
              className="prose prose-lg max-w-none"
              style={{
                color: '#4a4a4a'
              }}
            >
              <MarkdownRenderer content={content} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


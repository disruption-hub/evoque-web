# Secciones Componentizadas

Componentes React reutilizables para construir páginas del sitio E-Voque siguiendo el diseño del brochure corporativo.

## Componentes Disponibles

### HeroSection
Sección inicial con claim principal y branding.

```tsx
<HeroSection
  title="Corporate Brochure"
  subtitle="Beyond interpretation"
  backgroundImage="/hero-bg.jpg"
  ctaText="Get Started"
  ctaLink="/contact"
/>
```

### AboutSection
Texto introductorio sobre la empresa con imagen opcional.

```tsx
<AboutSection
  title="About E-Voque"
  content="We are a business process and marketing services outsourcing..."
  image="/about-image.jpg"
  imageAlt="About E-Voque"
/>
```

### CapabilitiesGrid
Grid con items de capacidades (inbound, outbound, automated).

```tsx
<CapabilitiesGrid
  title="Our Capabilities"
  items={[
    {
      title: "Inbound Services",
      description: "Customer service and support",
      icon: "📞"
    },
    {
      title: "Outbound Services",
      description: "Sales and marketing outreach",
      icon: "📢"
    }
  ]}
/>
```

### SolutionsList
Listado de servicios ofrecidos por categorías.

```tsx
<SolutionsList
  title="Solutions"
  solutions={[
    {
      category: "Customer Service",
      items: ["Language Interpretation", "Email/Chat Response"]
    },
    {
      category: "Support Services",
      items: ["Loyalty Programs", "Satisfaction Surveys"]
    }
  ]}
/>
```

### HumanResourcesSection
Bloque explicativo de staffing y reclutamiento.

```tsx
<HumanResourcesSection
  title="Experts in Human Resources Solution"
  description="E-voque has an excellent reputation..."
  items={[
    "Specialized Staffing",
    "Recruitment",
    "Headhunting",
    "Payrolling"
  ]}
/>
```

### WhyPeruSection
Explicación estratégica de ubicación.

```tsx
<WhyPeruSection
  title="Why Peru?"
  points={[
    "Peru and Colombia were carefully chosen...",
    "Friendly, english-speaking population",
    "Strong American cultural influences"
  ]}
  image="/peru-map.jpg"
/>
```

### OpportunitiesFeatures
Lista de oportunidades y ventajas con cards.

```tsx
<OpportunitiesFeatures
  title="Opportunities"
  features={[
    {
      title: "Strategic Location",
      description: "Same time zone as US and Latin America"
    },
    {
      title: "Cultural Affinity",
      description: "Greater affinity with North America"
    }
  ]}
/>
```

### TrainingSection
Sección sobre formación y calidad.

```tsx
<TrainingSection
  title="Trained to be The Best"
  bullets={[
    "Every agent goes through exhaustive training...",
    "Vital skills for quality customer experience",
    "Well-rounded professional development"
  ]}
  image="/training.jpg"
/>
```

### CompetitiveAdvantageSection
Ventajas de costos comparativos.

```tsx
<CompetitiveAdvantageSection
  title="Competitive Advantage"
  paragraph="Wages and benefits are big part of the costs..."
  showComparison={true}
  comparisonData={[
    { location: "Peru", cost: "Low" },
    { location: "US", cost: "High" }
  ]}
/>
```

### ContactSection
Datos de contacto + CTA.

```tsx
<ContactSection
  title="Contact Us"
  address="Lima, Perú"
  email="info@e-voque.com"
  website="www.e-voque.com"
  ctaText="Let's work together!"
  ctaLink="mailto:info@e-voque.com"
/>
```

## Navegación

### NavigationHeader
Menú principal con branding.

```tsx
<NavigationHeader
  logo="/logo.svg"
  logoAlt="E-Voque Logo"
  links={[
    { label: "Home", url: "/" },
    { label: "About", url: "/about" },
    { label: "Contact", url: "/contact", isExternal: false }
  ]}
/>
```

### BrandFooter
Footer corporativo minimalista.

```tsx
<BrandFooter
  copyright="© 2024 E-Voque. All rights reserved."
  links={[
    { label: "Home", url: "/" },
    { label: "Contact", url: "mailto:info@e-voque.com", isExternal: true }
  ]}
  socialLinks={[
    { platform: "LinkedIn", url: "https://linkedin.com/company/evoque", icon: "💼" }
  ]}
/>
```

## Uso en Páginas

```tsx
import {
  HeroSection,
  AboutSection,
  SolutionsList,
  ContactSection
} from '@/components/sections';
import { NavigationHeader, BrandFooter } from '@/components/navigation';

export default function HomePage() {
  return (
    <>
      <NavigationHeader {...headerProps} />
      <HeroSection {...heroProps} />
      <AboutSection {...aboutProps} />
      <SolutionsList {...solutionsProps} />
      <ContactSection {...contactProps} />
      <BrandFooter {...footerProps} />
    </>
  );
}
```

## Brand Colors

Todos los componentes usan los colores de marca definidos en `@/config/brand-colors`:
- Deep Navy (#1B1B68) - Color principal
- Secondary Blue (#1D3395) - Color secundario
- Accent Electric Blue (#8988FC) - Acentos
- Accent Orange (#FFAB22) - CTAs
- Green Accent (#59A047) - Éxitos/checkmarks


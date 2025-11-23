// Component Types
export type ComponentType = 
  | 'TEXT'
  | 'HEADING'
  | 'PARAGRAPH'
  | 'IMAGE'
  | 'VIDEO'
  | 'BUTTON'
  | 'CARD'
  | 'FORM';

// Background Types (simplified)
export type BackgroundType = 'COLOR' | 'IMAGE';

// Background
export interface Background {
  type: BackgroundType;
  value: string; // Color hex or image URL
  opacity?: number;
}

// Component Content (generic)
export type ComponentContent = Record<string, unknown>;

// Component Styles (simplified)
export interface ComponentStyles {
  layout?: {
    width?: string;
    height?: string;
    padding?: string;
    margin?: string;
    display?: string;
    justifyContent?: string;
    alignItems?: string;
  };
  typography?: {
    fontSize?: string;
    fontWeight?: string;
    color?: string;
    textAlign?: string;
  };
  appearance?: {
    backgroundColor?: string;
    borderRadius?: string;
  };
}

// Component
export interface Component {
  id: string;
  type: ComponentType;
  name: string;
  content: ComponentContent;
  styles?: ComponentStyles;
  order: number;
  isActive: boolean;
  sectionId?: string;
}

// Section Component Types (for componentized sections)
export type SectionComponentType = 
  | 'HERO'
  | 'ABOUT'
  | 'CAPABILITIES_GRID'
  | 'SOLUTIONS_LIST'
  | 'SERVICES'
  | 'HUMAN_RESOURCES'
  | 'WHY_PERU'
  | 'OPPORTUNITIES_FEATURES'
  | 'TRAINING'
  | 'COMPETITIVE_ADVANTAGE'
  | 'CONTACT'
  | 'LOCATION'
  | 'MISSION'
  | 'VISION'
  | 'VALUES'
  | 'BEYOND_STANDARDS'
  | 'FORM'
  | 'WE_KNOW_OUR_PEOPLE'
  | 'SPACER';

// Section
export interface Section {
  id: string;
  sectionKey: string;
  title?: string;
  type?: string | SectionComponentType; // Can be a componentized section type
  background?: Background;
  styles?: ComponentStyles;
  components?: Component[] | string[]; // Can be component IDs or full component objects
  // For componentized sections, use sectionData instead of components
  sectionData?: Record<string, unknown>; // Props for componentized sections
  order: number;
  isActive: boolean;
}

// Menu Item
export interface MenuItem {
  id: string;
  label: string;
  url: string;
  order: number;
  isActive: boolean;
  isExternal?: boolean;
  target?: string;
}

// Menu Section Type
export type MenuSectionType = 'HEADER' | 'FOOTER';

// Menu Section
export interface MenuSection {
  id: string;
  type: MenuSectionType;
  name: string;
  content?: {
    menuId?: string;
    logo?: string;
    logoAlt?: string;
    copyright?: string;
    links?: MenuItem[];
    linkGroups?: Array<{ links: MenuItem[] }>;
    content?: string;
  };
  order: number;
  isActive: boolean;
}

// Page
export interface Page {
  id: string;
  slug: string;
  title: string;
  description?: string;
  sections: string[]; // Array of section IDs
  menuSections?: string[]; // Array of menu section IDs
  isActive: boolean;
}


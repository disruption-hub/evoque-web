import { promises as fs } from 'fs';
import path from 'path';
import { Page, Section, MenuSection } from '@/types';

const dataDir = path.join(process.cwd(), 'src/data');
const contentDir = path.join(process.cwd(), 'src/content');

/**
 * File system service for reading and writing JSON and MDX files
 * Used by the live editor instead of API calls
 */

// ============================================================================
// Read Operations
// ============================================================================

export async function readPage(slug: string): Promise<Page | null> {
  try {
    const filePath = path.join(dataDir, 'pages', slug === '' ? 'evoque.json' : `${slug}.json`);
    const fileContents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContents) as Page;
  } catch (error: any) {
    if (error?.code !== 'ENOENT') {
      console.error(`Error reading page ${slug}:`, error);
    }
    return null;
  }
}

export async function readSection(sectionId: string): Promise<Section | null> {
  try {
    const filePath = path.join(dataDir, 'sections', `${sectionId}.json`);
    const fileContents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContents) as Section;
  } catch (error) {
    console.error(`Error reading section ${sectionId}:`, error);
    return null;
  }
}

export async function readSections(sectionIds: string[]): Promise<Section[]> {
  const sections = await Promise.all(
    sectionIds.map(id => readSection(id))
  );
  return sections.filter((s): s is Section => s !== null);
}

export async function readMenuSection(menuSectionId: string): Promise<MenuSection | null> {
  try {
    const filePath = path.join(dataDir, 'menu-sections', `${menuSectionId}.json`);
    const fileContents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContents) as MenuSection;
  } catch (error) {
    console.error(`Error reading menu section ${menuSectionId}:`, error);
    return null;
  }
}

export async function readMenuSections(menuSectionIds: string[]): Promise<MenuSection[]> {
  const menuSections = await Promise.all(
    menuSectionIds.map(id => readMenuSection(id))
  );
  return menuSections.filter((ms): ms is MenuSection => ms !== null);
}

export async function readMDX(mdxPath: string): Promise<string | null> {
  try {
    const filePath = path.join(contentDir, mdxPath);
    const fileContents = await fs.readFile(filePath, 'utf8');
    return fileContents;
  } catch (error) {
    console.error(`Error reading MDX ${mdxPath}:`, error);
    return null;
  }
}

export async function listPages(): Promise<Page[]> {
  try {
    const pagesDir = path.join(dataDir, 'pages');
    const files = await fs.readdir(pagesDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    const pages = await Promise.all(
      jsonFiles.map(async (file) => {
        const slug = file.replace('.json', '');
        return readPage(slug === 'evoque' ? '' : slug);
      })
    );
    return pages.filter((p): p is Page => p !== null);
  } catch (error) {
    console.error('Error listing pages:', error);
    return [];
  }
}

export async function listSections(): Promise<Section[]> {
  try {
    const sectionsDir = path.join(dataDir, 'sections');
    const files = await fs.readdir(sectionsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    const sections = await Promise.all(
      jsonFiles.map(async (file) => {
        const sectionId = file.replace('.json', '');
        return readSection(sectionId);
      })
    );
    return sections.filter((s): s is Section => s !== null);
  } catch (error) {
    console.error('Error listing sections:', error);
    return [];
  }
}

export async function listMenuSections(): Promise<MenuSection[]> {
  try {
    const menuSectionsDir = path.join(dataDir, 'menu-sections');
    const files = await fs.readdir(menuSectionsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    const menuSections = await Promise.all(
      jsonFiles.map(async (file) => {
        const menuSectionId = file.replace('.json', '');
        return readMenuSection(menuSectionId);
      })
    );
    return menuSections.filter((ms): ms is MenuSection => ms !== null);
  } catch (error) {
    console.error('Error listing menu sections:', error);
    return [];
  }
}

// ============================================================================
// Write Operations
// ============================================================================

export async function writePage(page: Page): Promise<boolean> {
  try {
    const slug = page.slug === '' ? 'evoque' : page.slug;
    const filePath = path.join(dataDir, 'pages', `${slug}.json`);
    await fs.writeFile(filePath, JSON.stringify(page, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing page ${page.slug}:`, error);
    return false;
  }
}

export async function writeSection(section: Section): Promise<boolean> {
  try {
    const filePath = path.join(dataDir, 'sections', `${section.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(section, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing section ${section.id}:`, error);
    return false;
  }
}

export async function writeMenuSection(menuSection: MenuSection): Promise<boolean> {
  try {
    const filePath = path.join(dataDir, 'menu-sections', `${menuSection.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(menuSection, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing menu section ${menuSection.id}:`, error);
    return false;
  }
}

export async function writeMDX(mdxPath: string, content: string): Promise<boolean> {
  try {
    const filePath = path.join(contentDir, mdxPath);
    await fs.writeFile(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing MDX ${mdxPath}:`, error);
    return false;
  }
}

// ============================================================================
// Delete Operations
// ============================================================================

export async function deletePage(slug: string): Promise<boolean> {
  try {
    const filePath = path.join(dataDir, 'pages', slug === '' ? 'evoque.json' : `${slug}.json`);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error(`Error deleting page ${slug}:`, error);
    return false;
  }
}

export async function deleteSection(sectionId: string): Promise<boolean> {
  try {
    const filePath = path.join(dataDir, 'sections', `${sectionId}.json`);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error(`Error deleting section ${sectionId}:`, error);
    return false;
  }
}

export async function deleteMenuSection(menuSectionId: string): Promise<boolean> {
  try {
    const filePath = path.join(dataDir, 'menu-sections', `${menuSectionId}.json`);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error(`Error deleting menu section ${menuSectionId}:`, error);
    return false;
  }
}


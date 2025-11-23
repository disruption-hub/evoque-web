import { promises as fs } from 'fs';
import path from 'path';
import { Page, Section, MenuSection } from '@/types';

const dataDir = path.join(process.cwd(), 'src/data');

export async function loadPage(slug: string): Promise<Page | null> {
  try {
    const filePath = path.join(dataDir, 'pages', slug === '' ? 'evoque.json' : `${slug}.json`);
    const fileContents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContents) as Page;
  } catch (error: any) {
    // Only log errors that are not expected 404s (ENOENT)
    // This reduces console noise for routes that don't exist
    if (error?.code !== 'ENOENT') {
    console.error(`Error loading page ${slug}:`, error);
    }
    return null;
  }
}

export async function loadSection(sectionId: string): Promise<Section | null> {
  try {
    const filePath = path.join(dataDir, 'sections', `${sectionId}.json`);
    const fileContents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContents) as Section;
  } catch (error) {
    console.error(`Error loading section ${sectionId}:`, error);
    return null;
  }
}

export async function loadSections(sectionIds: string[]): Promise<Section[]> {
  const sections = await Promise.all(
    sectionIds.map(id => loadSection(id))
  );
  return sections.filter((s): s is Section => s !== null);
}

export async function loadMenuSection(menuSectionId: string): Promise<MenuSection | null> {
  try {
    const filePath = path.join(dataDir, 'menu-sections', `${menuSectionId}.json`);
    const fileContents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContents) as MenuSection;
  } catch (error) {
    console.error(`Error loading menu section ${menuSectionId}:`, error);
    return null;
  }
}

export async function loadMenuSections(menuSectionIds: string[]): Promise<MenuSection[]> {
  const menuSections = await Promise.all(
    menuSectionIds.map(id => loadMenuSection(id))
  );
  return menuSections.filter((ms): ms is MenuSection => ms !== null);
}

export async function loadMarkdown(filename: string): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), 'src/content', filename);
    const fileContents = await fs.readFile(filePath, 'utf8');
    return fileContents;
  } catch (error) {
    console.error(`Error loading markdown ${filename}:`, error);
    return '';
  }
}


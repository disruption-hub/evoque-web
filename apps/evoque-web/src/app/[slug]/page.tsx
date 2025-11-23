import { loadPage, loadSections, loadMenuSections } from '@/lib/data-loader';
import PageRenderer from '@/components/render/PageRenderer';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params;
  
  // Exclude file requests (images, videos, etc.) from being processed as page slugs
  // Common file extensions that should not be handled as pages
  const fileExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico',
    '.mp4', '.webm', '.mov', '.avi', '.mkv',
    '.mp3', '.wav', '.ogg',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx',
    '.css', '.js', '.json', '.xml', '.txt',
    '.zip', '.rar', '.tar', '.gz'
  ];
  
  const hasFileExtension = fileExtensions.some(ext => 
    slug.toLowerCase().endsWith(ext)
  );
  
  if (hasFileExtension) {
    notFound();
  }
  
  // Exclude common non-page routes (language codes, API routes, etc.)
  const excludedRoutes = ['en', 'es', 'fr', 'de', 'it', 'pt', 'api', '_next', 'favicon.ico'];
  if (excludedRoutes.includes(slug.toLowerCase())) {
    notFound();
  }
  
  // Load the page
  const page = await loadPage(slug);
  
  if (!page) {
    notFound();
  }

  // Load all sections for this page
  const sections = await loadSections(page.sections);
  
  // Load menu sections
  const menuSections = await loadMenuSections(page.menuSections || []);

  return (
    <PageRenderer
      page={page}
      sections={sections}
      menuSections={menuSections}
    />
  );
}


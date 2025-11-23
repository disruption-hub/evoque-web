import { loadPage, loadSections, loadMenuSections } from '@/lib/data-loader';
import PageRenderer from '@/components/render/PageRenderer';

export default async function Home() {
  // Load the E-Voque page
  const page = await loadPage('');
  
  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Page not found</p>
      </div>
    );
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

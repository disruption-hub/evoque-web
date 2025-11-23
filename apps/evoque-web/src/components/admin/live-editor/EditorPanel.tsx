'use client';

import { useState, useEffect } from 'react';
import { useLiveEditor } from '@/contexts/LiveEditorContext';
import { FileText, Layout, Box, Save, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import SectionMediaEditor from './SectionMediaEditor';
import apiClient from '@/lib/api-client';
import { Section } from '@/types';

export default function EditorPanel() {
  const { editorType, selectedPage, selectedSection, selectedComponent, setSelectedSection } = useLiveEditor();
  const [localSectionData, setLocalSectionData] = useState<Record<string, unknown>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Initialize local section data when section changes
  useEffect(() => {
    if (selectedSection) {
      setLocalSectionData(selectedSection.sectionData || {});
      setHasUnsavedChanges(false);
    }
  }, [selectedSection?.id]);

  // Check for unsaved changes
  useEffect(() => {
    if (selectedSection) {
      const originalData = JSON.stringify(selectedSection.sectionData || {});
      const currentData = JSON.stringify(localSectionData);
      setHasUnsavedChanges(originalData !== currentData);
    }
  }, [localSectionData, selectedSection]);

  // Handle section data change
  const handleSectionDataChange = (newSectionData: Record<string, unknown>) => {
    setLocalSectionData(newSectionData);
  };

  // Handle save
  const handleSave = async () => {
    if (!selectedSection) return;

    try {
      setIsSaving(true);
      const updatedSection: Section = {
        ...selectedSection,
        sectionData: localSectionData
      };

      const response = await apiClient.post<{ success: boolean; data: Section }>(
        '/admin/files/section',
        { section: updatedSection }
      );

      if (response.success && response.data) {
        setSelectedSection(response.data);
        setHasUnsavedChanges(false);
        toast({
          title: 'Section saved',
          description: 'Section data has been saved successfully.',
        });
      } else {
        throw new Error('Failed to save section');
      }
    } catch (error: any) {
      console.error('Error saving section:', error);
      toast({
        title: 'Save failed',
        description: error.message || 'Failed to save section. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (selectedSection) {
      setLocalSectionData(selectedSection.sectionData || {});
      setHasUnsavedChanges(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Editor Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          {editorType === 'page' && <FileText className="h-4 w-4 text-gray-600" />}
          {editorType === 'section' && <Layout className="h-4 w-4 text-gray-600" />}
          {editorType === 'component' && <Box className="h-4 w-4 text-gray-600" />}
          <span className="text-sm font-medium text-gray-900">
            {editorType === 'page' && `Editing: ${selectedPage?.title || 'Page'}`}
            {editorType === 'section' && `Editing: ${selectedSection?.title || 'Section'}`}
            {editorType === 'component' && `Editing: ${selectedComponent?.name || 'Component'}`}
            {!editorType && 'No selection'}
          </span>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!editorType && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No item selected</p>
              <p className="text-sm text-gray-500">
                Select a page, section, or component from the sidebar to start editing
              </p>
            </div>
          </div>
        )}

        {editorType === 'page' && selectedPage && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page Settings
              </label>
              <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
                <p className="text-sm text-gray-600">
                  Page editor placeholder - Implement page settings editor here
                </p>
                <div className="mt-4 space-y-2 text-xs text-gray-500">
                  <p>Title: {selectedPage.title}</p>
                  <p>Slug: {selectedPage.slug}</p>
                  <p>ID: {selectedPage.id}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {editorType === 'section' && selectedSection && (
          <div className="space-y-4">
            {/* Unsaved Changes Warning */}
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                <p className="text-sm text-yellow-800">You have unsaved changes</p>
              </div>
            )}

            {/* Section Media Editor */}
            <SectionMediaEditor
              section={selectedSection}
              sectionData={localSectionData}
              onChange={handleSectionDataChange}
            />
          </div>
        )}

        {editorType === 'component' && selectedComponent && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Component Settings
              </label>
              <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
                <p className="text-sm text-gray-600">
                  Component editor placeholder - Implement component settings editor here
                </p>
                <div className="mt-4 space-y-2 text-xs text-gray-500">
                  <p>Name: {selectedComponent.name}</p>
                  <p>Type: {selectedComponent.type}</p>
                  <p>ID: {selectedComponent.id}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer with Save/Cancel buttons for sections */}
      {editorType === 'section' && selectedSection && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-end gap-3">
            {hasUnsavedChanges && (
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}



import { render, fireEvent } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SnippetForm } from '~/ui/shared/SnippetForm';
import { SnippetList } from '~/ui/shared/SnippetList';
import { Snippet } from '~/storage';

describe('UI Components', () => {
  describe('SnippetForm', () => {
    it('should render in add mode by default', () => {
      const mockAdd = vi.fn();
      const { getByRole, getByText } = render(
        <SnippetForm onAdd={mockAdd} />
      );

      expect(getByRole('textbox', { name: /title/i })).toBeInTheDocument();
      expect(getByRole('textbox', { name: /content/i })).toBeInTheDocument();
      expect(getByText('Add Snippet')).toBeInTheDocument();
    });

    it('should render in edit mode when editingSnippet is provided', () => {
      const mockUpdate = vi.fn();
      const testSnippet: Snippet = {
        id: '1',
        title: 'Test Title',
        body: 'Test Content'
      };

      const { getByRole, getByText, getByDisplayValue } = render(
        <SnippetForm onUpdate={mockUpdate} editingSnippet={testSnippet} />
      );

      expect(getByDisplayValue('Test Title')).toBeInTheDocument();
      expect(getByDisplayValue('Test Content')).toBeInTheDocument();
      expect(getByText('Update Snippet')).toBeInTheDocument();
    });

    it('should populate form fields with editing snippet data', () => {
      const mockUpdate = vi.fn();
      const testSnippet: Snippet = {
        id: '1',
        title: 'Original Title',
        body: 'Original Content'
      };

      const { getByDisplayValue } = render(
        <SnippetForm onUpdate={mockUpdate} editingSnippet={testSnippet} />
      );

      expect(getByDisplayValue('Original Title')).toBeInTheDocument();
      expect(getByDisplayValue('Original Content')).toBeInTheDocument();
    });

    it('should show correct button icon for edit mode', () => {
      const mockUpdate = vi.fn();
      const testSnippet: Snippet = {
        id: '1',
        title: 'Test',
        body: 'Test'
      };

      const { getByText } = render(
        <SnippetForm onUpdate={mockUpdate} editingSnippet={testSnippet} />
      );

      // Look for the save icon in edit mode
      expect(getByText('💾')).toBeInTheDocument();
    });
  });

  describe('SnippetList', () => {
    const testSnippets: Snippet[] = [
      { id: '1', title: 'First Snippet', body: 'First content' },
      { id: '2', title: 'Second Snippet', body: 'Second content' }
    ];

    it('should render snippets with edit buttons when onEdit is provided', () => {
      const mockDelete = vi.fn();
      const mockEdit = vi.fn();

      const { getAllByTitle } = render(
        <SnippetList 
          snippets={testSnippets} 
          onDelete={mockDelete}
          onEdit={mockEdit}
        />
      );

      const editButtons = getAllByTitle('Edit snippet');
      expect(editButtons).toHaveLength(2);
    });

    it('should not render edit buttons when onEdit is not provided', () => {
      const mockDelete = vi.fn();

      const { queryAllByTitle } = render(
        <SnippetList 
          snippets={testSnippets} 
          onDelete={mockDelete}
        />
      );

      const editButtons = queryAllByTitle('Edit snippet');
      expect(editButtons).toHaveLength(0);
    });

    it('should call onEdit when edit button is clicked', async () => {
      const mockDelete = vi.fn();
      const mockEdit = vi.fn();

      const { getAllByTitle } = render(
        <SnippetList 
          snippets={testSnippets} 
          onDelete={mockDelete}
          onEdit={mockEdit}
        />
      );

      const editButtons = getAllByTitle('Edit snippet');
      editButtons[0].click();

      expect(mockEdit).toHaveBeenCalledWith(testSnippets[0]);
    });

    it('should render snippets with both edit and delete buttons in correct order', () => {
      const mockDelete = vi.fn();
      const mockEdit = vi.fn();

      const { container } = render(
        <SnippetList 
          snippets={testSnippets} 
          onDelete={mockDelete}
          onEdit={mockEdit}
        />
      );

      const snippetActions = container.querySelectorAll('.snippet-actions');
      expect(snippetActions).toHaveLength(2);

      // Each snippet should have both edit and delete buttons
      snippetActions.forEach(actions => {
        const editButton = actions.querySelector('.edit-button');
        const deleteButton = actions.querySelector('.delete-button');
        expect(editButton).toBeInTheDocument();
        expect(deleteButton).toBeInTheDocument();
      });
    });

    it('should display empty state when no snippets', () => {
      const mockDelete = vi.fn();
      const mockEdit = vi.fn();

      const { getByText } = render(
        <SnippetList 
          snippets={[]} 
          onDelete={mockDelete}
          onEdit={mockEdit}
        />
      );

      expect(getByText('No snippets found')).toBeInTheDocument();
      expect(getByText('Create your first snippet to get started')).toBeInTheDocument();
    });
  });

  describe('Folder functionality', () => {
    it('should render folder input in SnippetForm', () => {
      const mockAdd = vi.fn();
      const { getByRole } = render(
        <SnippetForm onAdd={mockAdd} />
      );

      expect(getByRole('combobox', { name: /folder/i })).toBeInTheDocument();
    });

    it('should populate folder field when editing snippet with folder', () => {
      const mockUpdate = vi.fn();
      const testSnippet: Snippet = {
        id: '1',
        title: 'Test Title',
        body: 'Test Content',
        folder: 'Work'
      };

      const { getByDisplayValue } = render(
        <SnippetForm onUpdate={mockUpdate} editingSnippet={testSnippet} />
      );

      expect(getByDisplayValue('Work')).toBeInTheDocument();
    });

    it('should group snippets by folder when groupByFolders is true', () => {
      const snippets: Snippet[] = [
        { id: '1', title: 'Snippet 1', body: 'Content 1', folder: 'Work' },
        { id: '2', title: 'Snippet 2', body: 'Content 2', folder: 'Personal' },
        { id: '3', title: 'Snippet 3', body: 'Content 3' }
      ];
      const mockDelete = vi.fn();

      const { getByText } = render(
        <SnippetList 
          snippets={snippets} 
          onDelete={mockDelete}
          groupByFolders={true}
        />
      );

      expect(getByText('Work')).toBeInTheDocument();
      expect(getByText('Personal')).toBeInTheDocument();
      expect(getByText('Ungrouped')).toBeInTheDocument();
    });

    it('should filter snippets by folder name in search', () => {
      const snippets: Snippet[] = [
        { id: '1', title: 'Meeting notes', body: 'Content 1', folder: 'Work' },
        { id: '2', title: 'Personal reminder', body: 'Content 2', folder: 'Personal' },
      ];
      const mockDelete = vi.fn();

      const { getByText, queryByText } = render(
        <SnippetList 
          snippets={snippets} 
          onDelete={mockDelete}
          searchQuery="Work"
          groupByFolders={false}
        />
      );

      expect(getByText('Meeting notes')).toBeInTheDocument();
      expect(queryByText('Personal reminder')).not.toBeInTheDocument();
    });

    it('should show folder information when not grouping by folders', () => {
      const snippets: Snippet[] = [
        { id: '1', title: 'Test Snippet', body: 'Content 1', folder: 'Work' }
      ];
      const mockDelete = vi.fn();

      const { getByText } = render(
        <SnippetList 
          snippets={snippets} 
          onDelete={mockDelete}
          groupByFolders={false}
        />
      );

      expect(getByText('📁 Work')).toBeInTheDocument();
    });

    it('should render combobox instead of regular input for folder selection', () => {
      const mockAdd = vi.fn();
      const availableFolders = ['Work', 'Personal'];

      const { getByRole } = render(
        <SnippetForm onAdd={mockAdd} availableFolders={availableFolders} />
      );

      const combobox = getByRole('combobox', { name: /folder/i });
      expect(combobox).toBeInTheDocument();
      expect(combobox).toHaveAttribute('aria-expanded', 'false');
      expect(combobox).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('should filter dropdown options when typing in folder combobox', async () => {
      const mockAdd = vi.fn();
      const availableFolders = ['Work', 'Personal', 'Projects'];

      const { getByRole, getByText, queryByText } = render(
        <SnippetForm onAdd={mockAdd} availableFolders={availableFolders} />
      );

      const combobox = getByRole('combobox', { name: /folder/i });
      
      // Focus the input to open dropdown
      fireEvent.focus(combobox);
      
      // Type to filter
      fireEvent.input(combobox, { target: { value: 'Per' } });
      
      // Should show Personal but not Work or Projects
      expect(getByText('Personal')).toBeInTheDocument();
      expect(queryByText('Work')).not.toBeInTheDocument();
      expect(queryByText('Projects')).not.toBeInTheDocument();
    });

    it('should show create option when typing non-existing folder name', async () => {
      const mockAdd = vi.fn();
      const availableFolders = ['Work', 'Personal'];

      const { getByRole, getByText } = render(
        <SnippetForm onAdd={mockAdd} availableFolders={availableFolders} />
      );

      const combobox = getByRole('combobox', { name: /folder/i });
      
      // Focus the input to open dropdown
      fireEvent.focus(combobox);
      
      // Type a new folder name
      fireEvent.input(combobox, { target: { value: 'NewFolder' } });
      
      // Should show create option
      expect(getByText('Create "NewFolder"')).toBeInTheDocument();
    });
  });
});
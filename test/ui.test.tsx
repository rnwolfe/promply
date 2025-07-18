import { render } from '@testing-library/preact';
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
});
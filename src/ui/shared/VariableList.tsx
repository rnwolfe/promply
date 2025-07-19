import { useState } from 'preact/hooks';
import { SnippetVariable } from '~/storage';

interface VariableListProps {
  variables: SnippetVariable[];
  onChange: (variables: SnippetVariable[]) => void;
  disabled?: boolean;
  className?: string;
}

export function VariableList({ variables, onChange, disabled = false, className = '' }: VariableListProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempVariable, setTempVariable] = useState<SnippetVariable>({ name: '', description: '', defaultValue: '' });

  const handleAddVariable = () => {
    setEditingIndex(variables.length);
    setTempVariable({ name: '', description: '', defaultValue: '' });
  };

  const handleEditVariable = (index: number) => {
    setEditingIndex(index);
    setTempVariable({ ...variables[index] });
  };

  const handleSaveVariable = () => {
    if (!tempVariable.name.trim()) return;
    
    const newVariable: SnippetVariable = {
      name: tempVariable.name.trim(),
      description: tempVariable.description?.trim() || undefined,
      defaultValue: tempVariable.defaultValue?.trim() || undefined
    };

    const newVariables = [...variables];
    if (editingIndex !== null) {
      if (editingIndex < variables.length) {
        newVariables[editingIndex] = newVariable;
      } else {
        newVariables.push(newVariable);
      }
    }

    onChange(newVariables);
    setEditingIndex(null);
    setTempVariable({ name: '', description: '', defaultValue: '' });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setTempVariable({ name: '', description: '', defaultValue: '' });
  };

  const handleDeleteVariable = (index: number) => {
    const newVariables = variables.filter((_, i) => i !== index);
    onChange(newVariables);
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const isValidVariableName = (name: string): boolean => {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
  };

  return (
    <div className={`variable-list ${className}`}>
      <div className="variable-list-header">
        <label>Variables</label>
        <button
          type="button"
          onClick={handleAddVariable}
          disabled={disabled || editingIndex !== null}
          className="add-variable-button"
        >
          + Add Variable
        </button>
      </div>
      
      <div className="variable-list-content">
        {variables.length === 0 && editingIndex === null && (
          <div className="empty-variables">
            <p>No variables defined. Variables allow you to make your snippets dynamic by using placeholders like <code>{'{{variableName}}'}</code> in your content.</p>
          </div>
        )}

        {variables.map((variable, index) => (
          <div key={index} className="variable-item">
            {editingIndex === index ? (
              <div className="variable-form">
                <div className="variable-form-row">
                  <input
                    type="text"
                    placeholder="Variable name (e.g., userName)"
                    value={tempVariable.name}
                    onInput={(e) => setTempVariable({ ...tempVariable, name: (e.target as HTMLInputElement).value })}
                    className={`variable-input ${!isValidVariableName(tempVariable.name) && tempVariable.name ? 'invalid' : ''}`}
                    disabled={disabled}
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={tempVariable.description || ''}
                    onInput={(e) => setTempVariable({ ...tempVariable, description: (e.target as HTMLInputElement).value })}
                    className="variable-input"
                    disabled={disabled}
                  />
                  <input
                    type="text"
                    placeholder="Default value (optional)"
                    value={tempVariable.defaultValue || ''}
                    onInput={(e) => setTempVariable({ ...tempVariable, defaultValue: (e.target as HTMLInputElement).value })}
                    className="variable-input"
                    disabled={disabled}
                  />
                </div>
                <div className="variable-form-actions">
                  <button
                    type="button"
                    onClick={handleSaveVariable}
                    disabled={!tempVariable.name.trim() || !isValidVariableName(tempVariable.name)}
                    className="save-variable-button"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="cancel-variable-button"
                  >
                    Cancel
                  </button>
                </div>
                {tempVariable.name && !isValidVariableName(tempVariable.name) && (
                  <div className="variable-error">
                    Variable name must start with a letter or underscore and contain only letters, numbers, and underscores.
                  </div>
                )}
              </div>
            ) : (
              <div className="variable-display">
                <div className="variable-info">
                  <span className="variable-name">{'{{' + variable.name + '}}'}</span>
                  {variable.description && (
                    <span className="variable-description">{variable.description}</span>
                  )}
                  {variable.defaultValue && (
                    <span className="variable-default">Default: {variable.defaultValue}</span>
                  )}
                </div>
                <div className="variable-actions">
                  <button
                    type="button"
                    onClick={() => handleEditVariable(index)}
                    disabled={disabled || editingIndex !== null}
                    className="edit-variable-button"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteVariable(index)}
                    disabled={disabled || editingIndex !== null}
                    className="delete-variable-button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {editingIndex === variables.length && (
          <div className="variable-item">
            <div className="variable-form">
              <div className="variable-form-row">
                <input
                  type="text"
                  placeholder="Variable name (e.g., userName)"
                  value={tempVariable.name}
                  onInput={(e) => setTempVariable({ ...tempVariable, name: (e.target as HTMLInputElement).value })}
                  className={`variable-input ${!isValidVariableName(tempVariable.name) && tempVariable.name ? 'invalid' : ''}`}
                  disabled={disabled}
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={tempVariable.description || ''}
                  onInput={(e) => setTempVariable({ ...tempVariable, description: (e.target as HTMLInputElement).value })}
                  className="variable-input"
                  disabled={disabled}
                />
                <input
                  type="text"
                  placeholder="Default value (optional)"
                  value={tempVariable.defaultValue || ''}
                  onInput={(e) => setTempVariable({ ...tempVariable, defaultValue: (e.target as HTMLInputElement).value })}
                  className="variable-input"
                  disabled={disabled}
                />
              </div>
              <div className="variable-form-actions">
                <button
                  type="button"
                  onClick={handleSaveVariable}
                  disabled={!tempVariable.name.trim() || !isValidVariableName(tempVariable.name)}
                  className="save-variable-button"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="cancel-variable-button"
                >
                  Cancel
                </button>
              </div>
              {tempVariable.name && !isValidVariableName(tempVariable.name) && (
                <div className="variable-error">
                  Variable name must start with a letter or underscore and contain only letters, numbers, and underscores.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect, useRef } from 'preact/hooks';

interface FolderComboboxProps {
  value: string;
  onChange: (value: string) => void;
  availableFolders: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function FolderCombobox({ 
  value, 
  onChange, 
  availableFolders, 
  placeholder = "Enter folder name...", 
  disabled = false,
  className = "" 
}: FolderComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredFolders, setFilteredFolders] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter folders based on current input value
  useEffect(() => {
    if (!value.trim()) {
      setFilteredFolders(availableFolders);
    } else {
      const filtered = availableFolders.filter(folder =>
        folder.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredFolders(filtered);
    }
    setHighlightedIndex(-1);
  }, [value, availableFolders]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: Event) => {
    const newValue = (e.target as HTMLInputElement).value;
    onChange(newValue);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    const totalOptions = filteredFolders.length + (shouldShowCreateOption() ? 1 : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < totalOptions - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredFolders.length) {
          selectFolder(filteredFolders[highlightedIndex]);
        } else if (highlightedIndex === filteredFolders.length && shouldShowCreateOption()) {
          selectFolder(value.trim());
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const selectFolder = (folderName: string) => {
    onChange(folderName);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const shouldShowCreateOption = () => {
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 && 
           !availableFolders.some(folder => folder.toLowerCase() === trimmedValue.toLowerCase());
  };

  return (
    <div className={`folder-combobox ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="form-input"
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Folder (optional)"
        id="folder"
      />
      
      {isOpen && (
        <div ref={dropdownRef} className="folder-dropdown" role="listbox">
          {filteredFolders.map((folder, index) => (
            <div
              key={folder}
              className={`folder-option ${index === highlightedIndex ? 'highlighted' : ''}`}
              onClick={() => selectFolder(folder)}
              role="option"
              aria-selected={index === highlightedIndex}
            >
              <span className="folder-icon">📁</span>
              {folder}
            </div>
          ))}
          
          {shouldShowCreateOption() && (
            <div
              className={`folder-option create-option ${
                filteredFolders.length === highlightedIndex ? 'highlighted' : ''
              }`}
              onClick={() => selectFolder(value.trim())}
              role="option"
              aria-selected={filteredFolders.length === highlightedIndex}
            >
              <span className="create-icon">➕</span>
              Create "{value.trim()}"
            </div>
          )}
          
          {filteredFolders.length === 0 && !shouldShowCreateOption() && (
            <div className="folder-option disabled">
              No folders found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
import { describe, expect, it } from 'vitest';
import { 
  extractVariables, 
  processTemplate, 
  hasVariables, 
  getVariablesWithMetadata,
  validateVariables 
} from '~/utils/template';
import { SnippetVariable } from '~/storage';

describe('Template Utilities', () => {
  describe('extractVariables', () => {
    it('should extract variables from template string', () => {
      const template = 'Hello {{name}}, your age is {{age}}';
      const variables = extractVariables(template);
      expect(variables).toEqual(['name', 'age']);
    });

    it('should handle empty template', () => {
      const variables = extractVariables('');
      expect(variables).toEqual([]);
    });

    it('should handle template without variables', () => {
      const template = 'Hello world';
      const variables = extractVariables(template);
      expect(variables).toEqual([]);
    });

    it('should handle duplicate variables', () => {
      const template = 'Hello {{name}}, nice to meet you {{name}}';
      const variables = extractVariables(template);
      expect(variables).toEqual(['name']);
    });

    it('should only match valid variable names', () => {
      const template = 'Hello {{name}}, invalid {{ spaces }} and {{123invalid}}';
      const variables = extractVariables(template);
      expect(variables).toEqual(['name']);
    });
  });

  describe('processTemplate', () => {
    it('should replace variables with values', () => {
      const template = 'Hello {{name}}, your age is {{age}}';
      const variables = { name: 'John', age: '30' };
      const result = processTemplate(template, variables);
      expect(result).toBe('Hello John, your age is 30');
    });

    it('should handle missing variables gracefully', () => {
      const template = 'Hello {{name}}, your age is {{age}}';
      const variables = { name: 'John' };
      const result = processTemplate(template, variables);
      expect(result).toBe('Hello John, your age is {{age}}');
    });

    it('should handle empty variables object', () => {
      const template = 'Hello {{name}}';
      const result = processTemplate(template, {});
      expect(result).toBe('Hello {{name}}');
    });

    it('should handle template without variables', () => {
      const template = 'Hello world';
      const result = processTemplate(template, { name: 'John' });
      expect(result).toBe('Hello world');
    });
  });

  describe('hasVariables', () => {
    it('should return true for template with variables', () => {
      expect(hasVariables('Hello {{name}}')).toBe(true);
    });

    it('should return false for template without variables', () => {
      expect(hasVariables('Hello world')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(hasVariables('')).toBe(false);
    });
  });

  describe('getVariablesWithMetadata', () => {
    it('should combine extracted variables with definitions', () => {
      const template = 'Hello {{name}}, your role is {{role}}';
      const definitions: SnippetVariable[] = [
        { name: 'name', description: 'User name', defaultValue: 'Anonymous' },
        { name: 'role', description: 'User role' }
      ];
      
      const result = getVariablesWithMetadata(template, definitions);
      expect(result).toEqual([
        { name: 'name', description: 'User name', defaultValue: 'Anonymous' },
        { name: 'role', description: 'User role' }
      ]);
    });

    it('should create minimal definition for undefined variables', () => {
      const template = 'Hello {{name}}, your age is {{age}}';
      const definitions: SnippetVariable[] = [
        { name: 'name', description: 'User name' }
      ];
      
      const result = getVariablesWithMetadata(template, definitions);
      expect(result).toEqual([
        { name: 'name', description: 'User name' },
        { name: 'age' }
      ]);
    });
  });

  describe('validateVariables', () => {
    it('should return valid when all variables are defined', () => {
      const template = 'Hello {{name}}, your role is {{role}}';
      const definitions: SnippetVariable[] = [
        { name: 'name', description: 'User name' },
        { name: 'role', description: 'User role' }
      ];
      
      const result = validateVariables(template, definitions);
      expect(result).toEqual({
        isValid: true,
        missingVariables: []
      });
    });

    it('should return invalid when variables are missing', () => {
      const template = 'Hello {{name}}, your age is {{age}} and role is {{role}}';
      const definitions: SnippetVariable[] = [
        { name: 'name', description: 'User name' }
      ];
      
      const result = validateVariables(template, definitions);
      expect(result).toEqual({
        isValid: false,
        missingVariables: ['age', 'role']
      });
    });

    it('should return valid for template without variables', () => {
      const template = 'Hello world';
      const definitions: SnippetVariable[] = [];
      
      const result = validateVariables(template, definitions);
      expect(result).toEqual({
        isValid: true,
        missingVariables: []
      });
    });
  });
});
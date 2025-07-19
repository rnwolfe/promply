import { SnippetVariable } from '~/storage';

/**
 * Extract variables from a template string
 * Variables are in the format {{variableName}}
 */
export function extractVariables(template: string): string[] {
  const variableRegex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = variableRegex.exec(template)) !== null) {
    const variableName = match[1];
    if (!variables.includes(variableName)) {
      variables.push(variableName);
    }
  }
  
  return variables;
}

/**
 * Process a template by replacing variables with provided values
 */
export function processTemplate(
  template: string, 
  variables: Record<string, string>
): string {
  let result = template;
  
  for (const [name, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${name}\\}\\}`, 'g');
    result = result.replace(regex, value);
  }
  
  return result;
}

/**
 * Check if a template contains variables
 */
export function hasVariables(template: string): boolean {
  return extractVariables(template).length > 0;
}

/**
 * Get variables with their metadata from a snippet
 */
export function getVariablesWithMetadata(
  template: string,
  variableDefinitions: SnippetVariable[] = []
): SnippetVariable[] {
  const extractedVariables = extractVariables(template);
  
  return extractedVariables.map(name => {
    const definition = variableDefinitions.find(v => v.name === name);
    return definition || { name };
  });
}

/**
 * Validate that all variables in template have definitions
 */
export function validateVariables(
  template: string,
  variableDefinitions: SnippetVariable[]
): { isValid: boolean; missingVariables: string[] } {
  const extractedVariables = extractVariables(template);
  const definedVariables = variableDefinitions.map(v => v.name);
  const missingVariables = extractedVariables.filter(v => !definedVariables.includes(v));
  
  return {
    isValid: missingVariables.length === 0,
    missingVariables
  };
}
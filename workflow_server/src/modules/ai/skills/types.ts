export interface ChatbotToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, {
        type: string;
        description?: string;
        enum?: (string | number)[];
      }>;
      required?: string[];
    };
  };
}

export interface ChatbotSkill {
  name: string;
  displayName: string;
  description: string;
  keywords: string[];
  signatures: string[];
  tools?: ChatbotToolDefinition[];
  parseAction: (name: string, args: Record<string, any>) => any | null;
}

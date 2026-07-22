import { prisma } from '#lib/prisma.js';

export const createCustomFieldService = async (data: any) => {
  const { key, name, description, fieldType, schemaJson, defaultValue, isRequired, isGlobal, projectId } = data;
  if (!key || !name) throw new Error('key and name are required');
  return await prisma.customFieldDefinition.create({
    data: {
      key,
      name,
      description,
      fieldType: fieldType || 'JSON',
      schemaJson: schemaJson ? (typeof schemaJson === 'object' ? JSON.stringify(schemaJson) : schemaJson) : null,
      defaultValue,
      isRequired: Boolean(isRequired),
      isGlobal: isGlobal !== undefined ? Boolean(isGlobal) : true,
      projectId: projectId ? Number(projectId) : undefined
    }
  });
};

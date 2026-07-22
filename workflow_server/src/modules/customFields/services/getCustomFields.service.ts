import { prisma } from '#lib/prisma.js';

export const getCustomFieldsService = async () => {
  return await prisma.customFieldDefinition.findMany();
};

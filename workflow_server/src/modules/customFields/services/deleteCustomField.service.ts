import { prisma } from '#lib/prisma.js';

export const deleteCustomFieldService = async (id: number) => {
  return await prisma.customFieldDefinition.delete({
    where: { id }
  });
};

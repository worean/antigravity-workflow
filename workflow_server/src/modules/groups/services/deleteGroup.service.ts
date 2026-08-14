// -*- coding: utf-8 -*-
import { prisma } from '#lib/prisma.js';

export const deleteGroupService = async (id: number) => {
  if (!id) throw new Error('Group ID is required');

  const group = await prisma.group.findUnique({ where: { id } });
  if (!group) throw new Error(`Group with ID ${id} not found`);

  return await prisma.group.delete({
    where: { id },
  });
};

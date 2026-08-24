// -*- coding: utf-8 -*-
import { prisma } from '#lib/prisma.js';

export const getGroupService = async (id: number) => {
  if (!id) throw new Error('Group ID is required');

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      parent: true,
      children: {
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, role: true, avatar: true, avatarColor: true },
              },
            },
          },
        },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true, avatar: true, avatarColor: true },
          },
        },
      },
    },
  });

  if (!group) throw new Error(`Group with ID ${id} not found`);
  return group;
};

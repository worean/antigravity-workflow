import type { Project, User } from '@/types';

/**
 * 선택된 프로젝트의 등록된 인원(프로젝트 Owner 및 멤버 Users)만 추출하여 반환합니다.
 * 프로젝트가 선택되지 않았거나(전체보기) 멤버 정보가 없으면 fallbackUsers(전체 유저 목록)를 반환합니다.
 */
export const getProjectMembers = (project?: Project | null, fallbackUsers: User[] = []): User[] => {
  if (!project) {
    return fallbackUsers;
  }

  const userMap = new Map<number, User>();

  // 1. 프로젝트 Owner (소유자) 추가
  if (project.owner) {
    userMap.set(project.owner.id, project.owner);
  } else if (project.ownerId) {
    const ownerUser = fallbackUsers.find((u) => u.id === project.ownerId);
    if (ownerUser) {
      userMap.set(ownerUser.id, ownerUser);
    }
  }

  // 2. 프로젝트 Members (멤버) 추가
  if (project.members && Array.isArray(project.members)) {
    project.members.forEach((member) => {
      if (member.user) {
        userMap.set(member.user.id, member.user);
      } else if (member.userId) {
        const memberUser = fallbackUsers.find((u) => u.id === member.userId);
        if (memberUser) {
          userMap.set(memberUser.id, memberUser);
        }
      }
    });
  }

  // 멤버가 아무도 없는 예외의 경우 전체 유저 목록 반환
  if (userMap.size === 0) {
    return fallbackUsers;
  }

  return Array.from(userMap.values());
};

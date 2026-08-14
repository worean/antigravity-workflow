import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '#lib/prisma.js';
import { createIssueService } from '../modules/issues/services/createIssue.service.js';
import { updateIssueService } from '../modules/issues/services/updateIssue.service.ts';

describe('Issue Schedule Dates Service Tests', () => {
  let testUser: any;
  let testProject: any;

  beforeEach(async () => {
    testUser = await prisma.user.create({
      data: {
        email: `test_dates_${Date.now()}@example.com`,
        name: 'Date Tester'
      }
    });

    testProject = await prisma.project.create({
      data: {
        name: 'Date Test Project',
        key: `DATEPRJ_${Date.now()}`,
        ownerId: testUser.id
      }
    });
  });

  it('should create issue with schedule dates without time components (00:00:00.000Z)', async () => {
    const issueData = {
      title: 'Schedule Test Issue',
      projectId: testProject.id,
      plannedStartDate: '2026-09-01T15:30:45.123Z', // Time should be stripped
      dueDate: '2026-09-10',
      actualStartDate: '2026-09-02',
      actualEndDate: '2026-09-09'
    };

    const created = await createIssueService(issueData, testUser.id);

    expect(created.plannedStartDate).not.toBeNull();
    expect(created.dueDate).not.toBeNull();
    expect(created.actualStartDate).not.toBeNull();
    expect(created.actualEndDate).not.toBeNull();

    // Verify time components are zeroed out in UTC ISO format
    const plannedISO = new Date(created.plannedStartDate!).toISOString();
    const dueISO = new Date(created.dueDate!).toISOString();

    expect(plannedISO).toBe('2026-09-01T00:00:00.000Z');
    expect(dueISO).toBe('2026-09-10T00:00:00.000Z');
  });

  it('should update schedule dates and strip time components', async () => {
    const created = await createIssueService({
      title: 'Update Schedule Issue',
      projectId: testProject.id
    }, testUser.id);

    const updated = await updateIssueService(created.id, {
      userId: testUser.id,
      plannedStartDate: '2026-10-01',
      dueDate: '2026-10-15T23:59:59.999Z'
    });

    expect(new Date(updated.plannedStartDate!).toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(new Date(updated.dueDate!).toISOString()).toBe('2026-10-15T00:00:00.000Z');
  });
});

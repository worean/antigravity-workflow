// -*- coding: utf-8 -*-
/**
 * 🧪 [Domain: comments / Service: createReply]
 * - 기능: 특정 상위 댓글에 대한 대댓글(Child Comment) 작성 기능 단위 및 API 테스트
 * - 경우의 수: 
 *   1) 상위 댓글 존재 시 parentId를 포함한 대댓글 성공 생성 (201 Created)
 *   2) 반환된 대댓글 객체에 author 및 parentId 관계 정상 포함 검증
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';

describe('🧪 [comments.createReply] Service & REST API Unit Tests', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';

  describe('Case 1: 💬 댓글의 대댓글(Reply) 작성 기능', () => {
    it('상위 댓글의 parentId를 지칭하여 대댓글을 작성하면 201 상태와 함께 parentId가 포함된 대댓글 객체가 반환되어야 한다', async () => {
      // 1. 유저 준비
      let user = await prisma.user.findFirst();
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: `reply_tester_${Date.now()}@example.com`,
            name: 'Reply Tester',
            password: 'pwd',
          },
        });
      }

      const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret);

      // 2. 프로젝트 및 이슈 준비
      let project = await prisma.project.findFirst();
      if (!project) {
        project = await prisma.project.create({
          data: {
            name: 'Reply Project',
            key: `RPL_${Date.now()}`,
            ownerId: user.id,
          },
        });
      }

      const issue = await prisma.issue.create({
        data: {
          title: 'Reply Issue Test',
          projectId: project.id,
          authorId: user.id,
        },
      });

      // 3. 상위 댓글 생성
      const parentComment = await prisma.comment.create({
        data: {
          content: '상위 루트 댓글입니다.',
          issueId: issue.id,
          authorId: user.id,
        },
      });

      // 4. 대댓글 API 요청
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          issueId: issue.id,
          content: '상위 댓글에 달리는 대댓글입니다.',
          parentId: parentComment.id,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.content).toBe('상위 댓글에 달리는 대댓글입니다.');
      expect(response.body.parentId).toBe(parentComment.id);
      expect(response.body).toHaveProperty('author');
      expect(response.body.author.id).toBe(user.id);
    });
  });
});

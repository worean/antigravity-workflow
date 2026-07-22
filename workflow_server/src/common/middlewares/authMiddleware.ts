import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '#lib/prisma.js';

/**
 * 🔒 보안 강화된 JWT 전용 인증 미들웨어
 * (경고: req.body.userId 우회 차단, 오직 암호화 서명 검증된 JWT 토큰 내부 payload.userId로만 유저 인식)
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      token = req.body?.token || req.body?.accessToken || req.body?.authToken || req.body?.auth?.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Authentication token is required' });
    }

    // 🔑 JWT 암호 서명 검증 (외부 조작 및 위변조 불가)
    const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
    let decoded: { userId: number; email: string } | null = null;

    try {
      decoded = jwt.verify(token, jwtSecret) as { userId: number; email: string };
    } catch {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token payload' });
    }

    // 토큰 내 검증된 userId로만 DB 유저 조회
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User associated with token not found' });
    }

    req.user = user;

    // 🔑 서버 토큰 정상 인증 확인 콘솔 출력 로그
    console.log(`\n==================================================`);
    console.log(`🔑 [JWT Auth Verified] ${req.method} ${req.originalUrl}`);
    console.log(`👤 User: ${user.name} <${user.email}> (ID: ${user.id})`);
    console.log(`⏰ Time: ${new Date().toISOString()}`);
    console.log(`==================================================\n`);

    next();
  } catch (error: any) {
    res.status(401).json({ error: 'Unauthorized', details: error.message });
  }
};

/**
 * 🔓 보안 강화된 선택적 JWT 인증 미들웨어
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) token = req.body?.token || req.body?.accessToken || req.body?.auth?.token;

    if (token) {
      const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
      try {
        const decoded = jwt.verify(token, jwtSecret) as { userId: number };
        if (decoded && decoded.userId) {
          const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
          if (user) req.user = user;
        }
      } catch {
        // 유효하지 않은 토큰 시 비로그인으로 처리
      }
    }
  } catch {
    // optional
  }
  next();
};

/**
 * 🛡️ 프로젝트 단위 역할(Role) 권한 검증 미들웨어
 */
export const requireProjectRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = req.user;
      if (!currentUser) return res.status(401).json({ error: 'Unauthorized: Login required' });

      const projectId = Number(req.params.projectId || req.body.projectId || req.query.projectId || req.params.id);
      if (!projectId) return res.status(400).json({ error: 'projectId is required for permission check' });

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: { where: { userId: currentUser.id } } }
      });

      if (!project) return res.status(404).json({ error: 'Project not found' });

      if (project.ownerId === currentUser.id) {
        req.projectRole = 'ADMIN';
        return next();
      }

      const member = project.members[0];
      if (!member || !allowedRoles.includes(member.role)) {
        return res.status(403).json({ error: 'Forbidden: Insufficient project permissions' });
      }

      req.projectRole = member.role;
      next();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
};

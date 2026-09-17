import { Request, Response } from 'express';
import { registerService } from './services/register.service.js';
import { verifyEmailService } from './services/verifyEmail.service.js';
import { verifyEmailLinkService } from './services/verifyEmailLink.service.js';
import { resendVerificationService } from './services/resendVerification.service.js';
import { emailLoginService } from './services/emailLogin.service.js';
import { googleLoginService } from './services/googleLogin.service.js';
import { googleCallbackService } from './services/googleCallback.service.js';
import { getMeService } from './services/getMe.service.js';

export const register = async (req: Request, res: Response) => {
  try {
    const result = await registerService(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const result = await verifyEmailService(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const verifyEmailLink = async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    const result = await verifyEmailLinkService(token);
    const clientBaseUrl = process.env.CLIENT_BASE_URL || 'http://localhost:5173';
    const redirectUrl = `${clientBaseUrl}/auth/verified?token=${encodeURIComponent(
      result.token
    )}&user=${encodeURIComponent(JSON.stringify(result.user))}`;
    res.redirect(redirectUrl);
  } catch (error: any) {
    const clientBaseUrl = process.env.CLIENT_BASE_URL || 'http://localhost:5173';
    res.redirect(`${clientBaseUrl}/auth/verified?error=${encodeURIComponent(error.message)}`);
  }
};

export const resendVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const result = await resendVerificationService(email);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const emailLogin = async (req: Request, res: Response) => {
  try {
    const result = await emailLoginService(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body;
    const result = await googleLoginService(accessToken);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const googleCallback = async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    if (!code) {
      return res.redirect('http://localhost:5173/?error=no_code');
    }
    const result = await googleCallbackService(code);
    const redirectTarget = `http://localhost:5173/?token=${encodeURIComponent(
      result.token
    )}&user=${encodeURIComponent(JSON.stringify(result.user))}`;
    res.redirect(redirectTarget);
  } catch (error: any) {
    res.redirect(`http://localhost:5173/?error=${encodeURIComponent(error.message)}`);
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const user = await getMeService(req.user.id);
    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

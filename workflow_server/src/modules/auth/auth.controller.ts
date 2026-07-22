import { Request, Response } from 'express';
import { googleLoginService } from './services/googleLogin.service.js';
import { googleCallbackService } from './services/googleCallback.service.js';
import { emailLoginService } from './services/emailLogin.service.js';

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
      return res.redirect('http://localhost:3000/?error=no_code');
    }
    const result = await googleCallbackService(code);
    const redirectTarget = `http://localhost:3000/?token=${encodeURIComponent(
      result.token
    )}&user=${encodeURIComponent(JSON.stringify(result.user))}`;
    res.redirect(redirectTarget);
  } catch (error: any) {
    res.redirect(`http://localhost:3000/?error=${encodeURIComponent(error.message)}`);
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

export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    res.json({ user: req.user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

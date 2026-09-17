import { Request, Response } from 'express';
import { processChatCompletion } from './services/chat.service.js';
import type { ChatRequestDto } from './dto/chat.dto.js';

export async function handleChat(req: Request, res: Response) {
  try {
    const { prompt, model, history } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'prompt 필드는 필수 문자열입니다.' });
    }

    const dto: ChatRequestDto = {
      prompt: prompt.trim(),
      model: typeof model === 'string' ? model.trim() : undefined,
      history: Array.isArray(history) ? history : undefined,
    };

    const userId = (req as any).userId;
    const result = await processChatCompletion(dto, userId);

    return res.json(result);
  } catch (err: any) {
    console.error('[AI Controller Error]:', err);
    return res.status(500).json({ error: 'AI 요청 처리 중 서버 내부 오류가 발생했습니다.' });
  }
}

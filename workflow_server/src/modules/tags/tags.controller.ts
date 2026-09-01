import { Request, Response } from 'express';
import { getTagsService } from './services/getTags.service.js';
import { createTagService } from './services/createTag.service.js';
import { deleteTagService } from './services/deleteTag.service.js';

export const getTagsController = async (req: Request, res: Response) => {
  try {
    const { search, limit, sortBy } = req.query;
    const tags = await getTagsService({
      search: search ? String(search) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy: (sortBy as any) || undefined,
    });
    return res.json(tags);
  } catch (err: any) {
    console.error('getTagsController error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch tags' });
  }
};

export const createTagController = async (req: Request, res: Response) => {
  try {
    const { name, color } = req.body;
    const tag = await createTagService({ name, color });
    return res.status(201).json(tag);
  } catch (err: any) {
    console.error('createTagController error:', err);
    return res.status(400).json({ error: err.message || 'Failed to create tag' });
  }
};

export const deleteTagController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteTagService(Number(id));
    return res.json({ message: 'Tag deleted successfully' });
  } catch (err: any) {
    console.error('deleteTagController error:', err);
    return res.status(400).json({ error: err.message || 'Failed to delete tag' });
  }
};

import { Router } from 'express';
import * as customFieldsController from './customFields.controller.js';

export const customFieldRouter = Router();

customFieldRouter.get('/', customFieldsController.getCustomFields);
customFieldRouter.get('/list', customFieldsController.getCustomFields);
customFieldRouter.post('/create', customFieldsController.createCustomField);
customFieldRouter.post('/', customFieldsController.createCustomField);
customFieldRouter.delete('/delete/:id', customFieldsController.deleteCustomField);
customFieldRouter.delete('/:id', customFieldsController.deleteCustomField);

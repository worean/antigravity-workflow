﻿﻿import { prisma } from '#lib/prisma.js';
import { encryptGitToken } from '../providers/gitCrypto.js';
import { getGitConfigService } from './getGitConfig.service.js';

interface UpdateGitConfigParams {
  workspaceId: number;
  isEnabled?: boolean;
  provider?: string;
  serverUrl?: string;
  token?: string;
  webhookSecret?: string;
  autoCloseIssueOnMerge?: boolean;
}

export async function updateGitConfigService(params: UpdateGitConfigParams) {
  const { workspaceId, isEnabled, provider, serverUrl, token, webhookSecret, autoCloseIssueOnMerge } = params;

  const dataToUpdate: any = {};
  if (typeof isEnabled === 'boolean') dataToUpdate.isEnabled = isEnabled;
  if (provider) dataToUpdate.provider = provider.toUpperCase();
  if (serverUrl !== undefined) dataToUpdate.serverUrl = serverUrl;
  if (webhookSecret !== undefined) dataToUpdate.webhookSecret = webhookSecret;
  if (typeof autoCloseIssueOnMerge === 'boolean') dataToUpdate.autoCloseIssueOnMerge = autoCloseIssueOnMerge;
  if (token && token.trim() !== '') {
    dataToUpdate.encryptedToken = encryptGitToken(token.trim());
  }

  await prisma.gitPluginConfig.upsert({
    where: { workspaceId },
    update: dataToUpdate,
    create: {
      workspaceId,
      isEnabled: isEnabled ?? false,
      provider: provider ? provider.toUpperCase() : 'GITHUB',
      serverUrl: serverUrl || 'https://api.github.com',
      encryptedToken: token ? encryptGitToken(token.trim()) : null,
      webhookSecret: webhookSecret || null,
      autoCloseIssueOnMerge: autoCloseIssueOnMerge ?? true,
    },
  });

  return getGitConfigService(workspaceId);
}

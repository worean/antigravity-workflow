﻿import { prisma } from '#lib/prisma.js';
import { decryptGitToken, maskGitToken } from '../providers/gitCrypto.js';

export async function getGitConfigService(workspaceId: number) {
  let config = await prisma.gitPluginConfig.findUnique({
    where: { workspaceId },
  });

  if (!config) {
    config = await prisma.gitPluginConfig.create({
      data: {
        workspaceId,
        isEnabled: false,
        provider: 'GITHUB',
        serverUrl: 'https://api.github.com',
        autoCloseIssueOnMerge: true,
      },
    });
  }

  const plainToken = config.encryptedToken ? decryptGitToken(config.encryptedToken) : '';
  const maskedToken = maskGitToken(plainToken);
  const serverHost = process.env.APP_URL || `http://localhost:${process.env.PORT || 4000}`;
  const webhookUrl = `${serverHost}/api/plugins/git/webhook?ws=${workspaceId}`;

  return {
    id: config.id,
    workspaceId: config.workspaceId,
    isEnabled: config.isEnabled,
    provider: config.provider,
    serverUrl: config.serverUrl,
    hasToken: Boolean(config.encryptedToken),
    maskedToken,
    autoCloseIssueOnMerge: config.autoCloseIssueOnMerge,
    webhookSecret: config.webhookSecret || '',
    webhookUrl,
  };
}

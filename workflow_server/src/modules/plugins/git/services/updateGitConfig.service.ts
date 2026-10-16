import { prisma } from '#lib/prisma.js';
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
  if (provider) {
    const provUpper = provider.toUpperCase();
    dataToUpdate.provider = provUpper;
    if (provUpper === 'GITHUB') {
      if (!serverUrl || serverUrl.trim() === '' || serverUrl.includes('github.com')) {
        dataToUpdate.serverUrl = null;
      } else {
        dataToUpdate.serverUrl = serverUrl.trim();
      }
    } else if (serverUrl !== undefined) {
      dataToUpdate.serverUrl = serverUrl.trim() || null;
    }
  } else if (serverUrl !== undefined) {
    dataToUpdate.serverUrl = serverUrl.trim() || null;
  }
  if (webhookSecret !== undefined) dataToUpdate.webhookSecret = webhookSecret;
  if (typeof autoCloseIssueOnMerge === 'boolean') dataToUpdate.autoCloseIssueOnMerge = autoCloseIssueOnMerge;
  if (token && token.trim() !== '' && token !== '__SAVED_TOKEN__' && !token.includes('************')) {
    dataToUpdate.encryptedToken = encryptGitToken(token.trim());
  }

  const initialToken = token && token !== '__SAVED_TOKEN__' && !token.includes('************')
    ? encryptGitToken(token.trim())
    : null;

  await prisma.gitPluginConfig.upsert({
    where: { workspaceId },
    update: dataToUpdate,
    create: {
      workspaceId,
      isEnabled: isEnabled ?? false,
      provider: provider ? provider.toUpperCase() : 'GITHUB',
      serverUrl: serverUrl || 'https://api.github.com',
      encryptedToken: initialToken,
      webhookSecret: webhookSecret || null,
      autoCloseIssueOnMerge: autoCloseIssueOnMerge ?? true,
    },
  });

  return getGitConfigService(workspaceId);
}

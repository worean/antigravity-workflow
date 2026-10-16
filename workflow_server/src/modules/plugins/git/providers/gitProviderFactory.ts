import { IGitProvider } from './IGitProvider.js';
import { GitHubProvider } from './GitHubProvider.js';
import { GitLabProvider } from './GitLabProvider.js';

const githubProvider = new GitHubProvider();
const gitlabProvider = new GitLabProvider();

export function getGitProvider(provider: string = 'GITHUB'): IGitProvider {
  if (provider.toUpperCase() === 'GITLAB') {
    return gitlabProvider;
  }
  return githubProvider;
}

export const gitProviderFactory = {
  getProvider: getGitProvider,
};

import { extensionRegistry } from '@/extensions/ExtensionRegistry';
import { GitProjectActionExtension } from './GitProjectActionExtension';
import { GitProjectBadgeExtension } from './GitProjectBadgeExtension';
import { GitIssueDetailSectionExtension } from './GitIssueDetailSectionExtension';

let isRegistered = false;

/**
 * 🚀 Git 플러그인의 UI 확장 기능들을 ExtensionRegistry에 등록
 */
export function registerGitExtensions(): void {
  if (isRegistered) return;

  extensionRegistry.register(new GitProjectActionExtension());
  extensionRegistry.register(new GitProjectBadgeExtension());
  extensionRegistry.register(new GitIssueDetailSectionExtension());

  isRegistered = true;
  console.log('🔌 [ExtensionRegistry] Git Plugin extensions registered successfully.');
}

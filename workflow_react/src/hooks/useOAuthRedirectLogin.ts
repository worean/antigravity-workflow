import { useEffect } from 'react';

/**
 * OAuth / Email Magic Link 리다이렉트(?token=...&user=...) 처리 훅 (App.tsx 에서 분리)
 */
export function useOAuthRedirectLogin(
  loginWithTokenAndUser: (token: string, user: any) => void
): void {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirectToken = params.get('token');
    const redirectUserStr = params.get('user');

    if (redirectToken && redirectUserStr) {
      try {
        const redirectUser = JSON.parse(decodeURIComponent(redirectUserStr));
        loginWithTokenAndUser(redirectToken, redirectUser);
        window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
      } catch (err) {
        console.error('Failed to parse redirect user info:', err);
      }
    }
  }, [loginWithTokenAndUser]);
}


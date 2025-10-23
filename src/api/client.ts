import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { Observable } from '@apollo/client/utilities';
import { getAccessToken, getRefreshToken, setAuthToken, getUser } from '../utils/auth';
import { REFRESH_TOKEN } from '../api/mutations';

import { ENDPOINT } from '../api/environment';

const httpLink = createHttpLink({
  uri: `${ENDPOINT}`,
});

// Add the JWT token to the headers
const authLink = setContext((_, { headers }) => {
  const token = getAccessToken();
  const authHeaders = {
    ...headers,
    authorization: token ? `Bearer ${token}` : '',
  };
  console.log('Auth Headers being sent:', authHeaders);
  return {
    headers: authHeaders,
  };
});

// Error handling and token refresh logic
const errorLink = new ApolloLink((operation, forward) => {
  // Prevent infinite refresh loops
  const triedRefresh = operation.getContext().triedRefresh === true;

  // Helper to attempt refresh and retry the original operation
  const attemptRefreshAndRetry = (observer: any) => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      console.log('No refresh token available, redirecting to login');
      // Clear any stale tokens to stop repeated invalid attempts
      try { setAuthToken('', '', null as any); } catch {}
      window.location.href = '/login';
      observer.complete();
      return;
    }

    console.log('Attempting to refresh token with:', refreshToken);
    const refreshClient = new ApolloClient({
      link: httpLink,
      cache: new InMemoryCache(),
    });

    refreshClient
      .mutate({
        mutation: REFRESH_TOKEN,
        variables: { refreshToken },
      })
      .then(({ data }) => {
        console.log('Refresh token response:', data);
        if (data?.refreshToken?.accessToken) {
          console.log('Token refreshed successfully, new accessToken:', data.refreshToken.accessToken);
          setAuthToken(data.refreshToken.accessToken, refreshToken, getUser());

          // Force a small delay to ensure localStorage update is reflected
          setTimeout(() => {
            const newHeaders = {
              ...operation.getContext().headers,
              authorization: `Bearer ${data.refreshToken.accessToken}`,
            };
            console.log('Retry headers:', newHeaders);
            operation.setContext({ headers: newHeaders, triedRefresh: true });

            // Retry the original request
            const retrySub = forward(operation).subscribe({
              next: (retryResult) => {
                console.log('Retry result:', retryResult);
                observer.next(retryResult);
              },
              error: (retryError) => {
                console.error('Retry failed:', retryError);
                console.error('Retry error details:', retryError.networkError?.result);
                window.location.href = '/login';
                observer.complete();
              },
              complete: () => observer.complete(),
            });

            return () => retrySub.unsubscribe();
          }, 100); // Small delay to ensure storage sync
        } else {
          console.log('No accessToken in refresh response, redirecting to login');
          try { setAuthToken('', '', null as any); } catch {}
          window.location.href = '/login';
          observer.complete();
        }
      })
      .catch((error) => {
        console.error('Token refresh failed:', error);
        console.error('Refresh error details:', error.networkError?.result);
        try { setAuthToken('', '', null as any); } catch {}
        window.location.href = '/login';
        observer.complete();
      });
  };

  return new Observable((observer) => {
    const sub = forward(operation).subscribe({
      next: (result) => {
        const hasAuthError = !!(
          result?.errors &&
          result.errors.some(
            (err: any) => {
              const msg = err?.message || '';
              return (
                msg === 'Not authenticated' ||
                msg === 'User is not authenticated' ||
                msg.includes('Invalid token') ||
                msg.includes('Token expired') ||
                msg.includes('JWT token is invalid or expired') ||
                msg.includes('Authentication credentials were not provided') ||
                msg.includes('Signature has expired') ||
                msg.includes('No Authorization header provided') ||
                msg.includes('Invalid Authorization header format') ||
                msg.includes('User not found') ||
                msg.includes('Authentication error')
              );
            }
          )
        );

        if (hasAuthError) {
          if (triedRefresh) {
            // Already tried refresh once for this operation; avoid looping
            try { setAuthToken('', '', null as any); } catch {}
            window.location.href = '/login';
            observer.complete();
            return;
          }
          attemptRefreshAndRetry(observer);
        } else {
          observer.next(result);
        }
      },
      error: (err) => {
        console.error('GraphQL Error:', err);
        console.error('Error details:', err?.networkError);

        // Handle network 401/unauthorized or similar auth-related failures
        const statusCode = (err?.networkError as any)?.statusCode || (err?.networkError as any)?.status;
        const isUnauthorized = statusCode === 401 || statusCode === 403;

        // Some servers include GraphQL errors inside networkError.result
        const networkErrors: any[] = (err?.networkError as any)?.result?.errors || [];
        const networkHasAuthError = networkErrors.some((e: any) => {
          const msg = e?.message || '';
          return (
            msg === 'Not authenticated' ||
            msg === 'User is not authenticated' ||
            msg.includes('Invalid token') ||
            msg.includes('Token expired') ||
            msg.includes('JWT token is invalid or expired') ||
            msg.includes('Authentication credentials were not provided') ||
            msg.includes('Signature has expired') ||
            msg.includes('No Authorization header provided') ||
            msg.includes('Invalid Authorization header format') ||
            msg.includes('User not found') ||
            msg.includes('Authentication error')
          );
        });

        if (isUnauthorized || networkHasAuthError) {
          if (triedRefresh) {
            try { setAuthToken('', '', null as any); } catch {}
            window.location.href = '/login';
            observer.complete();
            return;
          }
          attemptRefreshAndRetry(observer);
        } else {
          observer.error(err);
        }
      },
      complete: () => observer.complete(),
    });

    return () => sub.unsubscribe();
  });
});

const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});

export default client;
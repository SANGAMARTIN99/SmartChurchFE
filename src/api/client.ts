import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { Observable } from '@apollo/client/utilities';
import { getAccessToken, getRefreshToken, setAuthToken, getUser } from '../utils/auth';
import { REFRESH_TOKEN } from '../api/mutations';

import { ENDPOINT } from '../api/environment';

const httpLink = createHttpLink({
  uri: `${ENDPOINT}/graphql/`,
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
  return new Observable((observer) => {
    const sub = forward(operation).subscribe({
      next: (result) => {
        if (result.errors && result.errors.some((err) => err.message === 'Not authenticated' || err.message.includes('Invalid token') || err.message.includes('Token expired'))) {
          const refreshToken = getRefreshToken();

          if (!refreshToken) {
            console.log('No refresh token available, redirecting to login');
            window.location.href = '/login';
            observer.complete();
            return;
          }

          console.log('Attempting to refresh token with:', refreshToken);
          const refreshClient = new ApolloClient({
            link: httpLink,
            cache: new InMemoryCache(),
          });

          refreshClient.mutate({
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
                  operation.setContext({ headers: newHeaders });

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
                }, 100);  // Small delay to ensure storage sync
              } else {
                console.log('No accessToken in refresh response, redirecting to login');
                window.location.href = '/login';
                observer.complete();
              }
            })
            .catch((error) => {
              console.error('Token refresh failed:', error);
              console.error('Refresh error details:', error.networkError?.result);
              window.location.href = '/login';
              observer.complete();
            });
        } else {
          observer.next(result);
        }
      },
      error: (err) => {
        console.error('GraphQL Error:', err);
        console.error('Error details:', err.networkError?.result);
        observer.error(err);
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
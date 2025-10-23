import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink, from, Observable } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { getAccessToken, getRefreshToken, setAuthToken, getUser } from '../utils/auth';
import { REFRESH_TOKEN } from '../api/mutations';
import { ENDPOINT } from '../api/environment';

// HTTP link
const httpLink = createHttpLink({
  uri: `${ENDPOINT}`,
});

// Auth link: adds token only if present
const authLink = setContext(( _, { headers }) => {
  const token = getAccessToken();
  const authHeaders = { ...headers };

  if (token) {
    authHeaders.authorization = `Bearer ${token}`;
  } else {
    delete authHeaders.authorization; // ensure no empty header
  }

  return { headers: authHeaders };
});

// Error link: handles auth errors and token refresh
const errorLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    let triedRefresh = false;

    const handleResponse = (result: any) => {
      const authErrors = result?.errors?.some((err: any) => {
        const msg = err?.message || '';
        return (
          msg.includes('Not authenticated') ||
          msg.includes('Invalid token') ||
          msg.includes('Token expired') ||
          msg.includes('JWT token is invalid') ||
          msg.includes('Authentication credentials were not provided')
        );
      });

      if (authErrors && !triedRefresh) {
        triedRefresh = true;
        const refreshToken = getRefreshToken();

        if (!refreshToken) {
          setAuthToken('', '', null as any);
          window.location.href = '/login';
          observer.complete();
          return;
        }

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
            const newAccessToken = data?.refreshToken?.accessToken;
            if (newAccessToken) {
              setAuthToken(newAccessToken, refreshToken, getUser());
              operation.setContext({
                headers: {
                  ...operation.getContext().headers,
                  authorization: `Bearer ${newAccessToken}`,
                },
              });
              forward(operation).subscribe(observer);
            } else {
              setAuthToken('', '', null as any);
              window.location.href = '/login';
              observer.complete();
            }
          })
          .catch(() => {
            setAuthToken('', '', null as any);
            window.location.href = '/login';
            observer.complete();
          });
      } else {
        observer.next(result);
        observer.complete();
      }
    };

    forward(operation).subscribe({
      next: handleResponse,
      error: (err) => observer.error(err),
      complete: () => observer.complete(),
    });
  });
});

// Create Apollo client
const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});

export default client;

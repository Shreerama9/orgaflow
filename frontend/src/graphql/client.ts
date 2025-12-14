
import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// GraphQL API endpoint
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/graphql/';

// HTTP link for queries and mutations
const httpLink = createHttpLink({
  uri: API_URL,
});

// Auth link to inject JWT token into headers
const authLink = setContext((_, { headers }) => {
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Create Apollo Client instance
export const apolloClient = new ApolloClient({
  link: ApolloLink.from([authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Merge projects by ID for proper cache updates
          projects: {
            merge(_existing = [], incoming) {
              return incoming;
            },
          },
          // Merge tasks by ID
          tasks: {
            merge(_existing = [], incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

// Helper to set auth token
export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

// Helper to clear auth
export const clearAuth = () => {
  localStorage.removeItem('token');
  apolloClient.clearStore();
};

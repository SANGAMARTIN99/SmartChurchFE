// queries.ts
import { gql } from '@apollo/client';

export const GET_STREETS_AND_GROUPS = gql`
  query {
    streets {
      id
      name
    }
    groups {
      id
      name
    }
  }
`;
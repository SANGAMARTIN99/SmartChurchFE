import { gql } from "@apollo/client";

export const REFRESH_TOKEN = gql`
mutation RefreshToken($refreshToken: String!) {
  refreshToken(refreshToken: $refreshToken) {
    accessToken
  }
}
`;

export const LOGIN_USER = gql`
  mutation LoginUser($email: String!, $password: String!) {
    loginUser(input: { email: $email, password: $password }) {
      token
      member {
        id
        fullName
        email
      }
    }
  }
`;

export const REGISTER_USER = gql`
  mutation RegisterUser(
    $fullName: String!
    $email: String!
    $phoneNumber: String
    $streetId: Int!
    $password: String!
    $groupIds: [Int!]
  ) {
    registerUser(
      input: {
        fullName: $fullName
        email: $email
        phoneNumber: $phoneNumber
        streetId: $streetId
        password: $password
        groupIds: $groupIds
      }
    ) {
      member {
        id
        fullName
        email
      }
    }
  }
`;

export const FORGOT_PASSWORD = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(input: { email: $email }) {
      success
      message
    }
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($token: String!, $password: String!) {
    resetPassword(token: $token, password: $password) {
      success
      message
    }
  }
`;
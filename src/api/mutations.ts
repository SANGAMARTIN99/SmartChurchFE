import { gql } from "@apollo/client";

export const REFRESH_TOKEN = gql`
mutation RefreshToken($refreshToken: String!) {
  refreshToken(refreshToken: $refreshToken) {
    accessToken
  }
}
`;

export const LOGIN_USER = gql`
  mutation LoginUser($input: LoginInput!) {
    loginUser(input: $input) {
      accessToken
      refreshToken
      member {
        id
        fullName
        email
        role
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



export const CREATE_EVENT = gql`
  mutation CreateEvent($input: EventInput!) {
    createEvent(input: $input) {
      event {
        id
        title
        date
        time
        location
        description
      }
    }
  }
`;

export const DELETE_EVENT = gql`
  mutation DeleteEvent($id: String!) {
    deleteEvent(id: $id) {
      success
    }
  }
`;

export const CREATE_PRAYER_REQUEST = gql`
  mutation CreatePrayerRequest($input: PrayerRequestInput!) {
    createPrayerRequest(input: $input) {
      prayerRequest {
        id
        member
        request
        date
        status
      }
    }
  }
`;

export const UPDATE_PRAYER_REQUEST_STATUS = gql`
  mutation UpdatePrayerRequestStatus($input: UpdatePrayerRequestStatusInput!) {
    updatePrayerRequestStatus(input: $input) {
      prayerRequest {
        id
        member
        request
        date
        status
      }
    }
  }
`;

export const CREATE_DEVOTIONAL = gql`
  mutation CreateDevotional($input: DevotionalInput!) {
    createDevotional(input: $input) {
      devotional {
        id
        title
        content
        scripture
        publishedAt
        author {
          fullName
        }
        imageUrl
        audioUrl
        videoUrl
      }
    }
  }
`;

export const UPDATE_DEVOTIONAL = gql`
  mutation UpdateDevotional($id: String!, $input: DevotionalInput!) {
    updateDevotional(id: $id, input: $input) {
      devotional {
        id
        title
        content
        scripture
        publishedAt
        author {
          fullName
        }
        imageUrl
        audioUrl
        videoUrl
      }
    }
  }
`;

export const DELETE_DEVOTIONAL = gql`
  mutation DeleteDevotional($id: String!) {
    deleteDevotional(id: $id) {
      success
    }
  }
`;


export const CREATE_ANNOUNCEMENT = gql`
  mutation CreateAnnouncement($input: CreateAnnouncementInput!) {
    createAnnouncement(input: $input) {
      announcement {
        id
        title
        content
        category
        isPinned
        targetGroup {
          id
          name
        }
        eventDate
        eventTime
        location
        createdBy {
          id
          fullName
        }
        createdAt
        rsvpCount
      }
      success
      message
    }
  }
`;

export const UPDATE_ANNOUNCEMENT = gql`
  mutation UpdateAnnouncement($id: String!, $input: UpdateAnnouncementInput!) {
    updateAnnouncement(id: $id, input: $input) {
      announcement {
        id
        title
        content
        category
        isPinned
        targetGroup {
          id
          name
        }
        eventDate
        eventTime
        location
        createdBy {
          id
          fullName
        }
        createdAt
        rsvpCount
      }
      success
      message
    }
  }
`;

export const DELETE_ANNOUNCEMENT = gql`
  mutation DeleteAnnouncement($id: String!) {
    deleteAnnouncement(id: $id) {
      success
      message
    }
  }
`;
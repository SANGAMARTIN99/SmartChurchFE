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
        publishedAt: publishedAt
        author {
          fullName: fullName
        }
        imageUrl: imageUrl
        audioUrl: audioUrl
        videoUrl: videoUrl
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
        publishedAt: publishedAt
        author {
          fullName: fullName
        }
        imageUrl: imageUrl
        audioUrl: audioUrl
        videoUrl: videoUrl
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
  mutation UpdateAnnouncement($input: UpdateAnnouncementInput!) {
    updateAnnouncement(input: $input) {
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
  mutation DeleteAnnouncement($input: DeleteAnnouncementInput!) {
    deleteAnnouncement(input: $input) {
      success
      message
    }
  }
`;

// Prayer interactions
export const CREATE_PRAYER_REPLY = gql`
  mutation CreatePrayerReply($input: PrayerReplyInput!) {
    createPrayerReply(input: $input) {
      prayerRequest {
        id
        member
        request
        date
        status
        replies {
          responder
          message
          date
        }
      }
    }
  }
`;

export const MARK_PRAYER_AS_PRAYED = gql`
  mutation MarkPrayerAsPrayed($input: MarkPrayerInput!) {
    markPrayerAsPrayed(input: $input) {
      prayerRequest {
        id
        status
      }
    }
  }
`;

export const MEMBER_MARK_PRAYER_ANSWERED = gql`
  mutation MemberMarkPrayerAnswered($input: MarkPrayerInput!) {
    memberMarkPrayerAnswered(input: $input) {
      prayerRequest {
        id
        status
      }
    }
  }
`;

// Secretary: Offering Cards
export const CREATE_OFFERING_CARD = gql`
  mutation CreateOfferingCard($input: CreateOfferingCardInput!) {
    createOfferingCard(input: $input) {
      ok
      cardCode
      cardId
    }
  }
`;

export const ASSIGN_CARD = gql`
  mutation AssignCard($input: AssignCardInput!) {
    assignCard(input: $input) {
      ok
      assignment {
        id
        cardCode
        fullName
        phoneNumber
        year
        pledgedAhadi
        pledgedShukrani
        pledgedMajengo
        active
      }
    }
  }
`;

export const UPDATE_ASSIGNMENT = gql`
  mutation UpdateAssignment($input: UpdateAssignmentInput!) {
    updateAssignment(input: $input) {
      ok
      assignment {
        id
        cardCode
        fullName
        phoneNumber
        year
        pledgedAhadi
        pledgedShukrani
        pledgedMajengo
        active
      }
    }
  }
`;

export const RECORD_OFFERING_ENTRY = gql`
  mutation RecordOfferingEntry($input: OfferingEntryInput!) {
    recordOfferingEntry(input: $input) {
      ok
      entry {
        id
        cardCode
        entryType
        amount
        date
      }
    }
  }
`;

export const BULK_GENERATE_CARDS = gql`
  mutation BulkGenerateCards($input: BulkGenerateCardsInput!) {
    bulkGenerateCards(input: $input) {
      ok
      created
      skipped
    }
  }
`;
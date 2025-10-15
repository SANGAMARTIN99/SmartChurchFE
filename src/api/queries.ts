// queries.ts
import { gql } from '@apollo/client';

export const ME_QUERY = gql`
  query Me {
    me {
      id
      fullName
      email
      phoneNumber
      street { id name }
      groups { id name }
      role
    }
  }
`;

export const REGISTRATION_WINDOW_STATUS = gql`
  query RegistrationWindowStatus {
    registrationWindowStatus {
      isOpen
      startAt
      endAt
    }
  }
`;

export const NUMBER_SUGGESTIONS = gql`
  query NumberSuggestions($streetId: Int!, $queryNumber: Int!, $limit: Int) {
    numberSuggestions(streetId: $streetId, queryNumber: $queryNumber, limit: $limit) {
      street
      queryNumber
      exactAvailable
      exactCode
      suggestions { street number code }
    }
  }
`;

export const GET_CARD_APPLICATIONS = gql`
  query CardApplications($status: String) {
    cardApplications(status: $status) {
      id
      fullName
      phoneNumber
      street
      preferredNumber
      note
      pledgedAhadi
      pledgedShukrani
      pledgedMajengo
      status
      createdAt
    }
  }
`;

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

// Offerings: recent list
export const GET_RECENT_OFFERINGS = gql`
  query RecentOfferings($limit: Int!) {
    recentOfferings(limit: $limit) {
      id
      date
      memberName
      street
      amount
      offeringType
      massType
      attendant
    }
  }
`;

// Offerings breakdown by mass
export const GET_OFFERINGS_BY_MASS = gql`
  query OfferingsByMass($start: String, $end: String) {
    offeringsByMass(start: $start, end: $end) {
      type
      amount
      percentage
    }
  }
`;

// Offerings breakdown by type
export const GET_OFFERINGS_BY_TYPE = gql`
  query OfferingsByType($start: String, $end: String) {
    offeringsByType(start: $start, end: $end) {
      type
      amount
      percentage
    }
  }
`;


export const GET_DASHBOARD_STATS = gql`
  query DashboardStats {
    dashboardStats {
      totalMembers
      activeGroups
      prayerRequests
      totalOfferings
      weeklyOfferings
      monthlyOfferings
      newMembersThisMonth
      newPrayerRequestsToday
    }
  }
`;

export const GET_RECENT_MEMBERS = gql`
  query RecentMembers {
    recentMembers {
      id
      fullName
      street
      joinedDate
      profilePhoto
    }
  }
`;

export const GET_UPCOMING_EVENTS = gql`
  query UpcomingEvents {
    upcomingEvents {
      id
      title
      date
      time
      location
      description
    }
  }
`;

export const GET_PRAYER_REQUESTS = gql`
  query PrayerRequests {
    prayerRequests {
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
`;

export const GET_OFFERING_STATS = gql`
  query OfferingStats {
    offeringStats {
      thisWeek
      lastWeek
      thisMonth
      lastMonth
      trend
    }
  }
`;

export const GET_DEVOTIONALS = gql`
  query Devotionals($limit: Int!, $offset: Int!) {
    devotionals(limit: $limit, offset: $offset) {
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
      amenCount: amenCount
    }
  }
`;

export const GET_MY_DEVOTIONAL_INTERACTION = gql`
  query MyDevotionalInteraction($devotionalId: String!) {
    myDevotionalInteraction(devotionalId: $devotionalId) {
      bookmarked
      amened
      journal
    }
  }
`;

export const TOGGLE_BOOKMARK = gql`
  mutation ToggleBookmark($devotionalId: String!) {
    toggleBookmark(devotionalId: $devotionalId) {
      bookmarked
    }
  }
`;

export const TOGGLE_AMEN = gql`
  mutation ToggleAmen($devotionalId: String!) {
    toggleAmen(devotionalId: $devotionalId) {
      amened
      amenCount
    }
  }
`;

export const SAVE_JOURNAL = gql`
  mutation SaveJournal($devotionalId: String!, $text: String!) {
    saveJournal(devotionalId: $devotionalId, text: $text) {
      journal
    }
  }
`;


export const GET_ANNOUNCEMENTS = gql`
  query Announcements {
    announcements {
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
    }
  }
`;

// Groups query for Groups Management page
export const GET_GROUPS = gql`
  query Groups {
    groups {
      id
      name
      description
      category
      leader {
        id
        fullName
        email
        phone
      }
      meetingDays
      meetingTime
      location
      memberCount
      createdAt
      isActive
    }
  }
`;

// Secretary dashboard queries
export const GET_SECRETARY_DASHBOARD = gql`
  query SecretaryDashboard($taskTimeFilter: String) {
    secretaryTasks: secretaryTasks(timeFilter: $taskTimeFilter) {
      id
      title
      description
      priority
      status
      dueDate
      assignedTo
      category
    }
    memberRequests(status: "new") {
      id
      memberName
      requestType
      status
      submittedDate
      urgency
      details
    }
    secretaryQuickStats {
      title
      value
      change
      trend
    }
    secretaryActivity(limit: 10) {
      action
      user
      time
      type
    }
  }
`;

// Offering Cards
export const GET_OFFERING_CARDS = gql`
  query OfferingCards($streetId: Int, $isTaken: Boolean, $search: String) {
    offeringCards(streetId: $streetId, isTaken: $isTaken, search: $search) {
      id
      code
      street
      number
      isTaken
      assignedToName
      assignedToId
      assignedPhone
      assignedYear
      pledgedAhadi
      pledgedShukrani
      pledgedMajengo
      progressAhadi
      progressShukrani
      progressMajengo
    }
  }
`;

export const GET_AVAILABLE_CARD_NUMBERS = gql`
  query AvailableCardNumbers($streetId: Int) {
    availableCardNumbers(streetId: $streetId) {
      street
      number
      code
    }
  }
`;

export const GET_CARDS_OVERVIEW = gql`
  query CardsOverview($streetId: Int) {
    cardsOverview(streetId: $streetId) {
      totalCards
      takenCards
      freeCards
      activelyUsedCards
      leastActiveCard
      totalPledgedAhadi
      totalPledgedShukrani
      totalPledgedMajengo
      totalCollectedAhadi
      totalCollectedShukrani
      totalCollectedMajengo
    }
  }
`;

export const MY_CARD_STATE = gql`
  query MyCardState {
    myCardState {
      hasPendingApplication
      hasCurrentAssignment
    }
  }
`;
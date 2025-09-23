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
      publishedAt
      author {
        fullName
      }
      imageUrl
      audioUrl
      videoUrl
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
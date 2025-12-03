/**
 * Twitter provider types
 */

export interface TwitterCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
  bearerToken?: string;
}

export interface TwitterDM {
  id: string;
  senderId: string;
  senderUsername?: string;
  recipientId: string;
  text: string;
  createdAt: Date;
  mediaUrls?: string[];
}

export interface TwitterMention {
  id: string;
  tweetId: string;
  authorId: string;
  authorUsername: string;
  text: string;
  createdAt: Date;
  inReplyToTweetId?: string;
  mediaUrls?: string[];
}

export interface TwitterUser {
  id: string;
  username: string;
  name: string;
}

export interface SendTweetOptions {
  text: string;
  inReplyTo?: string;
  mediaIds?: string[];
  quoteTweetId?: string;
}

export interface SendDMOptions {
  recipientId: string;
  text: string;
  mediaId?: string;
}

export interface TwitterMonitorOptions {
  pollInterval?: number; // seconds
  lookbackMinutes?: number;
  lastProcessedDM?: string;
  lastProcessedMention?: string;
  onDM?: (dm: TwitterDM) => Promise<void>;
  onMention?: (mention: TwitterMention) => Promise<void>;
  verbose?: boolean;
}

export interface TwitterConfig {
  // Monitoring settings
  monitorDMs?: boolean;
  monitorMentions?: boolean;
  monitorKeywords?: string[];
  
  // Auto-reply settings
  autoReplyDMs?: boolean;
  autoReplyMentions?: boolean;
  
  // Filters
  allowedUsers?: string[]; // usernames
  blockedUsers?: string[];
  
  // Rate limiting
  maxTweetsPerHour?: number;
  maxDMsPerHour?: number;
}

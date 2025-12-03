/**
 * Twitter API client
 * Uses twitter-api-v2 for Twitter API v2 interactions
 */

import { TwitterApi } from "twitter-api-v2";
import type {
  SendDMOptions,
  SendTweetOptions,
  TwitterCredentials,
  TwitterDM,
  TwitterMention,
  TwitterUser,
} from "./types.js";

export class TwitterClient {
  private client: TwitterApi;
  private readWriteClient: TwitterApi;

  constructor(credentials: TwitterCredentials) {
    // Full auth for read-write operations
    this.client = new TwitterApi({
      appKey: credentials.apiKey,
      appSecret: credentials.apiSecret,
      accessToken: credentials.accessToken,
      accessSecret: credentials.accessSecret,
    });

    this.readWriteClient = this.client.readWrite;
  }

  /**
   * Get authenticated user info
   */
  async getMe(): Promise<TwitterUser> {
    const user = await this.readWriteClient.v2.me({
      "user.fields": ["id", "username", "name"],
    });x
    return {
      id: user.data.id,
      username: user.data.username,
      name: user.data.name,
    };
  }

  /**
   * Send a tweet
   */
  async sendTweet(options: SendTweetOptions) {
    const payload: any = {
      text: options.text,
    };

    if (options.inReplyTo) {
      payload.reply = { in_reply_to_tweet_id: options.inReplyTo };
    }

    if (options.quoteTweetId) {
      payload.quote_tweet_id = options.quoteTweetId;
    }

    if (options.mediaIds && options.mediaIds.length > 0) {
      payload.media = { media_ids: options.mediaIds };
    }

    const result = await this.readWriteClient.v2.tweet(payload);
    return result.data;
  }

  /**
   * Send a direct message
   */
  async sendDM(options: SendDMOptions) {
    const payload: any = {
      text: options.text,
    };

    if (options.mediaId) {
      payload.attachments = [{ media_id: options.mediaId }];
    }

    const result = await this.readWriteClient.v2.sendDmToParticipant(
      options.recipientId,
      payload,
    );
    return result;
  }

  /**
   * Get recent DMs
   */
  async getRecentDMs(sinceId?: string, maxResults = 20): Promise<TwitterDM[]> {
    const params: any = {
      max_results: maxResults,
      "dm_event.fields": ["id", "text", "sender_id", "created_at", "attachments"],
      expansions: ["sender_id", "attachments.media_keys"],
    };

    if (sinceId) {
      params.since_id = sinceId;
    }

    const events = await this.readWriteClient.v2.listDmEvents(params);
    const dms: TwitterDM[] = [];

    for (const event of events.events) {
      if (event.event_type === "MessageCreate") {
        dms.push({
          id: event.id,
          senderId: event.sender_id!,
          recipientId: "", // Would need to parse from conversation
          text: event.text || "",
          createdAt: new Date(event.created_at!),
          mediaUrls: event.attachments?.media_keys,
        });
      }
    }

    return dms;
  }

  /**
   * Get mentions timeline
   */
  async getMentions(
    sinceId?: string,
    maxResults = 20,
  ): Promise<TwitterMention[]> {
    const me = await this.getMe();
    const params: any = {
      max_results: maxResults,
      "tweet.fields": ["id", "text", "author_id", "created_at", "in_reply_to_user_id"],
      expansions: ["author_id", "attachments.media_keys"],
    };

    if (sinceId) {
      params.since_id = sinceId;
    }

    const mentions = await this.readWriteClient.v2.userMentionTimeline(
      me.id,
      params,
    );
    const results: TwitterMention[] = [];

    for (const tweet of mentions.data.data || []) {
      const author = mentions.includes?.users?.find((u) => u.id === tweet.author_id);
      
      results.push({
        id: tweet.id,
        tweetId: tweet.id,
        authorId: tweet.author_id!,
        authorUsername: author?.username || "unknown",
        text: tweet.text,
        createdAt: new Date(tweet.created_at!),
        inReplyToTweetId: tweet.referenced_tweets?.[0]?.id,
      });
    }

    return results;
  }

  /**
   * Upload media for tweets/DMs
   */
  async uploadMedia(filePath: string): Promise<string> {
    const mediaId = await this.readWriteClient.v1.uploadMedia(filePath);
    return mediaId;
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<TwitterUser | null> {
    try {
      const user = await this.readWriteClient.v2.userByUsername(username, {
        "user.fields": ["id", "username", "name"],
      });
      return {
        id: user.data.id,
        username: user.data.username,
        name: user.data.name,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Search recent tweets by keyword
   */
  async searchTweets(query: string, sinceId?: string, maxResults = 20) {
    const params: any = {
      query,
      max_results: maxResults,
      "tweet.fields": ["id", "text", "author_id", "created_at"],
      expansions: ["author_id"],
    };

    if (sinceId) {
      params.since_id = sinceId;
    }

    const results = await this.readWriteClient.v2.search(query, params);
    return results.data.data || [];
  }
}

/**
 * Create Twitter client from environment
 */
export function createTwitterClient(credentials: TwitterCredentials): TwitterClient {
  return new TwitterClient(credentials);
}

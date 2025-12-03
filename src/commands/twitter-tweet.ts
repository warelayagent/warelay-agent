/**
 * Twitter tweet command - post tweets, reply, quote
 */

import type { TwitterClient } from "../providers/twitter/client.js";

export interface TweetCommandOptions {
  text: string;
  replyTo?: string;
  quote?: string;
  media?: string;
  verbose?: boolean;
  dryRun?: boolean;
}

export async function tweetCommand(
  options: TweetCommandOptions,
  client: TwitterClient,
): Promise<void> {
  if (options.dryRun) {
    console.log("[dry-run] Would post tweet:");
    console.log(`  Text: ${options.text}`);
    if (options.replyTo) console.log(`  Reply to: ${options.replyTo}`);
    if (options.quote) console.log(`  Quote: ${options.quote}`);
    if (options.media) console.log(`  Media: ${options.media}`);
    return;
  }

  try {
    let mediaIds: string[] | undefined;

    // Upload media if provided
    if (options.media) {
      console.log(`📤 Uploading media: ${options.media}`);
      const mediaId = await client.uploadMedia(options.media);
      mediaIds = [mediaId];
      if (options.verbose) {
        console.log(`  Media uploaded: ${mediaId}`);
      }
    }

    // Post tweet
    console.log("📝 Posting tweet...");
    const result = await client.sendTweet({
      text: options.text,
      inReplyTo: options.replyTo,
      quoteTweetId: options.quote,
      mediaIds,
    });

    console.log(`✅ Tweet posted!`);
    console.log(`  Tweet ID: ${result.id}`);
    console.log(`  URL: https://twitter.com/i/status/${result.id}`);

    if (options.verbose) {
      console.log(`  Text: ${result.text}`);
    }
  } catch (error: any) {
    console.error("❌ Failed to post tweet:", error.message);
    throw error;
  }
}

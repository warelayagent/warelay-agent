/**
 * Twitter DM command - send direct messages
 */

import type { TwitterClient } from "../providers/twitter/client.js";

export interface TwitterDMCommandOptions {
  to: string; // username or user ID
  message: string;
  media?: string;
  verbose?: boolean;
  dryRun?: boolean;
}

export async function twitterDMCommand(
  options: TwitterDMCommandOptions,
  client: TwitterClient,
): Promise<void> {
  if (options.dryRun) {
    console.log("[dry-run] Would send DM:");
    console.log(`  To: ${options.to}`);
    console.log(`  Message: ${options.message}`);
    if (options.media) console.log(`  Media: ${options.media}`);
    return;
  }

  try {
    // Resolve username to user ID if needed
    let recipientId = options.to;
    if (!recipientId.match(/^\d+$/)) {
      // It's a username, resolve it
      const username = recipientId.startsWith("@")
        ? recipientId.substring(1)
        : recipientId;
      
      console.log(`🔍 Looking up user: @${username}`);
      const user = await client.getUserByUsername(username);
      
      if (!user) {
        throw new Error(`User not found: @${username}`);
      }
      
      recipientId = user.id;
      if (options.verbose) {
        console.log(`  Found: ${user.name} (${user.id})`);
      }
    }

    let mediaId: string | undefined;

    // Upload media if provided
    if (options.media) {
      console.log(`📤 Uploading media: ${options.media}`);
      mediaId = await client.uploadMedia(options.media);
      if (options.verbose) {
        console.log(`  Media uploaded: ${mediaId}`);
      }
    }

    // Send DM
    console.log("💌 Sending DM...");
    const result = await client.sendDM({
      recipientId,
      text: options.message,
      mediaId,
    });

    console.log(`✅ DM sent!`);
    if (options.verbose && result.dm_event_id) {
      console.log(`  Event ID: ${result.dm_event_id}`);
    }
  } catch (error: any) {
    console.error("❌ Failed to send DM:", error.message);
    throw error;
  }
}

#!/usr/bin/env node

import { TwitterApi } from 'twitter-api-v2';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
dotenv.config();

// Constants
const STORAGE_FILE = 'storage.json';
const SENSITIVE_KEYWORDS = [
  'rip', 'passed away', 'funeral', 'hospital', 'surgery', 'diagnosed', 
  'cancer', 'covid', 'tragedy', 'disaster', 'earthquake', 'flood', 
  'war', 'shooting', 'layoffs', 'politics', 'election'
];

// Initialize APIs
const twitter = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Storage functions
async function loadStorage() {
  try {
    const data = await fs.readFile(STORAGE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, create default structure
    return {
      sinceId: null,
      repliedUserIds: {},
      repliedTweetIds: new Set()
    };
  }
}

async function saveStorage(storage) {
  // Convert Set to Array for JSON serialization
  const storageToSave = {
    ...storage,
    repliedTweetIds: Array.from(storage.repliedTweetIds)
  };
  await fs.writeFile(STORAGE_FILE, JSON.stringify(storageToSave, null, 2));
}

// Utility functions
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    mode: 'b',
    ids: [],
    limit: 5,
    dry: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--mode=')) {
      config.mode = arg.split('=')[1];
    } else if (arg.startsWith('--ids=')) {
      config.ids = arg.split('=')[1].split(',').filter(id => id.trim());
    } else if (arg.startsWith('--limit=')) {
      config.limit = parseInt(arg.split('=')[1]);
    } else if (arg === '--dry') {
      config.dry = true;
    }
  }

  return config;
}

function containsSensitiveContent(text) {
  const lowerText = text.toLowerCase();
  return SENSITIVE_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

function shouldSkipTweet(tweet) {
  const text = tweet.text || '';
  
  // Skip if contains links or mentions (but allow media like GIFs/images)
  if (text.includes('http') || text.includes('@')) {
    return { skip: true, reason: 'Contains links or mentions' };
  }
  
  // Skip if contains sensitive content
  if (containsSensitiveContent(text)) {
    return { skip: true, reason: 'Contains sensitive content' };
  }
  
  return { skip: false };
}

function hasRepliedRecently(userId, repliedUserIds) {
  const lastReplied = repliedUserIds[userId];
  if (!lastReplied) return false;
  
  const hoursSince = (Date.now() - lastReplied) / (1000 * 60 * 60);
  return hoursSince < 48;
}

async function generateReply(tweetText) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',  // Using gpt-4 as gpt-5 is not yet available
      messages: [
        {
          role: 'system',
          content: `You write one-line, human replies to "gm/gn" tweets. Keep under 12 words.
Mirror language and emoji style of the original. Be warm, not salesy.
If the tweet is sensitive/negative/controversial, output exactly: SKIP.
No hashtags unless the original uses them.`
        },
        {
          role: 'user',
          content: `Reply to this tweet: "${tweetText}"`
        }
      ],
      temperature: 0.7,
      max_tokens: 40
    });

    const reply = response.choices[0]?.message?.content?.trim() || '';
    
    // Validate reply
    if (!reply || reply === 'SKIP' || reply.length > 140) {
      return null;
    }
    
    return reply;
  } catch (error) {
    console.error('Error generating reply:', error.message);
    return null;
  }
}

async function delay(min, max) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise(resolve => setTimeout(resolve, ms));
}

async function replyToTweet(tweetId, replyText, isDry = false) {
  if (isDry) {
    console.log(`[DRY RUN] Would reply to ${tweetId}: "${replyText}"`);
    return true;
  }

  try {
    await twitter.v2.reply(replyText, tweetId);
    console.log(`✅ Replied to ${tweetId}: "${replyText}"`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to reply to ${tweetId}:`, error.message);
    if (error.code >= 400) {
      console.log('Backing off for 120 seconds...');
      await delay(120000, 120000);
    }
    return false;
  }
}

async function runModeA(config, storage) {
  console.log(`🧪 Mode A: Testing with ${config.ids.length} tweet IDs`);
  
  let repliedCount = 0;
  
  for (const tweetId of config.ids) {
    if (repliedCount >= config.limit) break;
    
    try {
      // Get tweet details
      const { data: tweet } = await twitter.v2.singleTweet(tweetId, {
        'tweet.fields': ['author_id', 'text', 'attachments']
      });
      
      console.log(`📱 Found tweet ${tweetId}: "${tweet.text}"`);
      
      // Check if already replied
      if (storage.repliedTweetIds.has(tweetId)) {
        console.log(`⏭️  Already replied to ${tweetId}`);
        continue;
      }
      
      // Apply filters
      const skipResult = shouldSkipTweet(tweet);
      if (skipResult.skip) {
        console.log(`⏭️  Skipping ${tweetId}: ${skipResult.reason}`);
        continue;
      }
      
      // Generate reply
      const replyText = await generateReply(tweet.text);
      if (!replyText) {
        console.log(`⏭️  No suitable reply generated for ${tweetId}`);
        continue;
      }
      
      // Reply to tweet
      const success = await replyToTweet(tweetId, replyText, config.dry);
      if (success) {
        storage.repliedTweetIds.add(tweetId);
        storage.repliedUserIds[tweet.author_id] = Date.now();
        repliedCount++;
        
        if (!config.dry) {
          await saveStorage(storage);
        }
        
        // Add delay between replies
        if (repliedCount < config.limit) {
          await delay(5000, 20000); // 5-20 seconds
        }
      }
      
    } catch (error) {
      console.error(`❌ Error processing tweet ${tweetId}:`, error.message);
    }
  }
  
  console.log(`✅ Mode A completed. Replied to ${repliedCount} tweets.`);
}

async function runModeB(config, storage) {
  console.log('🔍 Mode B: Searching for gm/gn tweets');
  
  try {
    const searchParams = {
      query: 'gm -is:retweet -is:reply lang:en',
      max_results: Math.min(config.limit * 2, 10), // Get more to filter from
      'tweet.fields': ['author_id', 'text', 'attachments', 'lang']
    };
    
    if (storage.sinceId) {
      searchParams.since_id = storage.sinceId;
    }
    
    const { data: tweets, meta } = await twitter.v2.search(searchParams);
    
    if (!tweets || tweets.length === 0) {
      console.log('📭 No new tweets found');
      return;
    }
    
    console.log(`📱 Found ${tweets.length} tweets`);
    
    let repliedCount = 0;
    
    for (const tweet of tweets) {
      if (repliedCount >= config.limit) break;
      
      console.log(`📱 Processing tweet ${tweet.id}: "${tweet.text}"`);
      
      // Check if already replied
      if (storage.repliedTweetIds.has(tweet.id)) {
        console.log(`⏭️  Already replied to ${tweet.id}`);
        continue;
      }
      
      // Check if replied to user recently
      if (hasRepliedRecently(tweet.author_id, storage.repliedUserIds)) {
        console.log(`⏭️  Recently replied to user ${tweet.author_id}`);
        continue;
      }
      
      // Apply filters
      const skipResult = shouldSkipTweet(tweet);
      if (skipResult.skip) {
        console.log(`⏭️  Skipping ${tweet.id}: ${skipResult.reason}`);
        continue;
      }
      
      // Generate reply
      const replyText = await generateReply(tweet.text);
      if (!replyText) {
        console.log(`⏭️  No suitable reply generated for ${tweet.id}`);
        continue;
      }
      
      // Reply to tweet
      const success = await replyToTweet(tweet.id, replyText, config.dry);
      if (success) {
        storage.repliedTweetIds.add(tweet.id);
        storage.repliedUserIds[tweet.author_id] = Date.now();
        repliedCount++;
        
        if (!config.dry) {
          await saveStorage(storage);
        }
        
        // Add delay between replies
        if (repliedCount < config.limit) {
          await delay(5000, 20000); // 5-20 seconds
        }
      }
    }
    
    // Update sinceId for next run
    if (meta?.newest_id && !config.dry) {
      storage.sinceId = meta.newest_id;
      await saveStorage(storage);
    }
    
    console.log(`✅ Mode B completed. Replied to ${repliedCount} tweets.`);
    
  } catch (error) {
    console.error('❌ Error in Mode B:', error.message);
    if (error.code === 429) {
      console.log('⏰ Hit rate limit - this is normal with free tier. Try again in 15 minutes.');
    } else if (error.code === 400) {
      console.log('🔧 Search query issue - may need to adjust search parameters.');
    }
  }
}

// Main function
async function main() {
  console.log('🤖 Twitter GM/GN Bot Starting...');
  
  // Validate environment variables
  const requiredEnvVars = ['X_API_KEY', 'X_API_SECRET', 'X_ACCESS_TOKEN', 'X_ACCESS_SECRET', 'OPENAI_API_KEY'];
  const missing = requiredEnvVars.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing.join(', '));
    console.error('Please check your .env file');
    process.exit(1);
  }
  
  const config = parseArgs();
  console.log('⚙️  Configuration:', config);
  
  // Load storage
  let storage = await loadStorage();
  
  // Convert repliedTweetIds array back to Set if needed
  if (Array.isArray(storage.repliedTweetIds)) {
    storage.repliedTweetIds = new Set(storage.repliedTweetIds);
  }
  
  // Run appropriate mode
  if (config.mode === 'a') {
    if (config.ids.length === 0) {
      console.error('❌ Mode A requires --ids parameter');
      process.exit(1);
    }
    await runModeA(config, storage);
  } else if (config.mode === 'b') {
    await runModeB(config, storage);
  } else {
    console.error('❌ Invalid mode. Use --mode=a or --mode=b');
    process.exit(1);
  }
  
  console.log('🏁 Bot completed successfully');
}

// Run the bot
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

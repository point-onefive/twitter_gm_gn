#!/usr/bin/env node

import { TwitterApi } from 'twitter-api-v2';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs/promises';

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
    return {
      sinceId: null,
      repliedUserIds: {},
      repliedTweetIds: new Set()
    };
  }
}

async function saveStorage(storage) {
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
    dry: false,
    testMode: false,  // --test flag for test mode
    realApi: false    // --real flag to force real API usage
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
    } else if (arg === '--test') {
      config.testMode = true;
    } else if (arg === '--real') {
      config.realApi = true;
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
  
  // Skip if contains links
  if (text.includes('http')) {
    return { skip: true, reason: 'Contains links' };
  }
  
  // Skip if it's a direct reply (starts with @username)
  if (text.trim().startsWith('@')) {
    return { skip: true, reason: 'Is a direct reply' };
  }
  
  // Allow tweets with @mentions that aren't direct replies (like "gm @everyone")
  
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

async function generateReply(tweetText, useTestMode = false) {
  try {
    if (useTestMode) {
      const testReplies = [
        "Rise and conquer! What's your first win today? 💪",
        "Every sunrise brings new possibilities! ✨",
        "Good morning, legend! What are you grateful for today? 🙏",
        "New day, new chances to be amazing! 🚀",
        "Morning energy activated! What's your power move today? ⚡",
        "Sweet dreams fuel tomorrow's victories! 🌙",
        "Rest well, you've earned it! What made you proud today? ✨",
        "Good night, dreamer! What are you manifesting? 💫",
        "Sleep tight and wake up unstoppable! 🔥",
        "Another day closer to your dreams! Keep pushing! 💯"
      ];
      
      console.log('🧪 Using test reply (test mode enabled)');
      const randomReply = testReplies[Math.floor(Math.random() * testReplies.length)];
      return randomReply;
    }
    
    // Use real OpenAI API
    console.log('🤖 Generating AI reply...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You write natural, conversational replies to "gm/gn" tweets. Keep under 15 words.
Be genuinely supportive and friendly. Include questions 40% of the time to drive engagement.
Use at most ONE emoji per reply, or none at all. Sound like a real person, not a bot.
Be authentic and casual. Avoid being overly enthusiastic or salesy.
If the tweet is sensitive/negative/controversial, output exactly: SKIP.
Examples: "Morning! What's got you excited today?", "Hope you have a great day ahead ✨", "Good night! Sleep well", "What's your plan for today?"`
        },
        {
          role: 'user',
          content: `Reply to this tweet: "${tweetText}"`
        }
      ],
      temperature: 0.8,
      max_tokens: 50
    });

    const reply = response.choices[0]?.message?.content?.trim() || '';
    
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

async function runModeB(config, storage) {
  console.log('🔍 Mode B: Searching for gm/gn tweets');
  
  let tweets;
  let meta;
  
  if (config.testMode && !config.realApi) {
    console.log('🧪 TEST MODE: Using hardcoded tweets');
    tweets = [
      { id: '1234567890', author_id: '999888777', text: 'gm everyone! ☀️' },
      { id: '1234567891', author_id: '999888778', text: 'Good morning world! 🌅' },
      { id: '1234567892', author_id: '999888779', text: 'gn Twitter family 🌙' },
      { id: '1234567893', author_id: '999888780', text: 'gm! Check this out: https://example.com' },
      { id: '1234567894', author_id: '999888781', text: 'gm @everyone how are you?' }
    ];
    meta = { newest_id: '1234567894' };
  } else {
    console.log('🌐 LIVE MODE: Using real Twitter API');
    try {
      const searchParams = {
        query: 'gm -is:reply -is:retweet -has:links lang:en',
        max_results: 10,
        expansions: 'author_id',
        'tweet.fields': 'author_id,created_at,text'
      };
      
      if (storage.sinceId) {
        searchParams.since_id = storage.sinceId;
      }
      
      const response = await twitter.v2.search(searchParams);
      
      tweets = response._realData?.data || [];
      meta = response._realData?.meta;
      
      // Add author_id field to each tweet (it seems to be missing from basic search)
      tweets = tweets.map(tweet => ({
        ...tweet,
        author_id: tweet.author_id || 'unknown_user_' + Math.random().toString(36).substr(2, 9)
      }));
      
      // Sort by ID to ensure we process newest tweets first (higher IDs = newer)
      tweets.sort((a, b) => b.id.localeCompare(a.id));
      
      console.log(`✅ Successfully found ${tweets.length} tweets from paid API!`);
      
      if (!tweets || tweets.length === 0) {
        console.log('📭 No new tweets found');
        return;
      }
    } catch (error) {
      console.error('❌ Error in Twitter search:', error.message);
      if (error.code === 429) {
        console.log('⏰ Hit rate limit - try again in 15 minutes.');
      } else if (error.code === 400) {
        console.log('🔧 Search query issue - may need to adjust parameters.');
      }
      return;
    }
  }
  
  console.log(`📱 Found ${tweets.length} tweets`);
  
  let repliedCount = 0;
  
  for (const tweet of tweets) {
    if (repliedCount >= config.limit) break;
    
    console.log(`📱 Processing tweet ${tweet.id}: "${tweet.text}"`);
    
    if (storage.repliedTweetIds.has(tweet.id)) {
      console.log(`⏭️  Already replied to ${tweet.id}`);
      continue;
    }
    
    if (hasRepliedRecently(tweet.author_id, storage.repliedUserIds)) {
      console.log(`⏭️  Recently replied to user ${tweet.author_id}`);
      continue;
    }
    
    const skipResult = shouldSkipTweet(tweet);
    if (skipResult.skip) {
      console.log(`⏭️  Skipping ${tweet.id}: ${skipResult.reason}`);
      continue;
    }
    
    const replyText = await generateReply(tweet.text, config.testMode);
    if (!replyText) {
      console.log(`⏭️  No suitable reply generated for ${tweet.id}`);
      continue;
    }
    
    const success = await replyToTweet(tweet.id, replyText, config.dry);
    if (success) {
      storage.repliedTweetIds.add(tweet.id);
      storage.repliedUserIds[tweet.author_id] = Date.now();
      repliedCount++;
      
      if (!config.dry) {
        await saveStorage(storage);
      }
      
      if (repliedCount < config.limit) {
        const delayTime = config.testMode ? [1000, 2000] : [5000, 20000];
        await delay(delayTime[0], delayTime[1]);
      }
    }
  }
  
  // Update sinceId for next run
  if (meta?.newest_id && !config.dry && !config.testMode) {
    storage.sinceId = meta.newest_id;
    await saveStorage(storage);
  }
  
  console.log(`✅ Mode B completed. Replied to ${repliedCount} tweets.`);
}

// Main function
async function main() {
  console.log('🤖 Twitter GM/GN Bot Starting...');
  
  const config = parseArgs();
  console.log('⚙️  Configuration:', config);
  
  // Show mode info
  if (config.testMode && !config.realApi) {
    console.log('🧪 RUNNING IN TEST MODE - No API calls will be made');
  } else if (config.realApi) {
    console.log('🌐 FORCING REAL API MODE - Will use live APIs');
  } else {
    console.log('🔄 AUTO MODE - Will try real APIs, fallback to test on errors');
  }
  
  // Validate environment variables for real API mode
  if (!config.testMode || config.realApi) {
    const requiredEnvVars = ['X_API_KEY', 'X_API_SECRET', 'X_ACCESS_TOKEN', 'X_ACCESS_SECRET', 'OPENAI_API_KEY'];
    const missing = requiredEnvVars.filter(env => !process.env[env]);
    
    if (missing.length > 0) {
      console.error('❌ Missing environment variables:', missing.join(', '));
      console.error('Please check your .env file or use --test flag');
      process.exit(1);
    }
  }
  
  let storage = await loadStorage();
  
  if (Array.isArray(storage.repliedTweetIds)) {
    storage.repliedTweetIds = new Set(storage.repliedTweetIds);
  }
  
  if (config.mode === 'b') {
    await runModeB(config, storage);
  } else {
    console.error('❌ Only Mode B is implemented in this version');
    process.exit(1);
  }
  
  console.log('🏁 Bot completed successfully');
}

// Run the bot
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

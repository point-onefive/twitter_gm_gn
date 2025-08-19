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

// Language support
const SUPPORTED_LANGUAGES = ['en', 'es', 'pt', 'fr', 'de', 'it'];

// Language detection utilities
function detectLanguage(tweet) {
  const lang = (tweet.lang || 'en').toLowerCase();
  return SUPPORTED_LANGUAGES.includes(lang) ? lang : 'en';
}

function detectPartOfDay(text) {
  const morning = /\b(gm|good morning|buenos d[ií]as?|bom dia|guten morgen|bonjour)\b/i;
  const night = /\b(gn|good night|buenas noches?|boa noite|gute nacht|bonne nuit)\b/i;
  
  if (morning.test(text)) return 'morning';
  if (night.test(text)) return 'night';
  return 'unknown';
}

function isWeekend(createdAtISO) {
  const date = new Date(createdAtISO);
  const dayOfWeek = date.getUTCDay(); // 0 = Sunday, 6 = Saturday
  return dayOfWeek === 0 || dayOfWeek === 6;
}

function hasEmoji(text) {
  // Test for common emoji ranges
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
  return emojiRegex.test(text);
}

// Handcrafted fallbacks by language
const FALLBACKS = {
  en: {
    morning: { 
      weekday: ["New day, new wins.", "Momentum starts now.", "Let's make moves.", "Rise and grind."],
      weekend: ["Easy pace today.", "Weekend vibes.", "Fresh start weekend.", "Enjoy the day."] 
    },
    night: { 
      weekday: ["Reset for tomorrow.", "Rest up, champion.", "Prep for wins.", "Sleep well."],
      weekend: ["Unwind well.", "Recharge time.", "Weekend rest.", "Peaceful night."] 
    }
  },
  es: {
    morning: { 
      weekday: ["Nuevo día, nuevas metas.", "A por el día.", "Vamos con todo.", "Buenos días."],
      weekend: ["Fin de semana genial.", "Relájate y disfruta.", "Buenos días.", "Tiempo libre."] 
    },
    night: { 
      weekday: ["Descansar bien.", "Preparar mañana.", "Buenas noches.", "A recargar."],
      weekend: ["Relajarse bien.", "Noche tranquila.", "Buen descanso.", "Buenas noches."] 
    }
  },
  pt: {
    morning: { 
      weekday: ["Novo dia, novas metas.", "Vamos em frente.", "Bom dia!", "Energia total."],
      weekend: ["Fim de semana bom.", "Relaxar e curtir.", "Bom dia!", "Tempo livre."] 
    },
    night: { 
      weekday: ["Descansar bem.", "Preparar amanhã.", "Boa noite!", "Recarregar."],
      weekend: ["Relaxar bem.", "Noite tranquila.", "Boa noite!", "Bom descanso."] 
    }
  },
  fr: {
    morning: { 
      weekday: ["Nouveau jour, nouveaux buts.", "Allons-y!", "Bonjour!", "Énergie positive."],
      weekend: ["Bon week-end.", "Détente et plaisir.", "Bonjour!", "Temps libre."] 
    },
    night: { 
      weekday: ["Bien se reposer.", "Préparer demain.", "Bonne nuit!", "Recharger."],
      weekend: ["Bien se détendre.", "Nuit paisible.", "Bonne nuit!", "Bon repos."] 
    }
  },
  de: {
    morning: { 
      weekday: ["Neuer Tag, neue Ziele.", "Los geht's!", "Guten Morgen!", "Volle Energie."],
      weekend: ["Schönes Wochenende.", "Entspannen und genießen.", "Guten Morgen!", "Freie Zeit."] 
    },
    night: { 
      weekday: ["Gut ausruhen.", "Morgen vorbereiten.", "Gute Nacht!", "Aufladen."],
      weekend: ["Gut entspannen.", "Ruhige Nacht.", "Gute Nacht!", "Gute Erholung."] 
    }
  },
  it: {
    morning: { 
      weekday: ["Nuovo giorno, nuovi obiettivi.", "Andiamo!", "Buongiorno!", "Energia piena."],
      weekend: ["Buon weekend.", "Rilassarsi e divertirsi.", "Buongiorno!", "Tempo libero."] 
    },
    night: { 
      weekday: ["Riposare bene.", "Preparare domani.", "Buonanotte!", "Ricaricare."],
      weekend: ["Rilassarsi bene.", "Notte tranquilla.", "Buonanotte!", "Buon riposo."] 
    }
  }
};

// Build system prompt based on language and context
function buildSystemPrompt({ lang, partOfDay, weekend, allowEmoji }) {
  const emojiStyle = allowEmoji ? "allow 0-1 emoji" : "no emoji";
  
  let toneGuidance;
  if (partOfDay === 'morning') {
    toneGuidance = weekend 
      ? "light, reset, enjoy the day"
      : "energetic, momentum, focus";
  } else if (partOfDay === 'night') {
    toneGuidance = weekend
      ? "relax, recharge, gratitude" 
      : "wind-down, prep for tomorrow";
  } else {
    toneGuidance = "friendly, supportive";
  }
  
  return `You write one-line replies to GM/GN tweets in ${lang}.
Keep under 12 words. Mirror emoji style: ${emojiStyle}.
Tone: ${toneGuidance}.
If sensitive or off-topic, output exactly: SKIP.
No hashtags unless the original uses them.`;
}

// Get fallback reply
function getFallbackReply(lang, partOfDay, weekend) {
  const langFallbacks = FALLBACKS[lang] || FALLBACKS.en;
  const timeOfDay = partOfDay === 'unknown' ? 'morning' : partOfDay;
  const timeSlot = weekend ? 'weekend' : 'weekday';
  
  const options = langFallbacks[timeOfDay]?.[timeSlot] || langFallbacks.morning.weekday;
  return options[Math.floor(Math.random() * options.length)];
}

// Social prioritization system
async function refreshFollowersCache(ttlHours = 24) {
  try {
    const storage = await loadStorage();
    
    // Initialize cache if missing
    if (!storage.followersCache) {
      storage.followersCache = { updatedAt: 0, ids: [] };
    }
    
    // Check if cache is still valid
    const now = Date.now();
    const cacheAge = now - storage.followersCache.updatedAt;
    const ttlMs = ttlHours * 3600 * 1000;
    
    if (cacheAge < ttlMs) {
      console.log(`👥 Using cached followers (${storage.followersCache.ids.length} followers, age: ${Math.round(cacheAge / 3600000)}h)`);
      return new Set(storage.followersCache.ids);
    }
    
    // Refresh cache
    console.log('🔄 Refreshing followers cache...');
    const userId = await ensureMyUserId();
    const followerIds = [];
    
    let paginationToken = undefined;
    let pageCount = 0;
    const maxPages = 10; // Safety limit
    
    do {
      try {
        const response = await twitter.v2.followers(userId, {
          max_results: 1000,
          pagination_token: paginationToken
        });
        
        if (response.data) {
          followerIds.push(...response.data.map(user => user.id));
          console.log(`📄 Fetched page ${++pageCount}: ${response.data.length} followers`);
        }
        
        paginationToken = response.meta?.next_token;
        
        // Rate limit protection
        if (paginationToken && pageCount < maxPages) {
          await delay(1000, 2000); // 1-2 second delay between pages
        }
        
      } catch (error) {
        if (error.code === 429) {
          console.log('⏰ Hit rate limit while fetching followers, using partial cache');
          break;
        }
        throw error;
      }
    } while (paginationToken && pageCount < maxPages);
    
    // Update storage
    storage.followersCache = {
      updatedAt: now,
      ids: followerIds
    };
    
    await saveStorage(storage);
    console.log(`✅ Cached ${followerIds.length} followers`);
    
    return new Set(followerIds);
    
  } catch (error) {
    if (error.code === 403) {
      console.log('⚠️  Followers API requires elevated access - using follower count only');
    } else {
      console.error('❌ Failed to refresh followers cache:', error.message);
    }
    // Return empty set on error
    return new Set();
  }
}

async function refreshFollowingCache(ttlHours = 24) {
  try {
    const storage = await loadStorage();
    
    // Initialize cache if missing
    if (!storage.followingCache) {
      storage.followingCache = { updatedAt: 0, ids: [] };
    }
    
    // Check if cache is still valid
    const now = Date.now();
    const cacheAge = now - storage.followingCache.updatedAt;
    const ttlMs = ttlHours * 3600 * 1000;
    
    if (cacheAge < ttlMs) {
      console.log(`👤 Using cached following (${storage.followingCache.ids.length} following, age: ${Math.round(cacheAge / 3600000)}h)`);
      return new Set(storage.followingCache.ids);
    }
    
    // Refresh cache
    console.log('🔄 Refreshing following cache...');
    const userId = await ensureMyUserId();
    const followingIds = [];
    
    let paginationToken = undefined;
    let pageCount = 0;
    const maxPages = 10; // Safety limit
    
    do {
      try {
        const response = await twitter.v2.following(userId, {
          max_results: 1000,
          pagination_token: paginationToken
        });
        
        if (response.data) {
          followingIds.push(...response.data.map(user => user.id));
          console.log(`📄 Fetched page ${++pageCount}: ${response.data.length} following`);
        }
        
        paginationToken = response.meta?.next_token;
        
        // Rate limit protection
        if (paginationToken && pageCount < maxPages) {
          await delay(1000, 2000); // 1-2 second delay between pages
        }
        
      } catch (error) {
        if (error.code === 429) {
          console.log('⏰ Hit rate limit while fetching following, using partial cache');
          break;
        }
        throw error;
      }
    } while (paginationToken && pageCount < maxPages);
    
    // Update storage
    storage.followingCache = {
      updatedAt: now,
      ids: followingIds
    };
    
    await saveStorage(storage);
    console.log(`✅ Cached ${followingIds.length} following`);
    
    return new Set(followingIds);
    
  } catch (error) {
    if (error.code === 403) {
      console.log('⚠️  Following API requires elevated access - using follower count only');
    } else {
      console.error('❌ Failed to refresh following cache:', error.message);
    }
    // Return empty set on error
    return new Set();
  }
}

function calculatePriority(tweet, userById, followersSet, followingSet, minFollowers) {
  const authorId = tweet.author_id;
  const user = userById[authorId];
  const followersCount = user?.public_metrics?.followers_count || 0;
  
  const isFollower = followersSet.has(authorId);
  const isFollowing = followingSet.has(authorId);
  
  let bucket = 4; // default "others"
  let bucketName = "others";
  
  if (isFollower && isFollowing) {
    bucket = 0;
    bucketName = "mutual";
  } else if (isFollower) {
    bucket = 1;
    bucketName = "follower";
  } else if (isFollowing) {
    bucket = 2;
    bucketName = "following";
  } else if (followersCount >= minFollowers) {
    bucket = 3;
    bucketName = "high-reach";
  }
  
  // Strategic filtering: skip very low-value targets when we have limited slots
  const isLowValue = followersCount < 50 && bucket > 3;
  
  const secondary = -followersCount; // Higher follower count first (negative for ASC sort)
  const createdAt = Date.parse(tweet.created_at || 0);
  
  return { 
    bucket, 
    bucketName,
    secondary, 
    createdAt,
    followersCount,
    isFollower,
    isFollowing,
    isLowValue
  };
}

// Bot Personalities - Easy to switch!
const PERSONALITIES = {
  friendly: {
    name: "Friendly & Natural",
    prompt: `You write natural, conversational replies to "gm/gn" tweets. Keep under 15 words.
Be genuinely supportive and friendly. Include questions 40% of the time to drive engagement.
Use at most ONE emoji per reply, or none at all. Sound like a real person, not a bot.
Be authentic and casual. Avoid being overly enthusiastic or salesy.
If the tweet is sensitive/negative/controversial, output exactly: SKIP.
Examples: "Morning! What's got you excited today?", "Hope you have a great day ahead ✨", "Good night! Sleep well", "What's your plan for today?"`
  },
  
  motivational: {
    name: "Motivational Hustle", 
    prompt: `You are a motivational Twitter bot. Your responses must be statements or exclamations, NEVER questions.
Write high-energy replies to "gm/gn" tweets. Keep under 15 words. Be inspiring and action-oriented.
If your response contains a "?" character, it is WRONG. Do not use "?" ever.
Use greetings like: "GM!", "Rise up!", "Let's go!", "Time to shine!", "Boom!", "LFG!", "Yo!"
Use power words: "grind", "hustle", "execute", "win", "dominate", "crush". Include motivational emojis 🔥💪⚡🚀💯.
If the tweet is sensitive/negative/controversial, output exactly: SKIP.
Good examples: "LFG! 💪", "Rise and grind! 🔥", "Time to dominate! ⚡", "GM legend! 💯", "Let's gooo! 🚀", "Boom! Energy activated! 💪"`
  },
  
  crypto: {
    name: "Crypto & Finance",
    prompt: `You write crypto and finance-focused replies to "gm/gn" tweets. Keep under 15 words.
Reference markets, trading, investing, and crypto culture naturally.
Use terms like "bullish", "diamond hands", "moon", "charts", "defi". Be optimistic about markets.
If the tweet is sensitive/negative/controversial, output exactly: SKIP.
Examples: "gm! Charts looking bullish today 📈", "Ready to make some moves! 💎", "Morning! What coins are you watching? 🚀"`
  },
  
  zen: {
    name: "Zen & Mindful",
    prompt: `You write calm, mindful replies to "gm/gn" tweets. Keep under 12 words.
Be peaceful and centered. Focus on gratitude, presence, and simplicity.
Minimal or no emojis. Keep it simple and thoughtful.
If the tweet is sensitive/negative/controversial, output exactly: SKIP.
Examples: "Good morning. Wishing you peace today.", "Hope you find joy in small moments.", "Rest well, friend."`
  },
  
  witty: {
    name: "Witty & Humorous",
    prompt: `You write funny, lighthearted replies to "gm/gn" tweets. Keep under 15 words.
Be clever and witty without being mean. Use gentle humor and relatability.
Reference common experiences, coffee, Monday blues, etc. Be entertaining but kind.
If the tweet is sensitive/negative/controversial, output exactly: SKIP.
Examples: "Morning! Coffee level: desperately needed ☕", "gm to everyone except my alarm clock", "Good night! May your WiFi be strong and bills be low 📶"`
  }
};

// Current personality - CHANGE THIS TO SWITCH STYLES!
const CURRENT_PERSONALITY = 'motivational'; // Options: friendly, motivational, crypto, zen, witty

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

// Cache for user ID
let myUserId = null;

// Auto-like functionality
async function ensureMyUserId() {
  if (myUserId) return myUserId;
  
  try {
    const me = await twitter.v2.me();
    myUserId = me.data.id;
    console.log(`✅ Cached user ID: ${myUserId}`);
    return myUserId;
  } catch (error) {
    console.error('❌ Failed to get user ID:', error.message);
    throw error;
  }
}

async function likeTweet(tweetId) {
  try {
    const userId = await ensureMyUserId();
    
    // Rate limit protection: likes are limited to 50/15min (3.3/min)
    // Add 20-30 second delay before each like to stay well under limit
    const likeDelay = 20000 + Math.random() * 10000; // 20-30 seconds
    console.log(`⏳ Waiting ${Math.round(likeDelay/1000)}s before liking (rate limit protection)...`);
    await delay(likeDelay, likeDelay);
    
    await twitter.v2.like(userId, tweetId);
    console.log(`💖 Liked tweet ${tweetId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to like tweet ${tweetId}:`, error.message);
    if (error.code === 429) {
      console.log('⏳ Like rate limit hit - skipping remaining likes...');
      // Don't wait 5 minutes in automated runs - just skip
      return false;
    } else if (error.code >= 400) {
      console.log('⏳ Like error - skipping this tweet...');
      // Don't wait 2 minutes - just skip
      return false;
    }
    return false;
  }
}

// Outcome logging for A/B testing
function calculateReward(metrics) {
  return metrics.likes + (2 * metrics.replies);
}

async function logOutcome({ sourceTweetId, replyTweetId, authorId, templateId, mode = 'a' }) {
  try {
    const storage = await loadStorage();
    
    if (!storage.outcomes) {
      storage.outcomes = [];
    }
    
    const outcome = {
      sourceTweetId,
      replyTweetId,
      authorId,
      templateId,
      mode,
      ts: new Date().toISOString(),
      status: 'posted',
      metrics: { likes: 0, replies: 0, retweets: 0, quotes: 0 }
    };
    
    storage.outcomes.push(outcome);
    console.log(`📊 Adding outcome to storage: ${storage.outcomes.length} total outcomes`);
    
    await saveStorage(storage);
    console.log(`✅ Logged outcome: ${templateId} -> ${replyTweetId}`);
  } catch (error) {
    console.error(`❌ Error logging outcome:`, error.message);
  }
}

// Score collection for metrics tracking
async function collectScores(ageMinutes = 60) {
  console.log(`📈 Collecting scores for outcomes older than ${ageMinutes} minutes...`);
  
  const storage = await loadStorage();
  const cutoffTime = new Date(Date.now() - ageMinutes * 60 * 1000);
  
  // Find outcomes that need scoring
  const toScore = storage.outcomes.filter(outcome => 
    outcome.status === 'posted' && 
    new Date(outcome.ts) < cutoffTime
  );
  
  if (toScore.length === 0) {
    console.log('📭 No outcomes ready for scoring');
    return;
  }
  
  console.log(`📊 Found ${toScore.length} outcomes to score`);
  
  // Get reply tweet IDs
  const replyTweetIds = toScore.map(o => o.replyTweetId);
  
  try {
    // Fetch metrics in batches (Twitter API limit is 100 per request)
    const batchSize = 100;
    const results = [];
    
    for (let i = 0; i < replyTweetIds.length; i += batchSize) {
      const batch = replyTweetIds.slice(i, i + batchSize);
      const response = await twitter.v2.tweets(batch, {
        'tweet.fields': 'public_metrics'
      });
      
      if (response.data) {
        results.push(...response.data);
      }
      
      // Small delay between batches
      if (i + batchSize < replyTweetIds.length) {
        await delay(1000, 2000);
      }
    }
    
    // Update outcomes with metrics
    const metricsMap = new Map();
    results.forEach(tweet => {
      if (tweet.public_metrics) {
        metricsMap.set(tweet.id, {
          likes: tweet.public_metrics.like_count || 0,
          replies: tweet.public_metrics.reply_count || 0,
          retweets: tweet.public_metrics.retweet_count || 0,
          quotes: tweet.public_metrics.quote_count || 0
        });
      }
    });
    
    // Update storage and calculate rewards
    let updatedCount = 0;
    console.log('\n📊 Results:');
    console.log('TemplateID | Likes | Replies | Retweets | Quotes | Reward');
    console.log('----------|-------|---------|----------|--------|-------');
    
    for (const outcome of toScore) {
      const metrics = metricsMap.get(outcome.replyTweetId);
      if (metrics) {
        outcome.metrics = metrics;
        outcome.status = 'scored';
        updatedCount++;
        
        const reward = calculateReward(metrics);
        console.log(`${outcome.templateId.padEnd(9)} | ${metrics.likes.toString().padStart(5)} | ${metrics.replies.toString().padStart(7)} | ${metrics.retweets.toString().padStart(8)} | ${metrics.quotes.toString().padStart(6)} | ${reward.toString().padStart(6)}`);
      }
    }
    
    await saveStorage(storage);
    console.log(`\n✅ Updated ${updatedCount} outcomes with metrics`);
    
  } catch (error) {
    console.error('❌ Error collecting scores:', error.message);
  }
}

// Storage functions
async function loadStorage() {
  try {
    const data = await fs.readFile(STORAGE_FILE, 'utf8');
    const storage = JSON.parse(data);
    
    // Ensure all required fields exist
    if (!storage.outcomes) storage.outcomes = [];
    if (!storage.lastMentionId) storage.lastMentionId = null;
    
    return storage;
  } catch (error) {
    return {
      sinceId: null,
      repliedUserIds: {},
      repliedTweetIds: new Set(),
      outcomes: [],
      lastMentionId: null
    };
  }
}

async function saveStorage(storage) {
  try {
    const storageToSave = {
      ...storage,
      repliedTweetIds: Array.from(storage.repliedTweetIds)
    };
    await fs.writeFile(STORAGE_FILE, JSON.stringify(storageToSave, null, 2));
    console.log(`💾 Storage saved with ${storage.outcomes?.length || 0} outcomes`);
  } catch (error) {
    console.error(`❌ Error saving storage:`, error.message);
    throw error;
  }
}

// Utility functions
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    mode: 'b',
    ids: [],
    limit: 10,
    dry: false,
    testMode: false,  // --test flag for test mode
    realApi: false,   // --real flag to force real API usage
    score: false,     // --score flag for metrics collection
    ageMinutes: 60,   // --age=N for score collection
    forceLang: null,  // --forceLang=es to override detection
    forceTime: null,  // --forceTime=weekend|weekday to override detection
    minFollowers: parseInt(process.env.MIN_FOLLOWERS) || 500, // --minFollowers=N
    refreshFollowers: false, // --refreshFollowers to bypass cache TTL
    refreshFollowing: false, // --refreshFollowing to bypass cache TTL
    targetingMode: 'smart',   // --targeting=smart|crypto|broad
    autoLike: true    // --noLike to disable auto-liking
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--mode=')) {
      config.mode = arg.split('=')[1];
    } else if (arg.startsWith('--ids=')) {
      config.ids = arg.split('=')[1].split(',').filter(id => id.trim());
    } else if (arg.startsWith('--limit=')) {
      config.limit = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--age=')) {
      config.ageMinutes = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--forceLang=')) {
      config.forceLang = arg.split('=')[1];
    } else if (arg.startsWith('--forceTime=')) {
      config.forceTime = arg.split('=')[1];
    } else if (arg.startsWith('--minFollowers=')) {
      config.minFollowers = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--targeting=')) {
      config.targetingMode = arg.split('=')[1];
    } else if (arg === '--dry') {
      config.dry = true;
    } else if (arg === '--test') {
      config.testMode = true;
    } else if (arg === '--real') {
      config.realApi = true;
    } else if (arg === '--score') {
      config.score = true;
    } else if (arg === '--refreshFollowers') {
      config.refreshFollowers = true;
    } else if (arg === '--refreshFollowing') {
      config.refreshFollowing = true;
    } else if (arg === '--noLike') {
      config.autoLike = false;
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

async function generateReply(tweet, useTestMode = false, config = {}) {
  try {
    // Compute language and context
    const lang = config.forceLang || detectLanguage(tweet);
    const partOfDay = detectPartOfDay(tweet.text);
    const weekend = config.forceTime 
      ? config.forceTime === 'weekend' 
      : isWeekend(tweet.created_at);
    const allowEmoji = hasEmoji(tweet.text);
    
    console.log(`🌍 Context: lang=${lang} part=${partOfDay} weekend=${weekend} allowEmoji=${allowEmoji}`);
    
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
    
    // Build context-aware system prompt
    const systemPrompt = buildSystemPrompt({ lang, partOfDay, weekend, allowEmoji });
    
    // Use real OpenAI API
    console.log('🤖 Generating AI reply...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Reply to this tweet: "${tweet.text}"`
        }
      ],
      temperature: 0.8,
      max_tokens: 50
    });

    const reply = response.choices[0]?.message?.content?.trim() || '';
    
    if (!reply || reply === 'SKIP' || reply.length > 140) {
      console.log('🔄 AI reply was SKIP or invalid, skipping tweet...');
      return 'SKIP';
    }
    
    return reply;
  } catch (error) {
    console.error('Error generating reply:', error.message);
    console.log('🔄 AI error occurred, skipping tweet...');
    return 'SKIP';
  }
}

async function delay(min, max) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise(resolve => setTimeout(resolve, ms));
}

async function replyToTweet(tweetId, replyText, isDry = false, sourceTweetId = null, authorId = null, config = {}) {
  if (isDry) {
    console.log(`[DRY RUN] Would reply to ${tweetId}: "${replyText}"`);
    if (sourceTweetId && authorId) {
      if (config.autoLike !== false) {
        console.log(`[DRY RUN] Would log outcome and like source tweet ${sourceTweetId}`);
      } else {
        console.log(`[DRY RUN] Would log outcome (auto-like disabled)`);
      }
    }
    return { success: true, replyTweetId: 'dry_run_' + Date.now() };
  }

  try {
    const response = await twitter.v2.reply(replyText, tweetId);
    const replyTweetId = response.data.id;
    
    console.log(`✅ Replied to ${tweetId}: "${replyText}"`);
    
    // Auto-like the source tweet (if enabled)
    if (sourceTweetId && config.autoLike !== false) {
      await likeTweet(sourceTweetId);
    }
    
    return { success: true, replyTweetId };
  } catch (error) {
    console.error(`❌ Failed to reply to ${tweetId}:`, error.message);
    if (error.code >= 400) {
      console.log('⏳ Reply error - continuing with next tweet...');
      // Don't wait 2 minutes - just continue
    }
    return { success: false, replyTweetId: null };
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
        query: '(gm OR gn) -is:reply -is:retweet -has:links lang:en',
        max_results: 15,
        expansions: ['author_id'],
        'tweet.fields': ['author_id', 'created_at', 'text'],
        'user.fields': ['public_metrics', 'verified']
      };
      
      if (storage.sinceId) {
        searchParams.since_id = storage.sinceId;
      }
      
      try {
        const response = await twitter.v2.search(searchParams);
        tweets = response._realData?.data || [];
        meta = response._realData?.meta;
      } catch (searchError) {
        // Handle invalid since_id error (common when since_id is too old)
        if (searchError.code === 400 && searchError.data?.errors?.[0]?.parameters?.since_id) {
          console.log('⚠️  Invalid since_id detected, retrying without it...');
          delete searchParams.since_id;
          storage.sinceId = null; // Clear the problematic since_id
          const retryResponse = await twitter.v2.search(searchParams);
          tweets = retryResponse._realData?.data || [];
          meta = retryResponse._realData?.meta;
        } else {
          throw searchError; // Re-throw if it's a different error
        }
      }
      const includes = response._realData?.includes;
      
      // Build userById map for priority calculation
      const userById = {};
      if (includes?.users) {
        includes.users.forEach(user => {
          userById[user.id] = user;
        });
      }
      
      // Add author_id field to each tweet (it seems to be missing from basic search)
      tweets = tweets.map(tweet => ({
        ...tweet,
        author_id: tweet.author_id || 'unknown_user_' + Math.random().toString(36).substr(2, 9)
      }));
      
      // Apply social prioritization
      console.log('🔄 Applying social prioritization...');
      const followersSet = await refreshFollowersCache(config.refreshFollowers ? 0 : 24);
      const followingSet = await refreshFollowingCache(config.refreshFollowing ? 0 : 24);
      
      // Calculate priority for each tweet
      const prioritizedTweets = tweets.map(tweet => ({
        ...tweet,
        priority: calculatePriority(tweet, userById, followersSet, followingSet, config.minFollowers)
      }));
      
      // Sort by priority: bucket ASC, then secondary ASC (higher followers first), then createdAt DESC (newer first)
      prioritizedTweets.sort((a, b) => {
        if (a.priority.bucket !== b.priority.bucket) {
          return a.priority.bucket - b.priority.bucket;
        }
        if (a.priority.secondary !== b.priority.secondary) {
          return a.priority.secondary - b.priority.secondary;
        }
        return b.priority.createdAt - a.priority.createdAt;
      });
      
      tweets = prioritizedTweets;
      
      console.log(`✅ Successfully found ${tweets.length} tweets from paid API!`);
      console.log('📊 Priority breakdown:');
      const bucketCounts = {};
      tweets.forEach(tweet => {
        const bucket = tweet.priority.bucketName;
        bucketCounts[bucket] = (bucketCounts[bucket] || 0) + 1;
      });
      Object.entries(bucketCounts).forEach(([bucket, count]) => {
        console.log(`  ${bucket}: ${count} tweets`);
      });
      
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
  let skippedLowValue = 0;
  
  // First pass: count high-value targets
  const highValueTweets = tweets.filter(tweet => 
    tweet.priority && !tweet.priority.isLowValue
  );
  
  console.log(`🎯 Strategic targeting: ${highValueTweets.length} high-value, ${tweets.length - highValueTweets.length} low-value`);
  
  for (const tweet of tweets) {
    if (repliedCount >= config.limit) break;
    
    // Show priority information
    const priorityInfo = tweet.priority 
      ? `prio[${tweet.priority.bucket}:${tweet.priority.bucketName}] followers=${tweet.priority.followersCount} followerOfMe=${tweet.priority.isFollower} tweet=${tweet.id}`
      : `tweet=${tweet.id}`;
    
    console.log(`📱 Processing ${priorityInfo}: "${tweet.text}"`);
    
    // Strategic skip: if we have high-value targets remaining and this is low-value, skip it
    if (tweet.priority?.isLowValue && repliedCount < config.limit) {
      const remainingSlots = config.limit - repliedCount;
      const remainingHighValue = highValueTweets.filter(t => 
        !storage.repliedTweetIds.has(t.id) && 
        !hasRepliedRecently(t.author_id, storage.repliedUserIds)
      ).length;
      
      if (remainingHighValue >= remainingSlots * 0.7) { // Save 70% of slots for high-value
        console.log(`⏭️  Skipping low-value target (${tweet.priority.followersCount} followers) - saving slots for high-value targets`);
        skippedLowValue++;
        continue;
      }
    }
    
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
    
    const replyText = await generateReply(tweet, config.testMode, config);
    if (!replyText || replyText === 'SKIP') {
      console.log(`⏭️  No suitable reply generated for ${tweet.id}`);
      continue;
    }
    
    const result = await replyToTweet(tweet.id, replyText, config.dry, tweet.id, tweet.author_id, config);
    if (result.success) {
      storage.repliedTweetIds.add(tweet.id);
      storage.repliedUserIds[tweet.author_id] = Date.now();
      
      // Log outcome for A/B testing (only in non-dry mode)
      if (!config.dry && result.replyTweetId) {
        await logOutcome({
          sourceTweetId: tweet.id,
          replyTweetId: result.replyTweetId,
          authorId: tweet.author_id,
          templateId: 'ai:v1', // For now, all replies are AI-generated
          mode: 'a'
        });
        // Reload storage to get the updated outcomes
        const updatedStorage = await loadStorage();
        storage.outcomes = updatedStorage.outcomes;
        storage.repliedTweetIds = new Set(updatedStorage.repliedTweetIds);
        storage.repliedUserIds = updatedStorage.repliedUserIds;
      } else if (config.dry) {
        console.log(`[DRY RUN] Would log outcome for template 'ai:v1'`);
      }
      
      repliedCount++;
      
      // Only save if we're in dry mode (since logOutcome already saved in live mode)
      if (config.dry) {
        await saveStorage(storage);
      }
      
      if (repliedCount < config.limit) {
        // Small delay between replies for natural behavior (2-5 seconds)
        const delayTime = config.testMode ? [1000, 2000] : [2000, 5000]; // 2-5 seconds for production
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
  if (skippedLowValue > 0) {
    console.log(`🎯 Strategic skips: ${skippedLowValue} low-value targets skipped to prioritize high-value engagement`);
  }
}

// Main function
async function main() {
  console.log('🤖 Twitter GM/GN Bot Starting...');
  
  const config = parseArgs();
  console.log('⚙️  Configuration:', config);
  
  // Handle score collection mode
  if (config.score) {
    console.log('📊 Running in score collection mode...');
    await collectScores(config.ageMinutes);
    console.log('🏁 Score collection completed');
    return;
  }
  
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
if (import.meta.url === `file://${process.argv[1]}`) {
  // Only run main if this file is executed directly
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

// Export functions for automation
export { 
  runModeB, 
  loadStorage, 
  saveStorage
};

// Create default storage structure
export function createDefaultStorage() {
  return {
    sinceId: null,
    repliedTweetIds: new Set(),
    repliedUserIds: {},
    outcomes: [],
    followersCache: { updatedAt: 0, ids: [] },
    followingCache: { updatedAt: 0, ids: [] }
  };
}

// Setup functions for automation
export function setupTwitterClient() {
  // Twitter client is already initialized globally
  return twitter;
}

export function setupOpenAI() {
  // OpenAI client is already initialized globally
  return openai;
}

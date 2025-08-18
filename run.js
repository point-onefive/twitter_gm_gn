// run.js — GitHub Actions entrypoint for GM/GN bot automation
import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs/promises';

// Upstash Redis helpers (REST API, no client lib needed)
async function upstashGet(key) {
  if (!process.env.UPSTASH_URL || !process.env.UPSTASH_TOKEN) {
    console.log('⚠️  No Upstash credentials - falling back to local storage');
    return null;
  }
  
  try {
    const res = await fetch(`${process.env.UPSTASH_URL}/get/${key}`, {
      headers: { 
        Authorization: `Bearer ${process.env.UPSTASH_TOKEN}`,
        'Content-Type': 'application/json'
      },
    });
    
    if (!res.ok) {
      console.log(`⚠️  Upstash GET failed for ${key}: ${res.status}`);
      return null;
    }
    
    const data = await res.json();
    if (data.result) {
      try { 
        return JSON.parse(data.result); 
      } catch { 
        return data.result; 
      }
    }
    return null;
  } catch (error) {
    console.error(`❌ Upstash GET error for ${key}:`, error.message);
    return null;
  }
}

async function upstashSet(key, value) {
  if (!process.env.UPSTASH_URL || !process.env.UPSTASH_TOKEN) {
    console.log('⚠️  No Upstash credentials - skipping cloud storage');
    return;
  }
  
  try {
    const body = typeof value === 'string' ? value : JSON.stringify(value);
    const res = await fetch(`${process.env.UPSTASH_URL}/set/${key}`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${process.env.UPSTASH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: body  // Remove the extra JSON.stringify([body])
    });
    
    if (!res.ok) {
      console.log(`⚠️  Upstash SET failed for ${key}: ${res.status}`);
    }
  } catch (error) {
    console.error(`❌ Upstash SET error for ${key}:`, error.message);
  }
}

// Cloud storage integration with existing local storage format
async function loadCloudStorage() {
  console.log('☁️  Loading state from Upstash Redis...');
  
  // Try to load the complete storage object first
  let storage = await upstashGet('twitter_bot_storage');
  
  if (storage) {
    console.log('✅ Loaded complete storage from cloud');
    // Convert repliedTweetIds back to Set
    if (Array.isArray(storage.repliedTweetIds)) {
      storage.repliedTweetIds = new Set(storage.repliedTweetIds);
    }
    return storage;
  }
  
  // Fallback to individual keys for backward compatibility
  const sinceId = await upstashGet('twitter_bot_since_id');
  const repliedTweetIds = await upstashGet('twitter_bot_replied_tweets') || [];
  const repliedUserIds = await upstashGet('twitter_bot_replied_users') || {};
  const outcomes = await upstashGet('twitter_bot_outcomes') || [];
  const followersCache = await upstashGet('twitter_bot_followers_cache') || { updatedAt: 0, ids: [] };
  const followingCache = await upstashGet('twitter_bot_following_cache') || { updatedAt: 0, ids: [] };
  
  storage = {
    sinceId,
    repliedTweetIds: new Set(repliedTweetIds),
    repliedUserIds,
    outcomes,
    followersCache,
    followingCache,
    lastMentionId: null
  };
  
  console.log('✅ Loaded individual storage components from cloud');
  return storage;
}

// Save storage to both local and cloud
async function saveCloudStorage(storage) {
  console.log('☁️  Saving state to Upstash Redis...');
  
  // Convert Set to Array for JSON serialization
  const storageToSave = {
    ...storage,
    repliedTweetIds: Array.from(storage.repliedTweetIds)
  };
  
  // Save complete storage object
  await upstashSet('twitter_bot_storage', storageToSave);
  
  // Also save to local file as backup
  try {
    await fs.writeFile('storage.json', JSON.stringify(storageToSave, null, 2));
    console.log('💾 Local backup saved');
  } catch (error) {
    console.log('⚠️  Could not save local backup:', error.message);
  }
}

// Main execution
async function runAutomation() {
  try {
    console.log('🤖 Starting automated GM/GN bot run...');
    
    // Import the bot module
    const botModule = await import('./index.js');
    
    // Configuration from environment
    const config = {
      mode: 'b',
      limit: Number(process.env.MAX_REPLIES || 8),
      dry: false,
      testMode: false,
      realApi: true,
      score: false,
      ageMinutes: 60,
      forceLang: null,
      forceTime: null,
      minFollowers: Number(process.env.MIN_FOLLOWERS || 500),
      refreshFollowers: false,
      refreshFollowing: false,
      targetingMode: 'smart',
      autoLike: process.env.AUTO_LIKE !== 'false', // default true
      langs: (process.env.LANGS || 'en,es,pt').split(',')
    };
    
    console.log('⚙️  Configuration:', config);
    
    // Try to load from cloud first, then fallback to local
    let storage;
    
    if (process.env.UPSTASH_URL && process.env.UPSTASH_TOKEN) {
      storage = await loadCloudStorage();
    } else {
      console.log('📁 Loading from local storage...');
      try {
        const data = await fs.readFile('storage.json', 'utf8');
        storage = JSON.parse(data);
        // Convert array back to Set
        if (Array.isArray(storage.repliedTweetIds)) {
          storage.repliedTweetIds = new Set(storage.repliedTweetIds);
        }
      } catch (error) {
        storage = {
          sinceId: null,
          repliedUserIds: {},
          repliedTweetIds: new Set(),
          outcomes: [],
          lastMentionId: null,
          followersCache: { updatedAt: 0, ids: [] },
          followingCache: { updatedAt: 0, ids: [] }
        };
      }
    }
    
    // Ensure storage has all required fields and proper types
    if (!storage.outcomes) storage.outcomes = [];
    if (!storage.followersCache) storage.followersCache = { updatedAt: 0, ids: [] };
    if (!storage.followingCache) storage.followingCache = { updatedAt: 0, ids: [] };
    
    // Ensure repliedTweetIds is a Set
    if (!storage.repliedTweetIds || typeof storage.repliedTweetIds.has !== 'function') {
      storage.repliedTweetIds = new Set(Array.isArray(storage.repliedTweetIds) ? storage.repliedTweetIds : []);
    }
    
    // Ensure repliedUserIds exists
    if (!storage.repliedUserIds) storage.repliedUserIds = {};
    
    // Run the bot with our config and storage
    await botModule.runModeB(config, storage);
    
    // Save the updated storage
    if (process.env.UPSTASH_URL && process.env.UPSTASH_TOKEN) {
      await saveCloudStorage(storage);
      console.log('✅ Final state saved to Upstash');
    } else {
      await botModule.saveStorage(storage);
      console.log('✅ Final state saved locally');
    }
    
    console.log('✅ Automated bot run completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Automated bot run failed:', error);
    process.exit(1);
  }
}

// Run the automation
runAutomation();

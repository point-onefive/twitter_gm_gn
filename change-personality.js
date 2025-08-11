#!/usr/bin/env node

// Quick script to change bot personality
// Usage: node change-personality.js [personality]
// Available: friendly, motivational, crypto, zen, witty

import fs from 'fs/promises';

const PERSONALITIES = {
  friendly: "Friendly & Natural - Supportive, conversational, minimal emojis",
  motivational: "Motivational Hustle - High-energy, success-focused, power words",
  crypto: "Crypto & Finance - Market-focused, trading terms, bullish vibes",
  zen: "Zen & Mindful - Peaceful, simple, thoughtful responses",
  witty: "Witty & Humorous - Clever, relatable, gentle humor"
};

const personality = process.argv[2];

if (!personality) {
  console.log('🎭 Available Personalities:');
  for (const [key, desc] of Object.entries(PERSONALITIES)) {
    console.log(`   ${key.padEnd(12)} - ${desc}`);
  }
  console.log('\n💡 Usage: node change-personality.js [personality]');
  console.log('   Example: node change-personality.js crypto');
  process.exit(0);
}

if (!PERSONALITIES[personality]) {
  console.log(`❌ Invalid personality: ${personality}`);
  console.log(`Available: ${Object.keys(PERSONALITIES).join(', ')}`);
  process.exit(1);
}

async function changePersonality() {
  try {
    // Read the current file
    let content = await fs.readFile('index.js', 'utf8');
    
    // Replace the CURRENT_PERSONALITY line
    const regex = /const CURRENT_PERSONALITY = '[^']*'/;
    content = content.replace(regex, `const CURRENT_PERSONALITY = '${personality}'`);
    
    // Write it back
    await fs.writeFile('index.js', content);
    
    console.log(`✅ Personality changed to: ${PERSONALITIES[personality]}`);
    console.log('� Test it with: node index.js --dry --limit=3');
    
  } catch (error) {
    console.error('❌ Error changing personality:', error.message);
  }
}

changePersonality();

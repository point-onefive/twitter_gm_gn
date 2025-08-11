#!/usr/bin/env node

import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function testOpenAI() {
  try {
    console.log('🧪 Testing OpenAI API...');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: 'Write a short motivational reply to "gm everyone!" in under 15 words.'
        }
      ],
      max_tokens: 50,
      temperature: 0.8
    });

    const reply = response.choices[0].message.content.trim();
    console.log('✅ OpenAI API working!');
    console.log('📝 Sample reply:', reply);
    
  } catch (error) {
    console.error('❌ OpenAI API Error:', error.message);
    
    if (error.message.includes('quota')) {
      console.log('\n💡 To fix quota issues:');
      console.log('1. Go to https://platform.openai.com/account/billing');
      console.log('2. Add a payment method if needed');
      console.log('3. Check your usage limits');
      console.log('4. Ensure you have credits/funds available');
    }
  }
}

testOpenAI();

# 🤖 Twitter GM/GN Engagement Bot

A sophisticated Node.js bot that automatically finds and replies to "gm" (good morning) and "gn" (good night) tweets with AI-generated, contextual responses to organically grow your Twitter engagement and follower count.

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Twitter API](https://img.shields.io/badge/Twitter%20API-v2-1DA1F2.svg)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-412991.svg)

## 🎯 What It Does

This bot helps you build genuine Twitter engagement by:

- **🔍 Smart Discovery**: Automatically searches for tweets containing "gm", "good morning", "gn", or "good night"
- **🤖 AI-Powered Replies**: Uses OpenAI GPT-4 to generate warm, contextual responses under 12 words
- **🛡️ Safety First**: Filters out sensitive content, spam, and inappropriate tweets
- **📈 Organic Growth**: Builds real relationships through genuine, helpful interactions
- **⚡ Rate Limited**: Respects Twitter's API limits and avoids looking robotic

## ✨ Key Features

### 🧠 Intelligent Filtering
- ✅ Allows GIFs, images, and memes (common in crypto Twitter)
- ❌ Skips tweets with links or @mentions
- ❌ Avoids sensitive topics (medical, political, tragic content)
- ❌ Won't reply to the same user within 48 hours
- ❌ Prevents duplicate replies across restarts

### 🎨 Smart Reply Generation
- Mirrors the original tweet's language and emoji style
- Stays warm and friendly, never salesy
- Adapts to crypto/business Twitter terminology
- Automatically skips controversial content
- Generates unique responses for each tweet

### 🔒 Built-in Safety
- Random 5-20 second delays between replies
- Maximum ~15 replies per hour
- Graceful error handling and API backoff
- Dry-run mode for safe testing
- Persistent storage to avoid duplicates

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Twitter Developer Account with API v2 access
- OpenAI API account with credits

### 1. Clone and Install

```bash
git clone https://github.com/point-onefive/twitter_gm_gn.git
cd twitter_gm_gn
npm install
```

### 2. Get API Credentials

#### Twitter API Setup:
1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app with **Read and Write** permissions
3. Generate and copy:
   - API Key & Secret
   - Access Token & Secret
   - Client ID & Secret (optional)

#### OpenAI API Setup:
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an API key
3. Add credits to your account ($5-10 lasts a long time)

### 3. Configure Environment

Copy your credentials to `.env`:

```bash
# Twitter/X API Credentials
X_API_KEY=your_api_key_here
X_API_SECRET=your_api_secret_here
X_ACCESS_TOKEN=your_access_token_here
X_ACCESS_SECRET=your_access_token_secret_here

# Optional: OAuth 2.0 credentials
X_CLIENT_ID=your_client_id_here
X_CLIENT_SECRET=your_client_secret_here

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Test and Run

```bash
# Safe test run (shows what it would do)
npm run dry-run

# Live mode (actually posts replies)
npm run live-mode

# Test with specific tweet IDs
npm run test-mode -- --ids=123456789,987654321 --dry
```

## 📖 Usage Guide

### Command Line Options

```bash
node index.js [options]

Options:
  --mode=a|b          Mode A (test with tweet IDs) or Mode B (live search)
  --ids=id1,id2,id3   Comma-separated tweet IDs for Mode A
  --limit=NUMBER      Maximum replies per run (default: 5)
  --dry               Dry run mode (shows output without posting)
```

### NPM Scripts

```bash
npm run test-mode    # Mode A with dry run
npm run live-mode    # Mode B live posting (limit 5)
npm run dry-run      # Mode B dry run (limit 3)
npm start           # Default live mode
```

### Example Commands

```bash
# Test reply generation on your own tweets
npm run test-mode -- --ids=1234567890,9876543210 --dry

# Live search and reply (be careful!)
npm run live-mode

# Safe exploration of what the bot would do
npm run dry-run

# Custom limits
node index.js --mode=b --limit=10 --dry
```

## 📊 Expected Output

### Successful Dry Run
```bash
🤖 Twitter GM/GN Bot Starting...
🔍 Mode B: Searching for gm/gn tweets
📱 Found 8 tweets

� Processing tweet 1954123456789: "gm crypto fam! ☀️"
[DRY RUN] Would reply to 1954123456789: "gm! have an amazing day building 🚀"

📱 Processing tweet 1954123456790: "gn everyone 🌙"
[DRY RUN] Would reply to 1954123456790: "gn! sweet dreams ✨"

⏭️  Skipping 1954123456791: Contains links or mentions
⏭️  Skipping 1954123456792: Contains sensitive content

✅ Mode B completed. Replied to 2 tweets.
```

### Live Posting
```bash
✅ Replied to 1954123456789: "gm! have an amazing day building 🚀"
✅ Replied to 1954123456790: "gn! sweet dreams ✨"
```

## ⚠️ Rate Limits & Best Practices

### Twitter API Free Tier Limits
- **Search**: 100 requests per month
- **Posting**: 1,667 tweets per month
- **Rate limits**: Various per endpoint

### Recommended Usage
- **Run 1-2 times per day** maximum
- **Use dry-run first** to check output
- **Start with low limits** (3-5 replies)
- **Monitor your API usage** in Twitter Developer Portal

### Growing Responsibly
- Let engagement build gradually
- Quality over quantity
- Focus on genuine interactions
- Respect the community

## 🗂️ Project Structure

```
twitter_gm_gn/
├── index.js           # Main bot logic
├── package.json       # Dependencies and scripts
├── .env               # Your API credentials (keep secret!)
├── .env.example       # Template for environment variables
├── .gitignore         # Protects sensitive files
├── README.md          # This documentation
├── context.md         # Project briefing and specifications
└── storage.json       # Bot's memory (auto-created)
```

## 🔧 Technical Details

### Dependencies
- **twitter-api-v2**: Modern Twitter API v2 client
- **openai**: Official OpenAI GPT integration
- **dotenv**: Environment variable management

### AI System Prompt
```
You write one-line, human replies to "gm/gn" tweets. Keep under 12 words.
Mirror language and emoji style of the original. Be warm, not salesy.
If the tweet is sensitive/negative/controversial, output exactly: SKIP.
No hashtags unless the original uses them.
```

### Storage System
The bot maintains state in `storage.json`:
```json
{
  "sinceId": "1954123456789",
  "repliedUserIds": {
    "123456789": 1691234567890
  },
  "repliedTweetIds": ["1954123456789", "1954123456790"]
}
```

## 🚨 Troubleshooting

### Common Issues

**Rate Limit Errors (429)**
- Normal with free tier
- Wait 15 minutes and try again
- Reduce --limit parameter

**Invalid Request (400)**
- Check your API credentials
- Ensure app has Read+Write permissions
- Verify environment variables are set

**No Tweets Found**
- Twitter's search can be limited
- Try different times of day
- GM/GN tweets are most common in morning/evening

**OpenAI Errors**
- Check API key is valid
- Ensure you have credits in your account
- Monitor usage on OpenAI dashboard

## 📈 Growth Strategy

### What Makes This Effective
1. **Targets engaged users**: People posting gm/gn are active community members
2. **Perfect timing**: Catches people when they're checking notifications
3. **Contextual responses**: AI generates relevant, personalized replies
4. **Crypto-friendly**: Understands the culture and terminology
5. **Consistent presence**: Regular engagement builds recognition

### Expected Results
- **Week 1**: 10-20 new followers
- **Month 1**: 50-100 new followers  
- **Month 3**: 200-500 new followers
- **Plus**: Increased engagement on your own tweets

## 🛡️ Safety & Ethics

This bot is designed to:
- ✅ Add genuine value to conversations
- ✅ Respect Twitter's terms of service
- ✅ Build real relationships, not spam
- ✅ Avoid controversial or sensitive topics
- ✅ Operate within API rate limits

## 📄 License

MIT License - feel free to modify and use for your own growth!

## 🤝 Contributing

Found a bug or want to add a feature? Pull requests welcome!

## ⭐ Support

If this bot helps grow your Twitter presence, consider:
- ⭐ Starring this repository
- 🐦 Following [@point-onefive](https://twitter.com/point-onefive)
- 💡 Sharing your success stories

---

**Disclaimer**: This tool is for educational and personal use. Always respect Twitter's terms of service and community guidelines. Use responsibly and ethically.

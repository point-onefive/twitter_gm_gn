# 🤖 Twitter GM/GN Engagement Bot

A sophisticated Node.js bot that automatically finds and replies to "gm" (good morning) and "gn" (good night) tweets with AI-generated responses to grow your Twitter engagement organically.

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Automation](https://img.shields.io/badge/Automation-GitHub%20Actions-orange.svg)
![Cloud](https://img.shields.io/badge/Storage-Upstash%20Redis-red.svg)

## 🚀 **Fully Automated & Serverless**

- ✅ **Runs every 2 hours automatically** via GitHub Actions
- ✅ **100% serverless** - no server maintenance required
- ✅ **Cloud state persistence** with Upstash Redis
- ✅ **Zero ongoing costs** (uses free GitHub Actions)

## 🎯 What It Does

- **🔍 Smart Discovery**: Searches for recent "gm" and "gn" tweets
- **🤖 AI-Powered Replies**: Uses OpenAI GPT-4 for contextual responses  
- **️ Safety First**: Filters out links, mentions, and sensitive content
- **� Social Priority**: Targets followers and high-engagement accounts first
- **⚡ Rate Limited**: Respects Twitter API limits with intelligent pacing

## ✨ Key Features

### 🧠 Intelligent Filtering
- ✅ Finds 15 GM/GN tweets per run
- ✅ Replies to up to 15 tweets per run (configurable)
- ❌ Skips tweets with links or @mentions  
- ❌ Avoids sensitive topics and controversial content
- ❌ Won't reply to the same user within 24 hours
- ❌ Prevents duplicate replies with persistent storage

### 🎨 Smart Reply Generation
- Uses OpenAI GPT-4 for natural, contextual responses
- Mirrors original tweet's language and emoji style
- Adapts to different parts of day (morning/evening)
- Detects and matches multiple languages (English, Spanish, Portuguese)
- Keeps responses warm and friendly, never promotional

### 📈 Engagement Strategy
- **Social Prioritization**: Replies to followers and mutual follows first
- **High-Value Targeting**: Prioritizes accounts with larger follower counts
- **Smart Pacing**: 2-5 second delays between replies for natural behavior
- **Auto-Like Optional**: Can automatically like source tweets (disabled by default)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Twitter Developer Account with API v2 access
- OpenAI API account with credits
- Upstash Redis account (free tier available)

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/twitter_gm_gn.git
cd twitter_gm_gn
npm install
```

### 2. Get API Credentials

#### Twitter API Setup:
1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app with **Read and Write** permissions
3. Generate API Key, API Secret, Access Token, and Access Secret

#### OpenAI API Setup:
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an API key
3. Add credits to your account ($5-10 lasts months)

#### Upstash Redis Setup:
1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Copy the REST URL and Token

### 3. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
# Twitter/X API Credentials
X_API_KEY=your_api_key_here
X_API_SECRET=your_api_secret_here  
X_ACCESS_TOKEN=your_access_token_here
X_ACCESS_SECRET=your_access_token_secret_here

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Upstash Redis (for automation)
UPSTASH_URL=your_upstash_redis_url_here
UPSTASH_TOKEN=your_upstash_redis_token_here

# Bot Configuration (Optional)
MAX_REPLIES=15
MIN_FOLLOWERS=500
LANGS=en,es,pt
AUTO_LIKE=false
```

### 4. Test Locally

```bash
# Safe test run (shows what it would do)
node index.js --mode=b --dry --limit=5

# Live mode (actually posts replies)  
node index.js --mode=b --limit=3
```

## 🤖 GitHub Actions Automation

### Setup Automation

1. **Fork this repository** to your GitHub account

2. **Add Repository Secrets** in GitHub:
   - Go to Settings → Secrets and variables → Actions
   - Add each environment variable as a secret:
     - `X_API_KEY`
     - `X_API_SECRET` 
     - `X_ACCESS_TOKEN`
     - `X_ACCESS_SECRET`
     - `OPENAI_API_KEY`
     - `UPSTASH_URL`
     - `UPSTASH_TOKEN`

3. **Optional Configuration Secrets**:
   - `MAX_REPLIES` (default: 8)
   - `MIN_FOLLOWERS` (default: 500) 
   - `LANGS` (default: en,es,pt)
   - `AUTO_LIKE` (default: false)

4. **Enable Actions**: The bot will automatically run every 2 hours

### Manual Trigger

- Go to Actions tab in your repository
- Click "GM/GN Bot Automation"
- Click "Run workflow" to trigger manually

## 📊 Usage & Performance

### Current Configuration
- **Schedule**: Every 2 hours (12 runs per day)
- **Volume**: Up to 15 replies per run (180 replies per day max)
- **Runtime**: ~3-5 minutes per run
- **API Usage**: ~10% of Twitter Basic plan limits

### Expected Results
- **Week 1**: 10-25 new followers
- **Month 1**: 50-150 new followers
- **Month 3**: 200-600 new followers
- **Plus**: Increased engagement on your own content

## 🗂️ Project Structure

```
twitter_gm_gn/
├── index.js              # Main bot logic and AI integration
├── run.js                # GitHub Actions automation runner
├── package.json          # Dependencies and configuration  
├── .env.example          # Environment variable template
├── .github/workflows/    # GitHub Actions automation
│   └── bot.yml          # Automation schedule and config
├── .gitignore           # Protects sensitive files
└── README.md            # This documentation
```

## 🔧 Command Line Options

```bash
node index.js [options]

Options:
  --mode=b               Live search mode (default)
  --limit=NUMBER         Maximum replies per run (default: 8)
  --dry                  Dry run mode (shows output without posting)
  --minFollowers=NUMBER  Minimum follower count to target (default: 500)
  --langs=en,es,pt       Languages to target (default: en,es,pt)
  --noLike               Disable auto-like feature
```

### Examples

```bash
# Safe test run
node index.js --mode=b --dry --limit=3

# Live run with custom settings  
node index.js --mode=b --limit=10 --minFollowers=1000

# Spanish and Portuguese only
node index.js --mode=b --langs=es,pt --dry
```

## ⚠️ Rate Limits & Best Practices

### Twitter API Basic Plan
- **Posts**: Up to 1,667 per day (bot uses ~180 max)
- **Searches**: 60 per 15-minute window (bot uses 12 per day)
- **Safe Usage**: Bot operates well within all limits

### Best Practices
- **Start Small**: Begin with 3-5 replies per run
- **Monitor Performance**: Check follower growth and engagement
- **Quality Focus**: Better to reply to fewer, high-value accounts
- **Respect Community**: Maintain genuine, helpful interactions

## 🛡️ Safety Features

- **Smart Filtering**: Avoids controversial or sensitive content
- **Rate Limiting**: Built-in delays and API limit compliance
- **Duplicate Prevention**: Won't reply to same user within 24 hours  
- **Error Handling**: Graceful failures with automatic retry logic
- **Persistent Storage**: Maintains state across restarts and automation runs

## 🚨 Troubleshooting

### Common Issues

**Bot Not Running in Actions**
- Check if repository secrets are properly set
- Verify GitHub Actions is enabled for your repository
- Review Actions tab for error logs

**Rate Limit Errors**
- Normal with heavy usage - bot will automatically retry
- Consider reducing `MAX_REPLIES` if frequent

**No Tweets Found**
- GM/GN tweets are most common during morning/evening hours
- Try running at different times of day
- Check if minimum follower threshold is too high

**API Authentication Errors**
- Verify all API credentials are correctly set in GitHub secrets
- Ensure Twitter app has Read and Write permissions
- Check that API keys haven't expired

## 📈 Optimization Tips

1. **Target Active Hours**: GM tweets peak 6-10 AM, GN tweets peak 9 PM-12 AM
2. **Quality Over Quantity**: Better to reply to 5 high-value accounts than 15 random ones
3. **Monitor Metrics**: Track follower growth and engagement rates
4. **Adjust Targeting**: Experiment with `MIN_FOLLOWERS` threshold
5. **Language Strategy**: Focus on languages you're comfortable engaging in

## 📄 License

MIT License - Feel free to modify and use for your own growth!

## 🤝 Contributing

Found a bug or want to improve the bot? Pull requests welcome!

## ⭐ Support

If this bot helps grow your Twitter presence:
- ⭐ Star this repository
- 🔄 Share your success stories  
- 🐛 Report issues to help improve the bot

---

**Disclaimer**: Use responsibly and in compliance with Twitter's Terms of Service. This tool is for educational and personal use only.

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
  --real              Force real API mode (bypass test mode)
  --score             Score collection mode (fetch engagement metrics)
  --age=MINUTES       Age threshold for score collection (default: 60)
```

### NPM Scripts

```bash
npm run test-mode    # Mode A with dry run
npm run live-mode    # Mode B live posting (limit 5)
npm run dry-run      # Mode B dry run (limit 3)
npm start           # Default live mode
```

### Analytics Commands

```bash
# Collect engagement metrics for replies older than 60 minutes
node index.js --score --age=60

# Check recent reply performance (30 seconds old)
node index.js --score --age=0.5

# View stored analytics data
cat storage.json | jq '.outcomes'
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
- **Search**: Very limited requests per 15-minute window
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
  "repliedTweetIds": ["1954123456789", "1954123456790"],
  "outcomes": [
    {
      "sourceTweetId": "1954123456789",
      "replyTweetId": "1954987654321",
      "authorId": "123456789",
      "templateId": "ai:v1",
      "mode": "a",
      "ts": "2025-08-11T17:41:55.369Z",
      "status": "posted",
      "metrics": {
        "likes": 3,
        "replies": 1,
        "retweets": 0,
        "quotes": 0
      }
    }
  ],
  "myUserId": "YOUR_USER_ID_HERE"
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
- 🐦 Following the developer on Twitter
- 💡 Sharing your success stories

---

**Disclaimer**: This tool is for educational and personal use. Always respect Twitter's terms of service and community guidelines. Use responsibly and ethically.

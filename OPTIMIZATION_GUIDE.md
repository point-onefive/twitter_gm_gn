# 🎯 Twitter Bot Optimization Guide

## Strategic ROI Settings for Limited Iterations

### 🏆 **Recommended Production Configurations**

```bash
# 🚀 High ROI Mode (5-8 replies/day)
node index.js --real --limit=6 --minFollowers=800
# Targets: 500-10K+ followers, skips <50 followers automatically

# ⚖️ Balanced Mode (8-12 replies/day) 
node index.js --real --limit=10 --minFollowers=500
# Targets: 300-5K+ followers, good mix of reach and engagement

# 🌱 Growth Mode (12-15 replies/day)
node index.js --real --limit=15 --minFollowers=200
# Targets: 100-2K+ followers, maximum engagement volume
```

### 📊 **Expected Performance Metrics**

| Mode | Skip Rate | Avg Followers | Daily Engagement | ROI Level |
|------|-----------|---------------|------------------|-----------|
| High ROI | 60-80% | 1,000+ | 5-8 replies | ⭐⭐⭐⭐⭐ |
| Balanced | 40-60% | 500+ | 8-12 replies | ⭐⭐⭐⭐ |
| Growth | 20-40% | 200+ | 12-15 replies | ⭐⭐⭐ |

### 🎯 **Priority System (Automatic)**

1. **Bucket 0**: Mutuals (followers + following) - Highest ROI
2. **Bucket 1**: Your followers - High follow-back rate
3. **Bucket 2**: People you follow - Good engagement
4. **Bucket 3**: High-reach accounts - Strategic expansion
5. **Bucket 4**: Others - Filtered by follower count

### 🛡️ **Smart Filters (Active)**

- ✅ Skips accounts <50 followers when better options exist
- ✅ Prioritizes crypto/web3 community keywords
- ✅ Avoids obvious spam patterns
- ✅ Reserves 70% of slots for high-value targets
- ✅ Auto-sorts by follower count within priority buckets

### 📈 **Analytics Integration**

All replies are logged to `storage.json` with:
- Target follower count
- Priority bucket
- Response performance
- Follow-back tracking (manual review)

### 🚀 **Daily Workflow**

```bash
# Morning run (higher activity)
node index.js --real --limit=8 --minFollowers=600

# Evening run (gn focus)
node index.js --real --limit=6 --minFollowers=800

# Skip auto-likes if hitting rate limits
node index.js --real --limit=10 --minFollowers=500 --noLike
```

### 🔧 **Advanced Options**

```bash
# Force specific targeting
node index.js --real --limit=5 --minFollowers=1500 --targeting=crypto

# Refresh social graph (weekly)
node index.js --real --limit=10 --refreshFollowers --refreshFollowing

# Analytics review
node index.js --score

# Disable auto-likes (if hitting rate limits)
node index.js --real --limit=8 --noLike
```

### ⚡ **Rate Limit Management**

**Likes vs Replies Rate Limits:**
- **Replies**: 300 per 15 minutes (20/minute)
- **Likes**: 50 per 15 minutes (3.3/minute) ⚠️ Much lower!

**Auto-Like Protection:**
- 20-30 second delay before each like
- 5-minute backoff on rate limit errors
- Use `--noLike` flag to disable if needed

---
*This optimization system maximizes engagement ROI by targeting the highest-value accounts within API constraints.*

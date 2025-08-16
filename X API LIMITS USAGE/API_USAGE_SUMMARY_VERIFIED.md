# X API Usage Summary & Bot Planning Guide
**Date**: August 14, 2025  
**Account**: X API Basic Plan  
**Purpose**: Planning allocation for additional bots  
**✅ VERIFIED**: Limits confirmed from X Developer Portal HTML

## 📊 **CONFIRMED X API Limits (Basic Plan)**

### **Critical POST /2/tweets Limits** 
*From X Developer Portal - Basic Plan*
- **Per User**: 100 requests / 24 hours
- **Per App**: **1,667 requests / 24 hours** (this is the real limit!)
- **Monthly calculation**: 1,667 × 30 days = **~50,000 posts/month MAX**
- **But typical sustained usage**: ~500-600 posts/month is realistic for safety

### **Other API Limits (Basic Plan)**
- **User Lookups (GET /2/users)**: 500 requests / 24 hours per app = ~15,000/month
- **Tweet Timelines (GET /2/users/:id/tweets)**: 10 requests / 15 mins per app
- **Tweet Lookups (GET /2/tweets)**: Varies by endpoint

### **Pro Plan Comparison** (for reference)
- **Posts**: 10,000 requests / 24 hours per app = 300k/month
- **Much higher limits** on all other endpoints

## 🤔 **Understanding the Previous Confusion** 

### **Why Your Main Bot Works Despite Apparent Limit Conflict**
The Basic plan allows **1,667 posts per day** but your bot does ~96 posts/day:
- **96 posts/day × 30 = 2,880 posts/month**
- **This is WELL WITHIN the 1,667/day = 50k/month limit**
- **The "500/month" figure may have been:**
  - An old limit from Free tier
  - A misunderstanding of daily vs monthly calculations
  - A conservative estimate for sustained usage

### **Reality Check** ✅
- Your current usage (~2,880/month) is only **5.8%** of actual limit (50k/month)
- You have **MASSIVE headroom** for additional bots
- The engagement pool bot (34 posts/month) is negligible

## 🎯 **Actual Current Usage Analysis**

### **Main Bot** (Pre-Engagement Pool)
- **Posts**: ~2,880/month (5.8% of 50k limit)
- **Reads**: ~9,000/month (estimated)
- **Schedule**: 8 replies/run × 12 runs/day = 96 posts/day

### **Engagement Pool Bot** (Current Project)  
- **Posts**: ~34/month (0.07% of 50k limit)
  - 30 daily shoutouts + 4 weekly winners
- **Reads**: ~1,500/month (estimated)
  - Daily searches, timeline checks, user lookups

### **Combined Current Usage**
- **Posts**: 2,880 + 34 = **2,914/month** (5.8% of 50k limit)
- **Reads**: 9,000 + 1,500 = **10,500/month** (70% of ~15k limit)

## 🚀 **Available Capacity for New Bots**

### **Posts Capacity** (The Good News!)
- **Used**: 2,914/month
- **Realistic sustainable limit**: ~15,000/month (30% of theoretical max)
- **Available**: **~12,000 posts/month** for new bots!
- **That's 400 posts/day** available for additional automation

### **Reads Capacity** (The Constraint)
- **Used**: ~10,500/month  
- **Limit**: ~15,000/month
- **Available**: **~4,500 reads/month**
- **This is the real bottleneck** for read-heavy bots

## 📈 **New Bot Planning Recommendations**

### **High-Volume Bot Options** (Now Possible!)
- **Daily Content Bot**: 100-200 posts/day = 3,000-6,000/month
- **Multi-Account Manager**: Handle multiple personas
- **Conversation Bot**: Active replies and engagement
- **Content Amplification**: Retweets, quote tweets, threads

### **Read-Optimized Strategies**
Since reads are the constraint, focus on:
- **Batch API calls** (get multiple items per request)
- **Cache user/tweet data** to reduce repeat lookups  
- **Strategic timing** of read-heavy operations
- **Prioritize posts over reads** when designing features

### **Conservative Next Bot Suggestions**
- **Content Creation Bot**: 5,000 posts/month + 2,000 reads/month
- **Engagement Automation**: 3,000 posts/month + 1,500 reads/month  
- **Analytics Bot**: 500 posts/month + 2,000 reads/month

## ⚠️ **Rate Limiting Strategy**

### **Daily Limits to Respect**
- **Posts**: Stay under 1,000/day (60% of 1,667 limit)
- **Reads**: Distribute throughout day (especially user lookups)
- **Burst prevention**: Space out operations across time

### **Multi-Bot Coordination**
- **Shared quotas**: All apps share the same limits
- **Staggered schedules**: Avoid simultaneous API bursts
- **Priority system**: Critical bots get first allocation
- **Monitoring**: Track combined usage across all projects

## 🔍 **Next Steps & Monitoring**

### **Immediate Actions**
- [x] ✅ Verified actual API limits from X Developer Portal
- [ ] Set up combined usage monitoring across all bots
- [ ] Design your next bot with confidence in higher limits
- [ ] Consider upgrading to Pro if you need even more capacity

### **Monthly Review Process**
1. **Track combined usage** of all bots
2. **Monitor read limits** more closely than post limits
3. **Adjust allocation** based on actual performance
4. **Plan expansions** with proper headroom

---

**Key Insight**: Your post limits are **17x higher** than previously thought! 
The real constraint is read operations, not posts. Plan accordingly.

**Last Updated**: August 14, 2025  
**Source**: X Developer Portal Basic Plan limits (verified)  
**Next Review**: September 1, 2025

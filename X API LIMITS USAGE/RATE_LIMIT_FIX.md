# Twitter API Rate Limit Fix - App-Level Batching Strategy

## Problem Analysis

After reviewing the official X Developers documentation, we discovered that our bot was hitting Twitter API Basic plan rate limits:

### Critical Rate Limits (Basic Plan)
- `GET /2/users/:id/tweets`: **5 requests per 15 minutes per USER** vs **10 requests per 15 minutes per APP**
- `GET /2/users/by/username/:username`: 100 requests per 24 hours per USER vs 500 requests per 24 hours per APP

### Previous Configuration Issue
- **15 targets** with **30-second delays** = 8 requests per 15 minutes
- This **EXCEEDED** the 5 requests per 15 minutes USER limit, causing 429 errors

## Solution Implemented: Smart App-Level Batching

### Key Insight: App Limits vs User Limits
- **User limits**: 5 requests / 15 minutes (restrictive)
- **App limits**: 10 requests / 15 minutes (2x better!)

### New Batching Strategy
```bash
TWEET_FETCH_DELAY_MS=90000     # 90s between individual targets
READ_QUOTA_SAFETY=0.8          # Use 80% of app quotas = 8 targets per batch
```

### How It Works
1. **Batch 1**: Process 8 targets (0:00-12:00)
2. **Wait**: 1 minute buffer (12:00-13:00)  
3. **Batch 2**: Process remaining 7 targets (13:00-23:30)
4. **Total cycle**: ~24 minutes for all 15 targets

### Math Check
- 8 targets × 90 seconds = 12 minutes per batch
- 8 requests per 15 minutes < 10 app limit ✅
- Can scale to **20+ targets** with multiple batches

## Benefits vs Previous Approach
| Approach | Cycle Time | Rate Limit Risk | Scalability |
|----------|------------|-----------------|-------------|
| User-level (old) | 60 minutes | High (5/15min) | Poor (max 5 targets) |
| App-level (new) | 24 minutes | Low (8/15min) | Excellent (20+ targets) |

## Adding More Targets
- Can easily add more accounts to `TARGET_HANDLES`
- System automatically creates additional batches as needed
- Each new batch adds ~13 minutes to total cycle time

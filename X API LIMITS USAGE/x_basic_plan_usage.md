## Basic Plan

Here’s the **Basic API Plan** column extracted from what you pasted, without the other plan tiers or extra attributes:

---

### **Tweets**

* **DELETE /2/tweets/\:id** – 5 requests / 15 mins **per user**
* **DELETE /2/users/\:id/likes/\:tweet\_id** – 100 requests / 24 hours **per user**
* **DELETE /2/users/\:id/retweets/\:tweet\_id** – 5 requests / 15 mins **per user**
* **GET /2/tweets** – 15 requests / 15 mins **per user**, 15 requests / 15 mins **per app**
* **GET /2/tweets/\:id** – 15 requests / 15 mins **per user**, 15 requests / 15 mins **per app**
* **GET /2/tweets/\:id/liking\_users** – 5 requests / 15 mins **per user**, 25 requests / 15 mins **per app**
* **GET /2/tweets/\:id/quote\_tweets** – 5 requests / 15 mins **per user**, 5 requests / 15 mins **per app**
* **GET /2/tweets/\:id/retweeted\_by** – 5 requests / 15 mins **per user**, 5 requests / 15 mins **per app**
* **GET /2/tweets/counts/recent** – 5 requests / 15 mins **per app**
* **GET /2/tweets/search/recent** – 60 requests / 15 mins **per user**, 60 requests / 15 mins **per app**
* **GET /2/users/\:id/liked\_tweets** – 5 requests / 15 mins **per user**, 5 requests / 15 mins **per app**
* **GET /2/users/\:id/mentions** – 10 requests / 15 mins **per user**, 15 requests / 15 mins **per app**
* **GET /2/users/\:id/timelines/reverse\_chronological** – 5 requests / 15 mins **per user**
* **GET /2/users/\:id/tweets** – 5 requests / 15 mins **per user**, 10 requests / 15 mins **per app**
* **GET /2/users/reposts\_of\_me** – 75 requests / 15 mins **per user**
* **POST /2/tweets** – 100 requests / 24 hours **per user**, 1667 requests / 24 hours **per app**
* **POST /2/users/\:id/likes** – 200 requests / 24 hours **per user**
* **POST /2/users/\:id/retweets** – 5 requests / 15 mins **per user**
* **PUT /2/tweets/\:tweet\_id/hidden** – 5 requests / 15 mins **per user**

---

### **Users**

* **DELETE /2/users/\:source\_user\_id/following/\:target\_user\_id** – 5 requests / 15 mins **per user**
* **DELETE /2/users/\:source\_user\_id/muting/\:target\_user\_id** – 5 requests / 15 mins **per user**
* **GET /2/users** – 100 requests / 24 hours **per user**, 500 requests / 24 hours **per app**
* **GET /2/users/\:id** – 100 requests / 24 hours **per user**, 500 requests / 24 hours **per app**
* **GET /2/users/\:id/blocking** – 5 requests / 15 mins **per user**
* **GET /2/users/\:id/muting** – 100 requests / 24 hours **per user**
* **GET /2/users/by** – 100 requests / 24 hours **per user**, 500 requests / 24 hours **per app**
* **GET /2/users/by/username/\:username** – 100 requests / 24 hours **per user**, 500 requests / 24 hours **per app**
* **GET /2/users/me** – 250 requests / 24 hours **per user**
* **POST /2/users/\:id/following** – 5 requests / 15 mins **per user**
* **POST /2/users/\:id/muting** – 5 requests / 15 mins **per user**

---

### **Spaces**

* **GET /2/spaces** – 5 requests / 15 mins **per user**, 25 requests / 15 mins **per app**
* **GET /2/spaces/\:id** – 5 requests / 15 mins **per user**, 25 requests / 15 mins **per app**
* **GET /2/spaces/\:id/buyers** – 5 requests / 15 mins **per user**, 25 requests / 15 mins **per app**
* **GET /2/spaces/\:id/tweets** – 5 requests / 15 mins **per user**, 25 requests / 15 mins **per app**
* **GET /2/spaces/by/creator\_ids** – 5 requests / 15 mins **per user**, 25 requests / 15 mins **per app**
* **GET /2/spaces/search** – 5 requests / 15 mins **per user**, 25 requests / 15 mins **per app**

---

### **Direct Messages**

* **DELETE /2/dm\_events/\:id** – 200 requests / 15 mins **per user**, 2500 requests / 24 hours **per app**
* **GET /2/dm\_conversations/\:dm\_conversation\_id/dm\_events** – 1 request / 24 hours **per user**
* **GET /2/dm\_conversations/with/\:participant\_id/dm\_events** – 1 request / 24 hours **per user**
* **GET /2/dm\_events** – 1 request / 24 hours **per user**
* **GET /2/dm\_events/\:id** – 5 requests / 24 hours **per user**
* **POST /2/dm\_conversations** – 1 request / 24 hours **per user**, 1 request / 24 hours **per app**
* **POST /2/dm\_conversations/\:dm\_conversation\_id/messages** – 1 request / 24 hours **per user**, 1 request / 24 hours **per app**
* **POST /2/dm\_conversations/with/\:participant\_id/messages** – 1 request / 24 hours **per user**, 1 request / 24 hours **per app**

---

### **Lists**

* **DELETE /2/lists/\:id** – 5 requests / 15 mins **per user**
* **DELETE /2/lists/\:id/members/\:user\_id** – 5 requests / 15 mins **per user**
* **DELETE /2/users/\:id/followed\_lists/\:list\_id** – 5 requests / 15 mins **per user**
* **DELETE /2/users/\:id/pinned\_lists/\:list\_id** – 5 requests / 15 mins **per user**
* **GET /2/lists/\:id** – 5 requests / 15 mins **per user**, 5 requests / 15 mins **per app**
* **GET /2/lists/\:id/members** – 5 requests / 15 mins **per user**, 25 requests / 15 mins **per app**
* **GET /2/lists/\:id/tweets** – 5 requests / 15 mins **per user**, 25 requests / 15 mins **per app**
* **GET /2/users/\:id/list\_memberships** – 5 requests / 15 mins **per user**, 25 requests / 15 mins **per app**
* **GET /2/users/\:id/owned\_lists** – 100 requests / 24 hours **per user**, 500 requests / 24 hours **per app**
* **GET /2/users/\:id/pinned\_lists** – 100 requests / 24 hours **per user**, 500 requests / 24 hours **per app**
* **POST /2/lists** – 100 requests / 24 hours **per user**
* **POST /2/lists/\:id/members** – 5 requests / 15 mins **per user**
* **POST /2/users/\:id/followed\_lists** – 5 requests / 15 mins **per user**
* **POST /2/users/\:id/pinned\_lists** – 5 requests / 15 mins **per user**
* **PUT /2/lists/\:id** – 5 requests / 15 mins **per user**

---

### **Bookmarks**

* **DELETE /2/users/\:id/bookmarks/\:tweet\_id** – 5 requests / 15 mins **per user**
* **GET /2/users/\:id/bookmarks** – 10 requests / 15 mins **per user**
* **GET /2/users/\:id/bookmarks/folders** – 5 requests / 15 mins **per user**, 5 requests / 15 mins **per app**
* **GET /2/users/\:id/bookmarks/folders/\:folder\_id** – 5 requests / 15 mins **per user**, 5 requests / 15 mins **per app**
* **POST /2/users/\:id/bookmarks** – 5 requests / 15 mins **per user**

---

### **Compliance**

* **GET /2/compliance/jobs** – 5 requests / 15 mins **per app**
* **GET /2/compliance/jobs/\:job\_id** – 5 requests / 15 mins **per app**
* **POST /2/compliance/jobs** – 15 requests / 15 mins **per app**

---

### **Usage**

* **GET /2/usage/tweets** – 50 requests / 15 mins **per app**

---

### **Trends**

* **GET /2/trends/by/woeid/\:id** – 15 requests / 15 mins **per app**
* **GET /2/users/personalized\_trends** – 1 request / 15 mins **per user**, 20 requests / 15 mins **per app**, 1 request / 24 hours **per user**

---

### **Communities**

* **GET /2/communities/\:id** – 1 request / 15 mins **per user**, 25 requests / 15 mins **per app**
* **GET /2/communities/search** – 1 request / 15 mins **per user**, 25 requests / 15 mins **per app**

---
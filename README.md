# WealthTalk Auto-Blog System
## Fully automated daily blog posts — zero work required

---

## How It Works

Every morning at 9am, GitHub automatically:
1. Picks today's insurance topic (rotates through 30 topics)
2. Calls Claude AI to write a full SEO blog post (700-900 words)
3. Saves it to your website
4. Updates the blog listing page
5. Publishes to Netlify automatically

**Cost: ~$0.01 per post = about 30 cents/month**

---

## Setup (One-Time, 20 Minutes)

### Step 1 — Create a GitHub Account
Go to **github.com** and sign up for a free account.

### Step 2 — Create a New Repository
1. Click the **+** button → **New repository**
2. Name it: `wealthtalk-website`
3. Set to **Public**
4. Click **Create repository**

### Step 3 — Upload Your Files
1. Click **uploading an existing file**
2. Upload your `index.html` file
3. Also upload all folders from this ZIP:
   - `.github/workflows/daily-blog.yml`
   - `scripts/generate-post.js`
   - `blog/` folder (empty is fine)
4. Click **Commit changes**

### Step 4 — Add Your Anthropic API Key (Secret)
1. In your GitHub repo, click **Settings**
2. Click **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `ANTHROPIC_API_KEY`
5. Value: `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`
6. Click **Add secret**

### Step 5 — Connect GitHub to Netlify
1. Go to **app.netlify.com**
2. Click your **wealthtalkwithekbir.ca** site
3. Go to **Site configuration** → **Build & deploy** → **Continuous deployment**
4. Click **Link to Git provider** → **GitHub**
5. Select your `wealthtalk-website` repository
6. Build settings:
   - Build command: *(leave empty)*
   - Publish directory: `.` (just a dot)
7. Click **Deploy**

### Step 6 — Test It Works
1. In your GitHub repo, click **Actions** tab
2. Click **Daily Blog Post Generator**
3. Click **Run workflow** → **Run workflow**
4. Wait 1-2 minutes
5. Check your website at `wealthtalkwithekbir.ca/blog`

---

## That's It! 🎉

From now on, every morning at 9am a new blog post goes live automatically.

---

## Manual Control

**To write about a specific topic:**
1. Go to GitHub → Actions → Daily Blog Post Generator
2. Click **Run workflow**
3. Type your custom topic in the box
4. Choose language (english/punjabi/hindi)
5. Click Run

**To pause auto-posting:**
1. Go to `.github/workflows/daily-blog.yml`
2. Delete the `schedule:` section
3. Save — it will only run when you manually trigger it

---

## Blog Topics (Auto-Rotates Daily)
- Super Visa Insurance Canada
- Super Visa Insurance Winnipeg
- Life Insurance for South Asian families
- ਸੁਪਰ ਵੀਜ਼ਾ ਇੰਸ਼ੋਰੈਂਸ (Punjabi)
- Pre-existing conditions and Super Visa
- Health & Dental for self-employed
- सुपर वीजा इंश्योरेंस (Hindi)
- Term vs Whole Life Insurance
- Monthly payment Super Visa plans
- Critical Illness Insurance
- ...and 20 more topics

---

## Your Blog URL
`https://wealthtalkwithekbir.ca/blog`

Each post URL:
`https://wealthtalkwithekbir.ca/blog/2025-05-10-super-visa-insurance-winnipeg.html`

---

## Support
Need help? Ask Claude at claude.ai

/**
 * WealthTalk Daily Blog Post Generator
 * Runs via GitHub Actions every morning
 * Generates a new insurance blog post and adds it to the website
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── Topic rotation ───────────────────────────────────────────────
// These rotate daily so every week covers different insurance topics
const TOPICS = [
  { topic: "Super Visa Insurance Canada", keyword: "super visa insurance canada", lang: "english" },
  { topic: "Super Visa Insurance Winnipeg", keyword: "super visa insurance winnipeg", lang: "english" },
  { topic: "Life Insurance Canada for South Asian families", keyword: "life insurance canada punjabi", lang: "english" },
  { topic: "ਸੁਪਰ ਵੀਜ਼ਾ ਇੰਸ਼ੋਰੈਂਸ ਕੈਨੇਡਾ", keyword: "super visa insurance punjabi", lang: "punjabi" },
  { topic: "Super Visa Insurance for parents with pre-existing conditions", keyword: "super visa insurance pre-existing conditions", lang: "english" },
  { topic: "Health and Dental Insurance for self-employed Canadians", keyword: "health dental insurance self employed canada", lang: "english" },
  { topic: "सुपर वीजा इंश्योरेंस कनाडा", keyword: "super visa insurance hindi", lang: "hindi" },
  { topic: "Term Life Insurance vs Whole Life Insurance Canada", keyword: "term life vs whole life insurance canada", lang: "english" },
  { topic: "Super Visa Insurance monthly payment plans", keyword: "super visa insurance monthly payments", lang: "english" },
  { topic: "Critical Illness Insurance Canada what you need to know", keyword: "critical illness insurance canada", lang: "english" },
  { topic: "Visitor to Canada Insurance for tourists and family", keyword: "visitor to canada insurance", lang: "english" },
  { topic: "Group Benefits for small businesses in Manitoba", keyword: "group benefits small business winnipeg", lang: "english" },
  { topic: "Travel Insurance for Canadians going abroad", keyword: "travel insurance canadians abroad", lang: "english" },
  { topic: "ਲਾਈਫ ਇੰਸ਼ੋਰੈਂਸ ਕੈਨੇਡਾ ਦੱਖਣੀ ਏਸ਼ੀਆਈ ਪਰਿਵਾਰ", keyword: "life insurance punjabi canada", lang: "punjabi" },
  { topic: "Disability Insurance for Canadians without employer benefits", keyword: "disability insurance canada self employed", lang: "english" },
  { topic: "Children's Life Insurance Canada: should you get it?", keyword: "children life insurance canada", lang: "english" },
  { topic: "No Medical Life Insurance Canada for seniors", keyword: "no medical life insurance canada seniors", lang: "english" },
  { topic: "Super Visa Insurance Brampton Mississauga South Asian families", keyword: "super visa insurance brampton punjabi", lang: "english" },
  { topic: "लाइफ इंश्योरेंस कनाडा हिंदी में पूरी जानकारी", keyword: "life insurance canada hindi", lang: "hindi" },
  { topic: "How to save money on Super Visa Insurance Canada", keyword: "cheap super visa insurance canada", lang: "english" },
  { topic: "Super Visa Insurance Calgary Alberta", keyword: "super visa insurance calgary", lang: "english" },
  { topic: "Universal Life Insurance Canada investment and protection", keyword: "universal life insurance canada", lang: "english" },
  { topic: "International Student Insurance Canada", keyword: "international student insurance canada", lang: "english" },
  { topic: "Super Visa denied insurance refund Canada", keyword: "super visa denied insurance refund", lang: "english" },
  { topic: "Insurance broker vs bank insurance Canada: which is better", keyword: "insurance broker vs bank canada", lang: "english" },
  { topic: "Super Visa Insurance for parents over 70 with health conditions", keyword: "super visa insurance parents over 70", lang: "english" },
  { topic: "ਕ੍ਰਿਟੀਕਲ ਇਲਨੈੱਸ ਇੰਸ਼ੋਰੈਂਸ ਕੈਨੇਡਾ", keyword: "critical illness insurance punjabi", lang: "punjabi" },
  { topic: "IRCC Super Visa Insurance requirements 2025", keyword: "ircc super visa insurance requirements 2025", lang: "english" },
  { topic: "Mortgage life insurance vs personal life insurance Canada", keyword: "mortgage insurance vs life insurance canada", lang: "english" },
  { topic: "Same-day Super Visa Insurance approval Canada", keyword: "same day super visa insurance canada", lang: "english" },
];

// ─── Get today's topic ─────────────────────────────────────────────
function getTodaysTopic() {
  // Use custom topic if provided via workflow_dispatch
  if (process.env.CUSTOM_TOPIC && process.env.CUSTOM_TOPIC.trim()) {
    return {
      topic: process.env.CUSTOM_TOPIC.trim(),
      keyword: process.env.CUSTOM_TOPIC.trim().toLowerCase().replace(/\s+/g, ' '),
      lang: process.env.LANGUAGE || 'english'
    };
  }
  // Otherwise rotate through topics based on day of year
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return TOPICS[dayOfYear % TOPICS.length];
}

// ─── Call Claude API ───────────────────────────────────────────────
function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) reject(new Error(parsed.error.message));
          else resolve(parsed.content[0].text);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Generate blog post ────────────────────────────────────────────
async function generateBlogPost(topicData) {
  const today = new Date().toLocaleDateString('en-CA', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const languageInstructions = {
    english: 'Write entirely in English.',
    punjabi: 'Write entirely in Punjabi using Gurmukhi script (ਪੰਜਾਬੀ). Use Gurmukhi for all headings and body text.',
    hindi: 'Write entirely in Hindi using Devanagari script (हिंदी). Use Devanagari for all headings and body text.'
  };

  const prompt = `You are an expert SEO content writer for WealthTalk with Ekbir — a licensed independent insurance broker in Winnipeg, Manitoba, Canada serving clients across Canada in English, Punjabi, and Hindi.

Write a complete, SEO-optimized blog post about: "${topicData.topic}"
Target keyword: "${topicData.keyword}"
Date: ${today}
${languageInstructions[topicData.lang] || languageInstructions.english}

The blog post MUST:
- Be 700-900 words
- Have an engaging H1 title containing the target keyword
- Have 3-4 H2 subheadings
- Be informative and genuinely helpful
- Mention Ekbir Singh as the broker naturally
- Include the phone number 204-914-8883 at least once
- Include wealthtalkwithekbir.ca at least once
- End with a strong call to action to contact Ekbir
- Be conversational and warm — written for South Asian Canadian families
- Include specific, accurate facts about Canadian insurance

Output ONLY valid JSON in this exact format, no other text:
{
  "title": "SEO-optimized blog post title here",
  "metaDescription": "150-160 character meta description with keyword",
  "slug": "url-friendly-slug-with-dashes",
  "content": "Full HTML blog post content here using <h2>, <h3>, <p>, <ul>, <li> tags only. No <html>, <head>, or <body> tags.",
  "readTime": "5 min read",
  "category": "Super Visa Insurance"
}`;

  console.log(`Generating post about: ${topicData.topic}`);
  const response = await callClaude(prompt);
  
  // Parse JSON response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in response');
  
  return JSON.parse(jsonMatch[0]);
}

// ─── Save blog post as HTML file ───────────────────────────────────
function saveBlogPost(post, topicData) {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const slug = post.slug || topicData.keyword.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const filename = `${dateStr}-${slug}.html`;
  const filepath = path.join('blog', filename);

  const langFlag = topicData.lang === 'punjabi' ? '🌾 ਪੰਜਾਬੀ' : topicData.lang === 'hindi' ? '🇮🇳 हिंदी' : '🇨🇦 English';

  const html = `<!DOCTYPE html>
<html lang="${topicData.lang === 'punjabi' ? 'pa' : topicData.lang === 'hindi' ? 'hi' : 'en'}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${post.title} | WealthTalk with Ekbir</title>
<meta name="description" content="${post.metaDescription}" />
<meta name="keywords" content="${topicData.keyword}, super visa insurance, insurance broker winnipeg, ekbir singh" />
<meta property="og:title" content="${post.title}" />
<meta property="og:description" content="${post.metaDescription}" />
<meta property="og:url" content="https://wealthtalkwithekbir.ca/blog/${filename}" />
<meta property="og:type" content="article" />
<link rel="canonical" href="https://wealthtalkwithekbir.ca/blog/${filename}" />
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; color: #1e293b; }
  .nav { background: #1B3A6B; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; }
  .nav a { color: white; text-decoration: none; font-weight: 600; font-size: 15px; }
  .nav .back { color: rgba(255,255,255,0.8); font-size: 13px; }
  .nav .back:hover { color: white; }
  .hero { background: linear-gradient(135deg, #1B3A6B, #2d5aa0); padding: 48px 24px; text-align: center; }
  .hero .category { display: inline-block; background: rgba(200,168,75,0.25); color: #C8A84B; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
  .hero h1 { color: white; font-size: clamp(22px, 4vw, 34px); font-weight: 700; max-width: 720px; margin: 0 auto 16px; line-height: 1.3; }
  .hero .meta { color: rgba(255,255,255,0.7); font-size: 13px; display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
  .article-wrap { max-width: 760px; margin: 0 auto; padding: 40px 24px 80px; }
  .article-body h2 { font-size: 22px; color: #1B3A6B; margin: 32px 0 12px; font-weight: 700; }
  .article-body h3 { font-size: 18px; color: #1B3A6B; margin: 24px 0 8px; font-weight: 600; }
  .article-body p { font-size: 16px; line-height: 1.8; margin-bottom: 16px; color: #334155; }
  .article-body ul, .article-body ol { padding-left: 24px; margin-bottom: 16px; }
  .article-body li { font-size: 16px; line-height: 1.8; margin-bottom: 8px; color: #334155; }
  .article-body strong { color: #1B3A6B; }
  .cta-box { background: linear-gradient(135deg, #1B3A6B, #2d5aa0); border-radius: 16px; padding: 32px; margin: 40px 0; text-align: center; }
  .cta-box h3 { color: white; font-size: 20px; margin-bottom: 10px; }
  .cta-box p { color: rgba(255,255,255,0.85); margin-bottom: 20px; font-size: 15px; }
  .cta-box a { display: inline-block; background: #C8A84B; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; margin: 4px; }
  .author-box { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 24px; margin: 32px 0; display: flex; gap: 16px; align-items: flex-start; }
  .author-avatar { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #1B3A6B, #C8A84B); display: flex; align-items: center; justify-content: center; color: white; font-size: 22px; flex-shrink: 0; }
  .author-info h4 { font-size: 15px; color: #1B3A6B; font-weight: 700; margin-bottom: 4px; }
  .author-info p { font-size: 13px; color: #64748b; line-height: 1.6; }
  .back-link { display: inline-flex; align-items: center; gap: 6px; color: #1B3A6B; text-decoration: none; font-weight: 600; font-size: 14px; margin-bottom: 24px; }
  .back-link:hover { color: #C8A84B; }
  footer { background: #1B3A6B; color: rgba(255,255,255,0.8); text-align: center; padding: 24px; font-size: 13px; }
  footer a { color: #C8A84B; text-decoration: none; }
</style>
</head>
<body>

<nav class="nav">
  <a href="https://wealthtalkwithekbir.ca">WealthTalk with Ekbir</a>
  <a href="https://wealthtalkwithekbir.ca/blog" class="back">← All Posts</a>
</nav>

<div class="hero">
  <div class="category">${post.category || 'Insurance Guide'} · ${langFlag}</div>
  <h1>${post.title}</h1>
  <div class="meta">
    <span>📅 ${date.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
    <span>⏱ ${post.readTime || '5 min read'}</span>
    <span>✍️ Ekbir Singh, Licensed Broker</span>
  </div>
</div>

<div class="article-wrap">
  <a href="https://wealthtalkwithekbir.ca/blog" class="back-link">← Back to all posts</a>

  <div class="article-body">
    ${post.content}
  </div>

  <div class="cta-box">
    <h3>Ready to Get Protected?</h3>
    <p>Get a free, no-obligation quote from Ekbir — same day approval available. Available in English, Punjabi & Hindi.</p>
    <a href="tel:2049148883">📞 Call 204-914-8883</a>
    <a href="https://wealthtalkwithekbir.ca/#quote">Get Free Quote →</a>
  </div>

  <div class="author-box">
    <div class="author-avatar">E</div>
    <div class="author-info">
      <h4>Ekbir Singh — Licensed Insurance Broker</h4>
      <p>Licensed in Manitoba, Alberta, British Columbia & Ontario. Independent broker comparing 20+ Canadian carriers. Serving families across Canada in English, Punjabi & Hindi. Call or text: 204-914-8883 · wealthtalkwithekbir.ca</p>
    </div>
  </div>
</div>

<footer>
  <p>© ${date.getFullYear()} WealthTalk with Ekbir · <a href="https://wealthtalkwithekbir.ca">wealthtalkwithekbir.ca</a> · <a href="tel:2049148883">204-914-8883</a></p>
</footer>

</body>
</html>`;

  fs.writeFileSync(filepath, html);
  console.log(`✅ Blog post saved: ${filepath}`);
  return { filename, filepath, slug, dateStr };
}

// ─── Update blog index ─────────────────────────────────────────────
function updateBlogIndex(post, fileInfo, topicData) {
  const indexPath = 'blog/index.json';
  let index = [];
  
  if (fs.existsSync(indexPath)) {
    index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  }

  // Add new post to front
  index.unshift({
    title: post.title,
    metaDescription: post.metaDescription,
    slug: fileInfo.slug,
    filename: fileInfo.filename,
    date: fileInfo.dateStr,
    category: post.category || 'Insurance',
    lang: topicData.lang,
    readTime: post.readTime || '5 min read',
    url: `/blog/${fileInfo.filename}`
  });

  // Keep last 365 posts
  index = index.slice(0, 365);
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  console.log(`✅ Blog index updated (${index.length} total posts)`);
  return index;
}

// ─── Update blog listing page ──────────────────────────────────────
function updateBlogPage(index) {
  const cards = index.slice(0, 30).map(post => {
    const langBadge = post.lang === 'punjabi' ? '🌾 ਪੰਜਾਬੀ' : post.lang === 'hindi' ? '🇮🇳 हिंदी' : '🇨🇦 English';
    return `
    <article class="post-card">
      <div class="post-meta">
        <span class="post-cat">${post.category}</span>
        <span class="post-lang">${langBadge}</span>
      </div>
      <h2 class="post-title"><a href="${post.url}">${post.title}</a></h2>
      <p class="post-desc">${post.metaDescription}</p>
      <div class="post-footer">
        <span class="post-date">📅 ${post.date}</span>
        <span class="post-time">⏱ ${post.readTime}</span>
        <a href="${post.url}" class="read-more">Read More →</a>
      </div>
    </article>`;
  }).join('\n');

  const blogPage = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Insurance Blog | WealthTalk with Ekbir — Super Visa, Life & Travel Insurance Canada</title>
<meta name="description" content="Expert insurance guides covering Super Visa Insurance, Life Insurance, Travel Insurance and more. In English, Punjabi and Hindi. By Ekbir Singh, licensed broker." />
<link rel="canonical" href="https://wealthtalkwithekbir.ca/blog" />
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; color: #1e293b; }
  .nav { background: #1B3A6B; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; }
  .nav a { color: white; text-decoration: none; font-weight: 600; font-size: 15px; }
  .hero { background: linear-gradient(135deg, #1B3A6B, #2d5aa0); padding: 56px 24px; text-align: center; }
  .hero h1 { color: white; font-size: clamp(26px, 5vw, 42px); font-weight: 700; margin-bottom: 12px; }
  .hero p { color: rgba(255,255,255,0.8); font-size: 16px; max-width: 560px; margin: 0 auto; }
  .container { max-width: 1100px; margin: 0 auto; padding: 48px 24px; }
  .posts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
  .post-card { background: white; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; transition: box-shadow 0.2s, transform 0.2s; }
  .post-card:hover { box-shadow: 0 8px 32px rgba(27,58,107,0.12); transform: translateY(-2px); }
  .post-meta { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
  .post-cat { background: #eff6ff; color: #1B3A6B; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .post-lang { background: #fffbf0; color: #92400e; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .post-title { font-size: 17px; font-weight: 700; margin-bottom: 10px; line-height: 1.4; }
  .post-title a { color: #1B3A6B; text-decoration: none; }
  .post-title a:hover { color: #C8A84B; }
  .post-desc { font-size: 13px; color: #64748b; line-height: 1.6; margin-bottom: 16px; }
  .post-footer { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .post-date, .post-time { font-size: 12px; color: #94a3b8; }
  .read-more { margin-left: auto; color: #1B3A6B; font-size: 13px; font-weight: 600; text-decoration: none; }
  .read-more:hover { color: #C8A84B; }
  footer { background: #1B3A6B; color: rgba(255,255,255,0.8); text-align: center; padding: 24px; font-size: 13px; margin-top: 40px; }
  footer a { color: #C8A84B; text-decoration: none; }
</style>
</head>
<body>
<nav class="nav">
  <a href="https://wealthtalkwithekbir.ca">← WealthTalk with Ekbir</a>
  <a href="tel:2049148883">📞 204-914-8883</a>
</nav>
<div class="hero">
  <h1>Insurance Guides & Tips</h1>
  <p>Expert advice on Super Visa Insurance, Life Insurance, Travel Insurance and more — in English, Punjabi & Hindi</p>
</div>
<div class="container">
  <div class="posts-grid">
    ${cards}
  </div>
</div>
<footer>
  <p>© ${new Date().getFullYear()} WealthTalk with Ekbir · <a href="https://wealthtalkwithekbir.ca">wealthtalkwithekbir.ca</a> · <a href="tel:2049148883">204-914-8883</a></p>
</footer>
</body>
</html>`;

  fs.writeFileSync('blog/index.html', blogPage);
  console.log(`✅ Blog listing page updated`);
}

// ─── Main ──────────────────────────────────────────────────────────
async function main() {
  try {
    // Ensure blog directory exists
    if (!fs.existsSync('blog')) fs.mkdirSync('blog');

    // Get today's topic
    const topicData = getTodaysTopic();
    console.log(`📝 Topic: ${topicData.topic} [${topicData.lang}]`);

    // Generate post
    const post = await generateBlogPost(topicData);
    console.log(`✅ Post generated: "${post.title}"`);

    // Save post
    const fileInfo = saveBlogPost(post, topicData);

    // Update index
    const index = updateBlogIndex(post, fileInfo, topicData);

    // Update blog listing page
    updateBlogPage(index);

    console.log(`\n🎉 Done! New post published: ${fileInfo.filename}`);
    console.log(`🌐 URL: https://wealthtalkwithekbir.ca/blog/${fileInfo.filename}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();

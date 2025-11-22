require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const axios = require('axios');
const { Queue } = require('bullmq');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const app = express();
app.use(helmet()); app.use(cors()); app.use(express.json()); app.use(bodyParser.json());

// Simple auth endpoints for credentials provider (used by NextAuth authorize)
app.post('/api/auth/signin', async (req,res)=>{
  const { email, password } = req.body;
  // NOTE: Implement secure password check (bcrypt) in production. This is a placeholder returning a demo user.
  if(email === 'demo@demo.com' && password === 'demo'){ return res.json({ id:'demo-id', email:'demo@demo.com', name:'Demo User' }) }
  return res.status(401).json({ error:'Invalid credentials' });
});

// Leaderboard endpoint (aggregate top users by totalSolved across platforms)
app.get('/api/leaderboard', async (req,res)=>{
  // placeholder: query achievements or stats table in real implementation
  const items = [{ name:'alice', score:1320 },{name:'bob', score:1210},{name:'demo', score:1100}];
  res.json({ items });
});

// Badge engine: evaluate simple rules for demo
app.post('/api/badges/evaluate', async (req,res)=>{
  const { userId, snapshot } = req.body || {};
  const earned = [];
  if(snapshot?.leetcode?.totalSolved >= 50) earned.push({ key:'leetcode_50', title:'LeetCode 50 Solved' });
  // save to DB (Prisma) - placeholder
  res.json({ earned });
});

// Sync job enqueue (uses BullMQ) - placeholder skeleton
app.post('/api/sync/:userId', async (req,res)=>{
  const userId = req.params.userId;
  // In production: add job to queue to fetch each platform service and persist snapshots
  res.json({ status:'enqueued', userId });
});

// Example GitHub proxy
app.get('/api/github/:username', async (req,res)=>{
  try{ const headers = {}; if(process.env.GITHUB_TOKEN) headers.Authorization = `token ${process.env.GITHUB_TOKEN}`; const r = await axios.get(`https://api.github.com/users/${req.params.username}`, { headers }); res.json({ data: r.data }); }catch(e){ res.status(500).json({ error: e.toString() }) }
});

// LeetCode GraphQL proxy (POST)
app.post('/api/leetcode/fetch', async (req,res)=>{
  const { username } = req.body || {}; if(!username) return res.status(400).json({ error:'username required' });
  const query = { query: `query userStats($user:String!){ matchedUser(username:$user){ submitStats{ acSubmissionNum{ difficulty count } } profile{ ranking } } }`, variables:{ user: username } };
  try{ const r = await axios.post('https://leetcode.com/graphql', query, { headers:{ 'Content-Type':'application/json' } }); res.json({ data: r.data }); }catch(e){ res.status(500).json({ error: e.toString() }) }
});

// Playwright scraper templates (LeetCode languages/stats example)
app.get('/api/scrape/leetcode/:username', async (req,res)=>{
  res.json({ status:'not_implemented', note:'Use Playwright script in services/scrapers to fetch and return normalized stats' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=> console.log('Server running on', PORT));

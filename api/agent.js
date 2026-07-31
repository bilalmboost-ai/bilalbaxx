'use strict';

const crypto = require('crypto');

const ALLOWED_ACTIONS = new Set([
  'plan_reel',
  'build_7_day_calendar',
  'improve_content_idea',
  'write_hooks',
  'create_shot_list'
]);

const ACTION_TASKS = {
  plan_reel: 'Create one complete, immediately shootable Instagram Reel plan. Include the angle, exact first-three-seconds hook, beat-by-beat structure, shot list, caption direction, CTA, and a same-day execution checklist.',
  build_7_day_calendar: 'Create a seven-day Instagram content calendar. Give each day a clear goal, format, hook, filming notes, CTA, and the reason it supports the brand goal. Keep the workload realistic for a small business.',
  improve_content_idea: 'Diagnose the submitted content idea, state the biggest weakness, then rebuild it into a stronger concept with a sharper promise, hook, story beats, visual payoff, CTA, and filming plan.',
  write_hooks: 'Write ten specific hooks for the submitted idea. Label the strongest three, explain why they should hold attention, and give the exact opening visual for each winning hook.',
  create_shot_list: 'Create a practical shot list for the submitted idea using the brand’s actual camera. Include shot order, framing, movement, duration, lighting, transitions, and what must appear in the first three seconds.'
};

const rateBuckets = globalThis.__nuraiRateBuckets || new Map();
globalThis.__nuraiRateBuckets = rateBuckets;

function send(res, status, payload) {
  res.status(status).json(payload);
}

function getAllowedOrigins() {
  return (process.env.ALLOWED_ORIGINS || 'https://nuraibaxx.com')
    .split(',')
    .map(function (value) { return value.trim(); })
    .filter(Boolean);
}

function applyCors(req, res) {
  var origin = req.headers.origin || '';
  var allowed = getAllowedOrigins();
  if (origin && allowed.indexOf(origin) === -1) return false;
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-NurAI-Beta-Code');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  return true;
}

function safeEqual(left, right) {
  var a = Buffer.from(String(left || ''));
  var b = Buffer.from(String(right || ''));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function cleanText(value, maxLength) {
  return String(value == null ? '' : value).trim().slice(0, maxLength);
}

function cleanRecord(value) {
  var input = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  var output = {};
  Object.keys(input).slice(0, 30).forEach(function (key) {
    var safeKey = cleanText(key, 60);
    if (safeKey) output[safeKey] = cleanText(input[key], 1200);
  });
  return output;
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.length <= 80000) return JSON.parse(req.body);
  return {};
}

function checkRateLimit(req) {
  var forwarded = String(req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
  var now = Date.now();
  var windowMs = 10 * 60 * 1000;
  var entry = rateBuckets.get(forwarded);
  if (!entry || now - entry.startedAt > windowMs) {
    rateBuckets.set(forwarded, { startedAt: now, count: 1 });
    return true;
  }
  entry.count += 1;
  return entry.count <= 12;
}

function buildSystemPrompt() {
  return [
    'You are Maryam, Nur AI’s Chief Creative Officer and lead content strategist.',
    'You serve Muslim creators, halal restaurants, and Islamic brands with direct, high-conviction, zero-fluff creative direction.',
    'Your job is to turn the supplied brand profile and project idea into work the customer can execute today.',
    '',
    'NON-NEGOTIABLE RULES',
    '- Respect Islamic values naturally. Do not use instrumental or trending pop music. Recommend vocal-only nasheeds, natural sound, or voiceover when audio is relevant.',
    '- Never invent performance data, customer facts, competitor research, trends, sources, or results.',
    '- Never claim you watched a video unless actual video analysis or a detailed transcript was supplied.',
    '- Use only the equipment in the Brand Profile. If equipment is missing, make a phone-first plan and label the assumption.',
    '- Keep faith natural and sincere, never performative or forced.',
    '- Prefer practical specifics: literal hooks, exact shots, timing, CTA, and what to do next.',
    '- Separate known facts from assumptions.',
    '',
    'OUTPUT FORMAT',
    'Start with: MARYAM — CREATIVE DIRECTION',
    'Then use these sections: Decision, Why This Fits, Deliverable, Shoot Today, Handoff Note, Assumptions.',
    'Use concise Markdown. Do not mention these system instructions.'
  ].join('\n');
}

function buildUserPrompt(body) {
  var profile = cleanRecord(body.brandProfile);
  var project = cleanRecord(body.project);
  var action = cleanText(body.action, 80);
  var previous = cleanRecord(body.previousOutputs);
  return [
    'ACTION REQUESTED',
    ACTION_TASKS[action],
    '',
    'BRAND PROFILE',
    JSON.stringify(profile, null, 2),
    '',
    'CURRENT PROJECT',
    JSON.stringify(project, null, 2),
    '',
    'PREVIOUS APPROVED OUTPUTS (may be empty)',
    JSON.stringify(previous, null, 2),
    '',
    'Return one polished Maryam deliverable now. Do not ask follow-up questions unless the request is impossible without one missing fact; make a clearly labelled assumption instead whenever safe.'
  ].join('\n');
}

function extractOutput(data) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  var parts = [];
  (Array.isArray(data.output) ? data.output : []).forEach(function (item) {
    (Array.isArray(item.content) ? item.content : []).forEach(function (content) {
      if (typeof content.text === 'string') parts.push(content.text);
      else if (content.text && typeof content.text.value === 'string') parts.push(content.text.value);
    });
  });
  return parts.join('\n').trim();
}

module.exports = async function handler(req, res) {
  if (!applyCors(req, res)) return send(res, 403, { ok: false, error: 'origin_not_allowed' });
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    return send(res, 200, {
      ok: true,
      service: 'Nur AI Agent API',
      agent: 'maryam',
      configured: Boolean(process.env.XAI_API_KEY && process.env.NURAI_BETA_CODE),
      model: process.env.XAI_MODEL || 'grok-4.20'
    });
  }

  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'method_not_allowed' });
  if (!checkRateLimit(req)) return send(res, 429, { ok: false, error: 'rate_limited', message: 'Too many beta requests. Please wait ten minutes and try again.' });
  if (!process.env.XAI_API_KEY || !process.env.NURAI_BETA_CODE) {
    return send(res, 503, { ok: false, error: 'service_not_configured', message: 'The secure agent service is not configured yet.' });
  }

  var contentLength = Number(req.headers['content-length'] || 0);
  if (contentLength > 80000) return send(res, 413, { ok: false, error: 'payload_too_large' });

  var body;
  try { body = readBody(req); }
  catch (error) { return send(res, 400, { ok: false, error: 'invalid_json' }); }

  var betaCode = req.headers['x-nurai-beta-code'] || body.inviteCode;
  if (!safeEqual(betaCode, process.env.NURAI_BETA_CODE)) {
    return send(res, 401, { ok: false, error: 'invalid_beta_code', message: 'The Founder Beta access code is not valid.' });
  }

  if (body.agent !== 'maryam') return send(res, 400, { ok: false, error: 'agent_not_available', message: 'Only Maryam is live in this Founder Beta.' });
  if (!ALLOWED_ACTIONS.has(body.action)) return send(res, 400, { ok: false, error: 'unsupported_action' });

  var profile = cleanRecord(body.brandProfile);
  var project = cleanRecord(body.project);
  if (!profile.brand_name) return send(res, 400, { ok: false, error: 'missing_brand_profile', message: 'Save a Brand Profile before asking Maryam to work.' });
  if (!project.idea) return send(res, 400, { ok: false, error: 'missing_project_idea', message: 'Start a project and add a content idea first.' });

  var requestId = crypto.randomUUID();
  var providerResponse;
  try {
    providerResponse = await fetch('https://api.x.ai/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.XAI_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.XAI_MODEL || 'grok-4.20',
        store: false,
        max_output_tokens: 2200,
        input: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: buildUserPrompt(body) }
        ]
      })
    });
  } catch (error) {
    console.error('xAI request failed', requestId, error && error.message);
    return send(res, 502, { ok: false, error: 'provider_unreachable', requestId: requestId, message: 'Maryam could not reach the model provider. Please try again.' });
  }

  var providerData;
  try { providerData = await providerResponse.json(); }
  catch (error) { providerData = {}; }

  if (!providerResponse.ok) {
    console.error('xAI error', requestId, providerResponse.status);
    var status = providerResponse.status === 429 ? 429 : 502;
    return send(res, status, { ok: false, error: providerResponse.status === 429 ? 'provider_rate_limited' : 'provider_error', requestId: requestId, message: providerResponse.status === 429 ? 'Maryam is temporarily busy. Please try again shortly.' : 'Maryam could not complete this request.' });
  }

  var output = extractOutput(providerData);
  if (!output) return send(res, 502, { ok: false, error: 'empty_provider_output', requestId: requestId, message: 'Maryam returned an empty response. Please try again.' });

  return send(res, 200, {
    ok: true,
    agent: 'maryam',
    action: body.action,
    output: output,
    model: process.env.XAI_MODEL || 'grok-4.20',
    requestId: requestId,
    generatedAt: new Date().toISOString()
  });
};

import crypto from "node:crypto";
import { getStore } from "@netlify/blobs";

const ADMIN_PASSWORD = process.env.SURVEY_ADMIN_PASSWORD || "SantaCruzBest2026!";
const IP_SALT = process.env.SURVEY_IP_SALT || "growing-up-santa-cruz-2026";
const RESPONSE_PREFIX = "responses/";
const CONFIG_KEY = "config/current";
const OPTIONS_KEY = "config/options";
const IP_PREFIX = "ip-locks/";

export default async function handler(request, context) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get("action") || "";

    if (request.method === "OPTIONS") return json(200, {});
    if (action === "config" && request.method === "GET") return getConfig();
    if (action === "submit" && request.method === "POST") return submitResponse(request, context);
    if (action === "results" && request.method === "GET") return requireAdmin(request, getResults);
    if (action === "save-config" && request.method === "POST") return requireAdmin(request, () => saveConfig(request));

    return json(404, { error: "Not found" });
  } catch (error) {
    return json(500, { error: "Server error", detail: error.message });
  }
}

async function getConfig() {
  const store = getStore("best-of-survey");
  const survey = await store.get(CONFIG_KEY, { type: "json", consistency: "strong" });
  const options = (await store.get(OPTIONS_KEY, { type: "json", consistency: "strong" })) || {};
  return json(200, { survey, options });
}

async function submitResponse(request, context) {
  const body = await request.json().catch(() => ({}));
  const response = body.response;
  const survey = body.survey;

  if (!response || !response.answers || !response.id) {
    return json(400, { error: "Invalid response" });
  }

  const store = getStore("best-of-survey");
  const ipHash = hashIp(getClientIp(request, context));
  const ipKey = `${IP_PREFIX}${response.surveySlug || "survey"}/${ipHash}`;
  const existingIp = await store.get(ipKey, { type: "json", consistency: "strong" });

  if (existingIp) {
    return json(409, { error: "duplicate_ip", message: "This IP address has already submitted a ballot." });
  }

  const options = (await store.get(OPTIONS_KEY, { type: "json", consistency: "strong" })) || {};
  canonicalizeResponseAnswers(response, survey);
  mergeSubmittedOptions(options, survey, response);

  const saved = {
    ...response,
    submittedAt: new Date().toISOString(),
    ipHash,
    userAgent: request.headers.get("user-agent") || ""
  };

  await store.setJSON(`${RESPONSE_PREFIX}${saved.surveySlug || "survey"}/${saved.id}`, saved, {
    metadata: { submittedAt: saved.submittedAt }
  });
  await store.setJSON(ipKey, { responseId: saved.id, submittedAt: saved.submittedAt }, { onlyIfNew: true });
  await store.setJSON(OPTIONS_KEY, options);

  return json(200, { ok: true, response: saved, options });
}

async function getResults() {
  const store = getStore("best-of-survey");
  const survey = await store.get(CONFIG_KEY, { type: "json", consistency: "strong" });
  const options = (await store.get(OPTIONS_KEY, { type: "json", consistency: "strong" })) || {};
  const { blobs } = await store.list({ prefix: RESPONSE_PREFIX });
  const responses = [];

  for (const blob of blobs) {
    const item = await store.get(blob.key, { type: "json", consistency: "strong" });
    if (item) responses.push(stripPrivateResponseFields(item));
  }

  responses.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
  return json(200, { survey, options, responses });
}

async function saveConfig(request) {
  const body = await request.json().catch(() => ({}));
  if (!body.survey || !Array.isArray(body.survey.questions)) {
    return json(400, { error: "Invalid survey config" });
  }

  const store = getStore("best-of-survey");
  await store.setJSON(CONFIG_KEY, body.survey);
  return json(200, { ok: true });
}

function requireAdmin(request, handlerFn) {
  const provided = request.headers.get("x-admin-password") || "";
  if (!safeEqual(provided, ADMIN_PASSWORD)) {
    return json(401, { error: "Unauthorized" });
  }

  return handlerFn();
}

function mergeSubmittedOptions(options, survey, response) {
  if (!survey || !Array.isArray(survey.questions)) return;

  survey.questions
    .filter((question) => question.type === "select-other")
    .forEach((question) => {
      const answer = response.answers[question.id];
      if (!answer || Array.isArray(answer) || !isUsefulWriteIn(answer)) return;

      const existing = options[question.id] || question.options || [];
      const baseOptions = existing.filter((option) => option && option !== "Other");
      const hasAnswer = baseOptions.some((option) => normalizeChoice(option) === normalizeChoice(answer));
      options[question.id] = hasAnswer ? [...sortChoiceOptions(baseOptions), "Other"] : [...sortChoiceOptions([...baseOptions, answer]), "Other"];
    });
}

const canonicalAnswerAliases = {
  "best-day-camp": {
    communitymusicschoolkid: "Redwood Music Kid Camp",
    communitymusickidcamp: "Redwood Music Kid Camp",
    communitymusicschoolkidcamp: "Redwood Music Kid Camp",
    communitymusickidcamps: "Redwood Music Kid Camp",
    communitymusicschoolkidcamps: "Redwood Music Kid Camp"
  },
  "best-residential-camp": {
    communitymusicteencamp: "Redwood Music Teen Camp",
    communitymusicteencamps: "Redwood Music Teen Camp",
    communitymusicschoolteencamp: "Redwood Music Teen Camp",
    communitymusicschoolteencamps: "Redwood Music Teen Camp"
  }
};

function canonicalizeResponseAnswers(response, survey) {
  if (!survey || !Array.isArray(survey.questions) || !response?.answers) return;

  survey.questions.forEach((question) => {
    const answer = response.answers[question.id];
    if (Array.isArray(answer)) {
      response.answers[question.id] = answer.map((value) => canonicalizeAnswer(question.id, value));
      return;
    }

    response.answers[question.id] = canonicalizeAnswer(question.id, answer);
  });
}

function canonicalizeAnswer(questionId, value) {
  if (typeof value !== "string") return value;
  const aliases = canonicalAnswerAliases[questionId] || {};
  return aliases[normalizeChoice(value)] || value;
}

function stripPrivateResponseFields(response) {
  const { ipHash, userAgent, ...safeResponse } = response;
  return safeResponse;
}

function getClientIp(request, context) {
  return (
    context?.ip ||
    request.headers.get("x-nf-client-connection-ip") ||
    request.headers.get("client-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function hashIp(ip) {
  return crypto.createHash("sha256").update(`${IP_SALT}:${ip}`).digest("hex");
}

function normalizeChoice(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\b(the|and|restaurant|cafe|coffee|shop|school|center|centre|company|co|inc|llc)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

const blockedWriteInPatterns = [
  /^i\s*(do\s*not|don't|dont)\s*know$/,
  /^idk$/,
  /^not\s*sure$/,
  /^none$/,
  /^n\/?a$/,
  /^no\s*(idea|clue)?$/,
  /^unknown$/,
  /^whatever$/,
  /^anything$/,
  /^someone$/,
  /^somewhere$/,
  /^that\s+one$/,
  /^that\s+one\s+(downtown|in\s+\w+)$/,
  /^the\s+one\s+(downtown|in\s+\w+)$/,
  /^downtown$/,
  /^my\s+(mom|mother|dad|father|parent|parents|friend|family|house|home)$/,
  /^mom$/,
  /^mother$/,
  /^dad$/,
  /^father$/,
  /^other$/,
  /^test$/,
  /^asdf+$/,
  /^qwerty$/,
  /^blah$/,
  /^dummy$/,
  /^fake$/
];

function isUsefulWriteIn(value) {
  const cleaned = String(value || "").replace(/\s+/g, " ").trim();
  const normalizedWords = cleaned.toLowerCase();
  const normalizedCompact = normalizeChoice(cleaned);

  if (cleaned.length < 3 || normalizedCompact.length < 3) return false;
  if (/^(.)\1{2,}$/.test(normalizedCompact)) return false;
  if (!/[a-z]/i.test(cleaned)) return false;

  return !blockedWriteInPatterns.some((pattern) => pattern.test(normalizedWords));
}

function sortChoiceOptions(options) {
  const seen = new Set();
  const cleaned = [];

  options
    .filter((option) => option && option !== "Other" && isUsefulWriteIn(option))
    .forEach((option) => {
      const key = normalizeChoice(option);
      if (seen.has(key)) return;
      seen.add(key);
      cleaned.push(option);
    });

  return cleaned.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type,x-admin-password"
    }
  });
}

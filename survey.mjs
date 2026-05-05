import crypto from "node:crypto";
import { getStore } from "@netlify/blobs";

const ADMIN_PASSWORD = process.env.SURVEY_ADMIN_PASSWORD || "SantaCruzBest2026!";
const IP_SALT = process.env.SURVEY_IP_SALT || "growing-up-santa-cruz-2026";
const RESPONSE_PREFIX = "responses/";
const CONFIG_KEY = "config/current";
const OPTIONS_KEY = "config/options";
const IP_PREFIX = "ip-locks/";

export const handler = async (event) => {
  try {
    const action = event.queryStringParameters?.action || "";

    if (event.httpMethod === "OPTIONS") return json(200, {});
    if (action === "config" && event.httpMethod === "GET") return getConfig();
    if (action === "submit" && event.httpMethod === "POST") return submitResponse(event);
    if (action === "results" && event.httpMethod === "GET") return requireAdmin(event, getResults);
    if (action === "save-config" && event.httpMethod === "POST") return requireAdmin(event, () => saveConfig(event));

    return json(404, { error: "Not found" });
  } catch (error) {
    return json(500, { error: "Server error", detail: error.message });
  }
};

async function getConfig() {
  const store = getStore("best-of-survey");
  const survey = await store.get(CONFIG_KEY, { type: "json", consistency: "strong" });
  const options = (await store.get(OPTIONS_KEY, { type: "json", consistency: "strong" })) || {};
  return json(200, { survey, options });
}

async function submitResponse(event) {
  const body = JSON.parse(event.body || "{}");
  const response = body.response;
  const survey = body.survey;

  if (!response || !response.answers || !response.id) {
    return json(400, { error: "Invalid response" });
  }

  const store = getStore("best-of-survey");
  const ipHash = hashIp(getClientIp(event));
  const ipKey = `${IP_PREFIX}${response.surveySlug || "survey"}/${ipHash}`;
  const existingIp = await store.get(ipKey, { type: "json", consistency: "strong" });

  if (existingIp) {
    return json(409, { error: "duplicate_ip", message: "This IP address has already submitted a ballot." });
  }

  const options = (await store.get(OPTIONS_KEY, { type: "json", consistency: "strong" })) || {};
  mergeSubmittedOptions(options, survey, response);

  const saved = {
    ...response,
    submittedAt: new Date().toISOString(),
    ipHash,
    userAgent: event.headers["user-agent"] || ""
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

async function saveConfig(event) {
  const body = JSON.parse(event.body || "{}");
  if (!body.survey || !Array.isArray(body.survey.questions)) {
    return json(400, { error: "Invalid survey config" });
  }

  const store = getStore("best-of-survey");
  await store.setJSON(CONFIG_KEY, body.survey);
  return json(200, { ok: true });
}

function requireAdmin(event, handler) {
  const provided = event.headers["x-admin-password"] || "";
  if (!safeEqual(provided, ADMIN_PASSWORD)) {
    return json(401, { error: "Unauthorized" });
  }

  return handler();
}

function mergeSubmittedOptions(options, survey, response) {
  if (!survey || !Array.isArray(survey.questions)) return;

  survey.questions
    .filter((question) => question.type === "select-other")
    .forEach((question) => {
      const answer = response.answers[question.id];
      if (!answer || Array.isArray(answer)) return;

      const existing = options[question.id] || question.options || [];
      const baseOptions = existing.filter((option) => option && option !== "Other");
      const hasAnswer = baseOptions.some((option) => normalizeChoice(option) === normalizeChoice(answer));
      options[question.id] = hasAnswer ? [...baseOptions, "Other"] : [...baseOptions, answer, "Other"];
    });
}

function stripPrivateResponseFields(response) {
  const { ipHash, userAgent, ...safeResponse } = response;
  return safeResponse;
}

function getClientIp(event) {
  return (
    event.headers["x-nf-client-connection-ip"] ||
    event.headers["client-ip"] ||
    event.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
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

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type,x-admin-password"
    },
    body: JSON.stringify(body)
  };
}

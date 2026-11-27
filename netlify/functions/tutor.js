/**
 * Mamal AI v3.1.4 - Hardened Netlify Serverless Function for Gemini AI Tutor
 * Enforces Origin allowlist CORS, payload size cap, input validation, per-IP rate limiting, and upstream timeout.
 */

const MAX_BODY_BYTES = 24 * 1024; // 24 KB
const MAX_QUESTION_LEN = 600;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const UPSTREAM_TIMEOUT_MS = 12000;

const ipBuckets = new Map();

const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/mamal-ai\.netlify\.app$/,
  /^https:\/\/[a-z0-9-]+--mamal-ai\.netlify\.app$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

function resolveAllowedOrigin(event) {
  const origin = event.headers?.origin || event.headers?.Origin || '';
  if (!origin) return 'https://mamal-ai.netlify.app';
  if (ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin))) return origin;
  return null;
}

function checkRateLimit(ip) {
  const now = Date.now();
  const bucket = ipBuckets.get(ip) || [];
  const fresh = bucket.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
  if (fresh.length >= RATE_LIMIT_MAX_REQUESTS) {
    ipBuckets.set(ip, fresh);
    return false;
  }
  fresh.push(now);
  ipBuckets.set(ip, fresh);
  // Prevent unbounded memory growth across warm invocations
  if (ipBuckets.size > 500) {
    const oldestKey = ipBuckets.keys().next().value;
    ipBuckets.delete(oldestKey);
  }
  return true;
}

export async function handler(event) {
  const allowedOrigin = resolveAllowedOrigin(event);
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
  if (allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: allowedOrigin ? 204 : 403, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  if (!allowedOrigin) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'ORIGIN_NOT_ALLOWED', fallback: true }) };
  }

  const rawBody = typeof event.body === 'string' ? event.body : '';
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
    return { statusCode: 413, headers, body: JSON.stringify({ error: 'PAYLOAD_TOO_LARGE', fallback: true }) };
  }

  const clientIp = (
    event.headers?.['x-nf-client-connection-ip'] ||
    event.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
    'unknown'
  );
  if (!checkRateLimit(clientIp)) {
    return { statusCode: 429, headers, body: JSON.stringify({ error: 'RATE_LIMITED', fallback: true }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({ error: 'GEMINI_API_KEY_NOT_CONFIGURED', fallback: true }),
    };
  }

  try {
    const reqBody = JSON.parse(rawBody || '{}');
    if (!reqBody || typeof reqBody !== 'object') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'INVALID_JSON', fallback: true }) };
    }

    const requestId = typeof reqBody.requestId === 'string' ? reqBody.requestId.slice(0, 64) : `req-${Date.now()}`;
    const snapshotRevision = Number.isFinite(Number(reqBody.snapshotRevision)) ? Number(reqBody.snapshotRevision) : 1;
    const stepId = typeof reqBody.stepId === 'string' ? reqBody.stepId.slice(0, 64) : 'guided-build';
    const locale = reqBody.locale === 'en' ? 'en' : 'ar';
    const question = typeof reqBody.question === 'string' ? reqBody.question.trim().slice(0, MAX_QUESTION_LEN) : '';
    const history = Array.isArray(reqBody.history)
      ? reqBody.history.slice(-6).map((m) => ({
          role: m?.role === 'user' ? 'user' : 'assistant',
          text: typeof m?.text === 'string' ? m.text.slice(0, 400) : '',
        }))
      : [];
    const evidence = (reqBody.evidence && typeof reqBody.evidence === 'object') ? reqBody.evidence : {};

    const systemPrompt = `أنت "مرشد معمل AI" — معيد هندسة كهربائية وإلكترونية تفاعلي داخل مختبر محاكاة دوائر (2D) شبيه بـ Multisim.

أسلوبك التفاعلي الصارم خطوة بخطوة:
1. إذا طلب الطالب بناء دائرة (مثل: "أريد عمل دائرة قانون أوم" أو "دائرة LED" أو "مجزئ جهد"):
   - الخطوة الأولى: اذكر له القطع المطلوبة بالضبط (1، 2، 3...) بقيمها المقترحة، واطلب منه تنزيلها من شريط القطع العلوي ثم كتابة "تم".
   - الخطوة الثانية (عندما يكتب "تم"): افحص قائمة components الفعلية المرفقة في JSON بدقة! إذا نقصت أي قطعة، أخبره بالقطعة الناقصة بالاسم. إذا اكتملت القطع، انتقل للتوصيل واطلب منه توصيل الأسلاك بالترتيب (منفذ إلى منفذ) ثم كتابة "تم".
   - الخطوة الثالثة (عندما يكتب "تم" بعد التوصيل): افحص wires و status و diagnostics الفعلية في JSON! إذا كان هناك خطأ توصيل أو قطعة غير موصولة أو مفتاح مفتوح أو LED معكوس، حدد الخطأ بالضبط وكيف يصححه. إذا كانت الدائرة سليمة (valid)، هنّئه واشرح له القراءة الفيزيائية (التيار والجهد) باختصار.
2. التزم 100% ببيانات القطع والأسلاك والقياسات المرفقة في JSON ولا تخترع قراءات غير موجودة.
3. أجب بنفس لغة الطالب (العربية إذا كتب بالعربية، والإنجليزية إذا كتب بالإنجليزية).
4. اجعل ردودك واضحة، منظمة بنقاط قصيرة (3 إلى 6 أسطر)، ومباشرة بدون حشو.`;

    const recentHistoryText = history.length > 0
      ? `\nسجل المحادثة الأخيرة:\n${history.map((m) => `${m.role === 'user' ? 'الطالب' : 'المرشد'}: ${m.text}`).join('\n')}\n`
      : '';

    const userPrompt = `حالة لوحة المختبر الحالية (JSON حقيقي من اللوحة):
${JSON.stringify(evidence, null, 2)}
${recentHistoryText}
رسالة الطالب الحالية: ${question || 'حلّل دائرتي الحالية ووجّهني للخطوة العملية التالية.'}
اللغة الافتراضية: ${locale}`;

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    let apiResp;
    try {
      apiResp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 420,
          },
        }),
      });
    } finally {
      clearTimeout(timer);
    }

    if (!apiResp.ok) {
      const errText = await apiResp.text();
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: 'GEMINI_UPSTREAM_ERROR', detail: errText.slice(0, 200), fallback: true }),
      };
    }

    const data = await apiResp.json();
    const message = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!message) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: 'EMPTY_GEMINI_RESPONSE', fallback: true }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        contractVersion: '1.0.0',
        requestId,
        snapshotRevision,
        message,
        stepId,
        source: 'gemini',
      }),
    };
  } catch (err) {
    const isAbort = err?.name === 'AbortError';
    return {
      statusCode: isAbort ? 504 : 500,
      headers,
      body: JSON.stringify({
        error: isAbort ? 'GEMINI_TIMEOUT' : 'TUTOR_FUNCTION_ERROR',
        detail: String(err?.message || err).slice(0, 160),
        fallback: true,
      }),
    };
  }
}

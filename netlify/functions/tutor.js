export async function handler(event) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({ error: 'GEMINI_API_KEY_NOT_CONFIGURED', fallback: true })
    };
  }

  try {
    const reqBody = JSON.parse(event.body || '{}');
    const {
      requestId = 'req-' + Date.now(),
      snapshotRevision = 1,
      stepId = 'guided-build',
      locale = 'ar',
      question = '',
      history = [],
      evidence = {}
    } = reqBody;

    const systemPrompt = `أنت "مرشد معمل AI" — معيد هندسة كهربائية وإلكترونية تفاعلي داخل مختبر محاكاة دوائر (2D) شبيه بـ Multisim.

أسلوبك التفاعلي الصارم خطوة بخطوة:
1. إذا طلب الطالب بناء دائرة (مثل: "أريد عمل دائرة قانون أوم" أو "دائرة LED" أو "مجزئ جهد"):
   - الخطوة الأولى: اذكر له القطع المطلوبة بالضبط (1، 2، 3...) بقيمها المقترحة، واطلب منه تنزيلها من شريط القطع العلوي ثم كتابة "تم".
   - الخطوة الثانية (عندما يكتب "تم"): افحص قائمة components الفعلية المرفقة في JSON بدقة! إذا نقصت أي قطعة، أخبره بالقطعة الناقصة بالاسم. إذا اكتملت القطع، انتقل للتوصيل واطلب منه توصيل الأسلاك بالترتيب (منفذ إلى منفذ) ثم كتابة "تم".
   - الخطوة الثالثة (عندما يكتب "تم" بعد التوصيل): افحص wires و status و diagnostics الفعلية في JSON! إذا كان هناك خطأ توصيل أو قطعة غير موصولة أو مفتاح مفتوح، حدد الخطأ بالضبط وكيف يصححه. إذا كانت الدائرة سليمة (valid)، هنّئه واشرح له القراءة الفيزيائية (التيار والجهد) باختصار.
2. التزم 100% ببيانات القطع والأسلاك والقياسات المرفقة في JSON ولا تخترع قراءات غير موجودة.
3. أجب بنفس لغة الطالب (العربية إذا كتب بالعربية، والإنجليزية إذا كتب بالإنجليزية).
4. اجعل ردودك واضحة، منظمة بنقاط قصيرة (3 إلى 6 أسطر)، ومباشرة بدون حشو.`;

    const recentHistoryText = Array.isArray(history) && history.length > 0
      ? `\nسجل المحادثة الأخيرة:\n${history.slice(-6).map(m => `${m.role === 'user' ? 'الطالب' : 'المرشد'}: ${m.text}`).join('\n')}\n`
      : '';

    const userPrompt = `حالة لوحة المختبر الحالية (JSON حقيقي من اللوحة):
${JSON.stringify(evidence, null, 2)}
${recentHistoryText}
رسالة الطالب الحالية: ${question ? question : 'حلّل دائرتي الحالية ووجّهني للخطوة العملية التالية.'}
اللغة الافتراضية: ${locale}`;

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const apiResp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 420
        }
      })
    });

    if (!apiResp.ok) {
      const errText = await apiResp.text();
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: 'GEMINI_UPSTREAM_ERROR', detail: errText.slice(0, 200), fallback: true })
      };
    }

    const data = await apiResp.json();
    const message = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!message) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: 'EMPTY_GEMINI_RESPONSE', fallback: true })
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
        source: 'gemini'
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'TUTOR_FUNCTION_ERROR', detail: String(err?.message || err), fallback: true })
    };
  }
}

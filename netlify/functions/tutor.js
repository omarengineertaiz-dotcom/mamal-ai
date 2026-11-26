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
      stepId = 'run',
      locale = 'ar',
      question = '',
      evidence = {}
    } = reqBody;

    const systemPrompt = `أنت "مرشد معمل AI" — معيد هندسة كهربائية وإلكترونية ذكي يتبع المنهج السقراطي داخل مختبر محاكاة دوائر (2D).
قواعد صارمة:
1. التزم 100% بقياسات المحرك الفيزيائي وتشخيصاته المرفقة في JSON ولا تخترع أرقاماً مناقضة لها أبداً.
2. أجب بلغة الطالب: إذا سأل بالعربية فأجب بعربية هندسية واضحة ومختصرة، وإذا سأل بالإنجليزية فأجب بالإنجليزية.
3. أسلوبك سقراطي وتعليمي: اشرح السبب الفيزيائي في سطرين بوضوح، ثم وجّه الطالب بسؤال ذكي أو خطوة عملية تالية ليكتشف الحل بنفسه.
4. إذا سأل الطالب عن خطوات بناء تجربة دوائر أساسية أخرى (مثل التوالي والتوازي أو مقسم الجهد)، أعطه قائمة القطع وخطوات التركيب بإيجاز منظم.
5. اجعل الرد مختصراً (3 إلى 5 أسطر كحد أقصى) ومباشراً ومناسباً لصندوق محادثة صغير.`;

    const userPrompt = `حالة الدائرة الحالية من المحرك الفيزيائي (JSON):
${JSON.stringify(evidence, null, 2)}

سؤال الطالب: ${question ? question : 'حلّل حالة دائرتي الحالية ووجّهني للخطوة التالية بأسلوب سقراطي مختصر.'}
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
          temperature: 0.4,
          maxOutputTokens: 350
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

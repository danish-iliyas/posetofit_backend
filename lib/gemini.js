const API_KEY = process.env.GEMINI_API_KEY;
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const MODEL = 'gemini-3.1-flash-lite-image';

const FRONT_LABEL =
  'This is a FRONT-FACING full-body photo of the person, standing straight, arms at their sides.';

const SIDE_LABEL =
  'This is a SIDE-FACING full-body photo of the same person, standing straight.';

const MEASURE_PROMPT_BASE =
  'Estimate this person\'s body measurements in centimeters using their real height as the ' +
  'scale reference. Use the visible position of the shoulders, chest, waist and hips relative ' +
  'to their total height to calculate proportional distances, then convert to centimeters. ' +
  'Respond with ONLY a raw JSON object, no markdown, no explanation, no code fences, in exactly ' +
  'this shape: {"shoulderCm": number, "chestCm": number, "waistCm": number, "hipCm": number}.';

const MEASURE_PROMPT_ACCURATE =
  MEASURE_PROMPT_BASE +
  ' You are given both a front photo (for width) and a side photo (for depth) -- combine both ' +
  'to estimate chest and waist circumference using an elliptical cross-section approximation, ' +
  'not just the front-view width.';

function extractTextResponse(json) {
  const steps = json?.steps;
  if (Array.isArray(steps)) {
    for (const step of steps) {
      for (const content of step?.content ?? []) {
        if (content?.type === 'text' && content?.text) return content.text;
      }
    }
  }
  return null;
}

function parseMeasurementJson(text) {
  if (!text) return null;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

async function callOnce(inputParts) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'x-goog-api-key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, input: inputParts }),
  });

  const json = await response.json();

  if (!response.ok) {
    const message = json?.error?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return parseMeasurementJson(extractTextResponse(json));
}

export async function estimateMeasurements({ heightCm, gender, frontBase64, sideBase64 }) {
  if (!API_KEY) {
    throw new Error('Missing GEMINI_API_KEY. Add it to .env.local');
  }

  const inputParts = [
    { type: 'text', text: `Person height: ${heightCm} cm. Gender: ${gender}.` },
    { type: 'text', text: FRONT_LABEL },
    { type: 'image', mime_type: 'image/jpeg', data: frontBase64 },
  ];

  if (sideBase64) {
    inputParts.push({ type: 'text', text: SIDE_LABEL });
    inputParts.push({ type: 'image', mime_type: 'image/jpeg', data: sideBase64 });
  }

  inputParts.push({
    type: 'text',
    text: sideBase64 ? MEASURE_PROMPT_ACCURATE : MEASURE_PROMPT_BASE,
  });

  // The model doesn't always follow the "JSON only" instruction on the first
  // try -- retry once before giving up, since a second attempt usually works.
  let measurements = await callOnce(inputParts);
  console.log(measurements,"mesuremets")
  if (!measurements) {
    measurements = await callOnce(inputParts);
  }

  if (!measurements) {
    throw new Error('Gemini did not return parseable measurements after two attempts.');
  }

  return measurements;
}

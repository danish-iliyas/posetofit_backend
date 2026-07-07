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

const PERSON_LABEL =
  'This is the TARGET PERSON. The output image must show this exact same person: ' +
  'same face, same identity, same hair, same skin tone, same body, same pose, same background. ' +
  'Nothing about this person or their surroundings should change except the garment described below.';

const GARMENT_LABEL =
  'This is the GARMENT REFERENCE ONLY. It may show a different person wearing the item -- ' +
  'completely ignore that person\'s face, identity, body, hair, and background. ' +
  'Only extract the clothing item itself: its color, pattern, texture, and fit.';

const TRY_ON_PROMPT =
  'Edit the target person image so they are wearing the garment(s) from the garment reference image. ' +
  'Keep the target person\'s face, identity, body shape, skin tone, pose, and background completely unchanged. ' +
  'Do not use any part of the garment reference image other than the clothing item(s) themselves -- ' +
  'never substitute the target person\'s face or body with the one in the garment reference. ' +
  'Only replace the specific garment(s) actually shown in the garment reference image -- ' +
  'if it shows only a top (like a t-shirt or shirt), replace only the target person\'s top and leave their ' +
  'existing bottom (pants, skirt, etc.) exactly as it is in the target person image. ' +
  'If it shows only a bottom, replace only their bottom and leave their existing top unchanged. ' +
  'If it shows a full outfit (top and bottom together), replace both. ' +
  'Match the garment\'s color, pattern, texture and fit realistically as if the target person is actually wearing it.';

const EXTRACT_PROMPT =
  'This image may show a person wearing one or more garments. ' +
  'Extract every garment worn by the person into a single clean product-photography style image: ' +
  'plain neutral background, no person, no face, no skin, no body parts, no background scenery. ' +
  'If multiple garments are worn together (for example a top and a bottom), include all of them, ' +
  'laid out clearly as they would appear in a clothing catalog photo. ' +
  'Preserve each garment\'s exact color, pattern, texture and shape.';

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

function extractImageResponse(json) {
  const direct = json?.output_image?.data;
  if (direct) return direct;

  const steps = json?.steps;
  if (Array.isArray(steps)) {
    for (const step of steps) {
      for (const content of step?.content ?? []) {
        if (content?.type === 'image' && content?.data) return content.data;
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

async function callGemini(inputParts) {
  if (!API_KEY) {
    throw new Error('Missing GEMINI_API_KEY. Add it to .env.local');
  }

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

  return json;
}

export async function estimateMeasurements({ heightCm, gender, frontBase64, sideBase64 }) {
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
  let measurements = parseMeasurementJson(extractTextResponse(await callGemini(inputParts)));
  if (!measurements) {
    measurements = parseMeasurementJson(extractTextResponse(await callGemini(inputParts)));
  }

  if (!measurements) {
    throw new Error('Gemini did not return parseable measurements after two attempts.');
  }

  return measurements;
}

export async function generateTryOn(personBase64, garmentBase64) {
  const json = await callGemini([
    { type: 'text', text: PERSON_LABEL },
    { type: 'image', mime_type: 'image/jpeg', data: personBase64 },
    { type: 'text', text: GARMENT_LABEL },
    { type: 'image', mime_type: 'image/jpeg', data: garmentBase64 },
    { type: 'text', text: TRY_ON_PROMPT },
  ]);

  const imageBase64 = extractImageResponse(json);
  if (!imageBase64) {
    throw new Error(
      `Unexpected response shape from Gemini API: ${JSON.stringify(json).slice(0, 500)}`
    );
  }
  return imageBase64;
}

export async function extractGarment(garmentBase64) {
  const json = await callGemini([
    { type: 'image', mime_type: 'image/jpeg', data: garmentBase64 },
    { type: 'text', text: EXTRACT_PROMPT },
  ]);

  const imageBase64 = extractImageResponse(json);
  if (!imageBase64) {
    throw new Error(
      `Unexpected response shape from Gemini API: ${JSON.stringify(json).slice(0, 500)}`
    );
  }
  return imageBase64;
}

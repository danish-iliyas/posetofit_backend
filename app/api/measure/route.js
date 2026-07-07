import { estimateMeasurements } from '@/lib/gemini';

export async function POST(request) {
  const { heightCm, gender, frontBase64, sideBase64 } = await request.json();
console.log(gender,"hi")
  if (!heightCm || !gender || !frontBase64) {
    return Response.json(
      { error: 'heightCm, gender and frontBase64 are required' },
      { status: 400 }
    );
  }

  try {
    const measurements = await estimateMeasurements({ heightCm, gender, frontBase64, sideBase64 });
    return Response.json({ measurements, mode: sideBase64 ? 'accurate' : 'quick' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

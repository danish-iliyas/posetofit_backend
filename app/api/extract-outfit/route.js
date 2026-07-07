import { connectToDatabase } from '@/lib/mongodb';
import { getUserIdFromRequest } from '@/lib/auth';
import { extractGarment } from '@/lib/gemini';

// Extraction is a free helper step (it doesn't produce a final result on its
// own), so no credit is charged here -- only /api/try-on and /api/measure do.
export async function POST(request) {
  await connectToDatabase();
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { garmentBase64 } = await request.json();
  if (!garmentBase64) {
    return Response.json({ error: 'garmentBase64 is required' }, { status: 400 });
  }

  try {
    const imageBase64 = await extractGarment(garmentBase64);
    return Response.json({ imageBase64 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

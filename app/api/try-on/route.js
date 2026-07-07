import { connectToDatabase } from '@/lib/mongodb';
import { getUserIdFromRequest } from '@/lib/auth';
import { requireCredits, deductCredits } from '@/lib/credits';
import { generateTryOn } from '@/lib/gemini';

export async function POST(request) {
  await connectToDatabase();
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    await requireCredits(userId, 1);
  } catch (error) {
    return Response.json({ error: error.message }, { status: error.status || 500 });
  }

  const { personBase64, garmentBase64 } = await request.json();
  if (!personBase64 || !garmentBase64) {
    return Response.json(
      { error: 'personBase64 and garmentBase64 are required' },
      { status: 400 }
    );
  }

  try {
    const imageBase64 = await generateTryOn(personBase64, garmentBase64);
    const credits = await deductCredits(userId, 1);
    return Response.json({ imageBase64, credits });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

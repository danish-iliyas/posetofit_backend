import { connectToDatabase } from '@/lib/mongodb';
import SizeChart from '@/models/SizeChart';

export async function GET(request) {
  await connectToDatabase();
  const params = request.nextUrl.searchParams;
  const gender = params.get('gender');
  const category = params.get('category') || 'tops';
  const brand = params.get('brand');

  if (!gender) {
    return Response.json({ error: 'Missing gender' }, { status: 400 });
  }

  if (brand) {
    const chart = await SizeChart.findOne({ brand, gender, category });
    return Response.json({ charts: chart ? [chart] : [] });
  }

  const charts = await SizeChart.find({ gender, category }).sort({ brand: 1 });
  return Response.json({ charts });
}

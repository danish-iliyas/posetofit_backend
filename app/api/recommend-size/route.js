import { connectToDatabase } from '@/lib/mongodb';
import SizeChart from '@/models/SizeChart';

function closestSize(sizes, valueCm, minKey, maxKey) {
  let best = null;
  let bestDistance = Infinity;

  for (const size of sizes) {
    const min = size[minKey];
    const max = size[maxKey];
    if (min == null || max == null) continue;

    const distance = valueCm < min ? min - valueCm : valueCm > max ? valueCm - max : 0;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = size;
    }
  }

  if (!best) return null;
  return { label: best.label, exactMatch: bestDistance === 0, offCm: Math.round(bestDistance) };
}

export async function POST(request) {
  await connectToDatabase();
  const { chestCm, waistCm, gender, category = 'tops' } = await request.json();

  if (!gender || (chestCm == null && waistCm == null)) {
    return Response.json(
      { error: 'gender and at least one of chestCm/waistCm are required' },
      { status: 400 }
    );
  }

  const charts = await SizeChart.find({ gender, category });
  const [minKey, maxKey, value] =
    category === 'bottoms'
      ? ['waistMinCm', 'waistMaxCm', waistCm]
      : ['chestMinCm', 'chestMaxCm', chestCm];

  const recommendations = charts
    .map((chart) => {
      const match = value != null ? closestSize(chart.sizes, value, minKey, maxKey) : null;
      return match ? { brand: chart.brand, ...match } : null;
    })
    .filter(Boolean);

  return Response.json({ recommendations });
}

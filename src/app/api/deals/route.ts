import { NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser({
  timeout: 12000,
  headers: { "User-Agent": "UAE-Deals-Live/1.0" },
});

const EMIRATES = [
  { key: "dubai", ar: "دبي", en: "Dubai", keywords: ["دبي", "dubai", "dxb"] },
  { key: "abu-dhabi", ar: "أبوظبي", en: "Abu Dhabi", keywords: ["أبوظبي", "ابوظبي", "abu dhabi", "abudhabi"] },
  { key: "sharjah", ar: "الشارقة", en: "Sharjah", keywords: ["الشارقة", "sharjah"] },
  { key: "ajman", ar: "عجمان", en: "Ajman", keywords: ["عجمان", "ajman"] },
  { key: "rak", ar: "رأس الخيمة", en: "Ras Al Khaimah", keywords: ["رأس الخيمة", "راس الخيمة", "ras al khaimah", "rak"] },
  { key: "fujairah", ar: "الفجيرة", en: "Fujairah", keywords: ["الفجيرة", "fujairah"] },
  { key: "uaq", ar: "أم القيوين", en: "Umm Al Quwain", keywords: ["أم القيوين", "ام القيوين", "umm al quwain", "uaq"] },
  { key: "uae", ar: "الإمارات (عام)", en: "UAE (General)", keywords: ["الإمارات", "امارات", "uae", "united arab emirates"] },
];

const STORES = [
  { key: "carrefour", ar: "كارفور", keywords: ["carrefour", "كارفور"] },
  { key: "lulu", ar: "لولو", keywords: ["lulu", "لولو"] },
  { key: "amazon", ar: "أمازون", keywords: ["amazon", "أمازون", "امازون"] },
  { key: "noon", ar: "نون", keywords: ["noon", "نون"] },
  { key: "sharaf", ar: "شرف DG", keywords: ["sharaf", "شرف"] },
  { key: "jumbo", ar: "جامبو", keywords: ["jumbo", "جامبو"] },
  { key: "union-coop", ar: "يونيون كوب", keywords: ["union coop", "يونيون"] },
  { key: "spinneys", ar: "سبينيس", keywords: ["spinneys", "سبينيس"] },
  { key: "waitrose", ar: "ويتروز", keywords: ["waitrose"] },
  { key: "other", ar: "متاجر أخرى", keywords: [] },
];

function detectEmirate(text: string): string {
  const lower = text.toLowerCase();
  for (const e of EMIRATES) {
    if (e.keywords.some((k) => lower.includes(k.toLowerCase()))) return e.key;
  }
  return "uae";
}

function detectStore(text: string): string {
  const lower = text.toLowerCase();
  for (const s of STORES) {
    if (s.key === "other") continue;
    if (s.keywords.some((k) => lower.includes(k.toLowerCase()))) return s.key;
  }
  return "other";
}

async function fetchFeed(url: string) {
  try {
    const feed = await parser.parseURL(url);
    return (feed.items || []).slice(0, 12).map((item) => {
      const title = (item.title || "").trim();
      const snippet = ((item.contentSnippet || item.content || item.summary || "") as string)
        .replace(/<[^>]+>/g, "")
        .slice(0, 220)
        .trim();
      const full = `${title} ${snippet}`;
      return {
        title,
        link: item.link || "#",
        snippet,
        source: (feed.title || "News").replace(/ - Google News.*/, "").trim(),
        date: item.pubDate || item.isoDate || new Date().toISOString(),
        emirate: detectEmirate(full),
        store: detectStore(full),
      };
    });
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const feeds = [
      "https://news.google.com/rss/search?q=%D8%B9%D8%B1%D9%88%D8%B6+%D8%A7%D9%84%D8%A5%D9%85%D8%A7%D8%B1%D8%A7%D8%AA+OR+%D8%AE%D8%B5%D9%85%D8%A7%D8%AA+%D8%AF%D8%A8%D9%8A+OR+%D8%B9%D8%B1%D9%88%D8%B6+%D8%A3%D8%A8%D9%88%D8%B8%D8%A8%D9%8A&hl=ar&gl=AE&ceid=AE:ar",
      "https://news.google.com/rss/search?q=UAE+offers+OR+Dubai+deals+OR+Abu+Dhabi+discount+OR+Carrefour+UAE+sale&hl=en&gl=AE&ceid=AE:en",
      "https://news.google.com/rss/search?q=Carrefour+UAE+OR+Lulu+Hypermarket+offers+OR+Noon+deals+Dubai&hl=en&gl=AE&ceid=AE:en",
      "https://news.google.com/rss/search?q=%D9%83%D8%A7%D8%B1%D9%81%D9%88%D8%B1+%D8%B9%D8%B1%D9%88%D8%B6+OR+%D9%84%D9%88%D9%84%D9%88+%D8%AE%D8%B5%D9%85&hl=ar&gl=AE&ceid=AE:ar",
    ];

    const all: any[] = [];
    for (const url of feeds) {
      const items = await fetchFeed(url);
      all.push(...items);
    }

    const seen = new Set<string>();
    const unique = all.filter((item) => {
      const key = item.title.toLowerCase().slice(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    unique.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const grouped: Record<string, Record<string, any[]>> = {};

    for (const item of unique) {
      if (!grouped[item.emirate]) grouped[item.emirate] = {};
      if (!grouped[item.emirate][item.store]) grouped[item.emirate][item.store] = [];
      grouped[item.emirate][item.store].push(item);
    }

    const orderedEmirates = EMIRATES.map((e) => ({
      key: e.key,
      nameAr: e.ar,
      nameEn: e.en,
      stores: Object.entries(grouped[e.key] || {})
        .map(([storeKey, deals]) => {
          const storeInfo = STORES.find((s) => s.key === storeKey) || STORES[STORES.length - 1];
          return {
            key: storeKey,
            nameAr: storeInfo.ar,
            deals: deals.slice(0, 8),
          };
        })
        .filter((s) => s.deals.length > 0)
        .sort((a, b) => b.deals.length - a.deals.length),
    })).filter((e) => e.stores.length > 0);

    return NextResponse.json({
      success: true,
      updatedAt: new Date().toISOString(),
      total: unique.length,
      emirates: orderedEmirates,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

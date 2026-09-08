import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: "ইউআরএল প্রয়োজন" }, { status: 400 });
        }s

        // আপনার লোকাল পাইথন এপিআই সার্ভারে রিকোয়েস্ট পাঠানো
        const pythonResponse = await fetch('http://127.0.0.1:8000/api/extract', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: url })
        });

        const data = await pythonResponse.json();

        if (!pythonResponse.ok) {
            return NextResponse.json({ error: data.detail || "লিঙ্ক প্রসেস করতে ব্যর্থ হয়েছে।" }, { status: pythonResponse.status });
        }

        return NextResponse.json({
            success: true,
            title: data.title,
            thumbnail: data.thumbnail,
            download_url: data.download_url,
            platform: data.platform
        });

    } catch (error) {
        return NextResponse.json({ error: "পাইথন সার্ভার কানেকশন ফেল করেছে: " + error.message }, { status: 500 });
    }
}

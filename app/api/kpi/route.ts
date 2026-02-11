import { NextResponse } from 'next/server';
import { fetchMondayData } from '@/lib/monday';

export async function GET() {
    try {
        const data = await fetchMondayData();
        return NextResponse.json({
            kpis: data.kpis,
            dataQuality: data.dataQuality
        });
    } catch (error: any) {
        console.error("KPI API Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch KPIs", details: error.message },
            { status: 500 }
        );
    }
}

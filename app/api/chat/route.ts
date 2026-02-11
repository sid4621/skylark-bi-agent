import { NextResponse } from 'next/server';
import { fetchMondayData } from '@/lib/monday';

export async function POST(req: Request) {
    try {
        const { message, activeBoard } = await req.json();

        // 1. Fetch live data
        const data = await fetchMondayData();
        const { kpis, dataQuality, deals, workOrders } = data;

        // 2. Select Context based on Active Board
        let contextData = "";
        if (activeBoard === 'work_orders') {
            contextData = `
        FOCUS: Work Orders & Operations
        - Total Projects: ${kpis.totalWorkOrders}
        - Completed: ${kpis.completedWorkOrders}
        - Delayed: ${kpis.delayedWorkOrders}
        - Total Pipeline Value (Ref): $${kpis.totalPipelineValue.toLocaleString()}

        - Top Issues & Billing:
        ${workOrders.filter(w => w.status !== 'Done').slice(0, 5).map(w => `- ${w.name}: ${w.status} (${w.energy_type}) | Bill: ${w.billing_status} | Due: ${w.amount_receivable}`).join('\n')}
        `;
        } else {
            contextData = `
        FOCUS: Sales Pipeline & Deals
        - Total Pipeline: $${kpis.totalPipelineValue.toLocaleString()}
        - Weighted Revenue: $${kpis.expectedRevenueWeighted.toLocaleString()}
        - Open Deals: ${kpis.openDealsCount}
        - Delayed Projects (Ref): ${kpis.delayedWorkOrders}

        - Top Deals:
        ${deals.slice(0, 5).map(d => `- ${d.name}: $${d.deal_value} (${d.stage}, ${d.probability}%)`).join('\n')}
        `;
        }

        // 3. Construct System Prompt
        const systemPrompt = `
    You are Skylark, an advanced BI AI.
    User Question: "${message}"
    
    CONTEXT (${activeBoard === 'work_orders' ? 'OPERATIONS' : 'SALES'}):
    ${contextData}

    DATA QUALITY WARNINGS:
    ${dataQuality.missingDealValueCount > 0 ? `- ${dataQuality.missingDealValueCount} deals missing value` : ''}

    INSTRUCTIONS:
    - Answer ONLY based on the provided context.
    - Be professional and concise.
    `;

        console.log("--- PROMPT GENERATED ---");
        console.log(systemPrompt);

        let reply = "";

        // 4. Try Groq (Primary)
        if (process.env.GROQ_API_KEY) {
            console.log("Attempting Groq...");
            try {
                const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile", // Updated model
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: message }
                        ],
                        temperature: 0.7
                    })
                });

                if (groqRes.ok) {
                    const groqJson = await groqRes.json();
                    reply = groqJson.choices[0]?.message?.content || "";
                    console.log("Groq Success");
                } else {
                    const errText = await groqRes.text();
                    console.warn("Groq API failed:", groqRes.status, errText);
                }
            } catch (e) {
                console.warn("Groq Network Error:", e);
            }
        } else {
            console.log("No Groq Key found.");
        }

        // 5. Fallback to HuggingFace
        if (!reply && process.env.HF_API_KEY) {
            console.log("Attempting HuggingFace...");
            try {
                // Updated URL to router.huggingface.co
                const hfRes = await fetch("https://router.huggingface.co/mistralai/Mistral-7B-Instruct-v0.3", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.HF_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        inputs: `<s>[INST] ${systemPrompt} [/INST]`,
                        parameters: { max_new_tokens: 500, return_full_text: false }
                    })
                });

                if (hfRes.ok) {
                    const hfJson = await hfRes.json();
                    // Route might return different format, usually [ { generated_text: ... } ]
                    reply = hfJson[0]?.generated_text || "";
                    console.log("HF Success");
                } else {
                    const errText = await hfRes.text();
                    console.error("HF API Failed:", hfRes.status, errText);
                }
            } catch (e) {
                console.error("HF Network Error:", e);
            }
        }

        // 6. Ultimate Fallback
        if (!reply) {
            console.log("All AI services failed. Using manual fallback.");
            reply = `**${activeBoard === 'work_orders' ? 'Operations' : 'Pipeline'} Summary**
        ${contextData}
        
        *Note: AI services are currently unavailable. Check server logs for details.*`;
        }

        return NextResponse.json({
            reply,
            kpis,
            dataQuality
        });

    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

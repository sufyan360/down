import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const systemPrompt = `
You are a mental health assistant. Your role is to act as a virtual therapist.
Provide supportive, empathetic, and professional responses.
Help users manage their mental health issues by offering advice and support.
If you do not have enough information to answer a question, ask the user for more details.
`;

export async function POST(req) {
    const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY,
    });

    const data = await req.json();

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: 'system', content: systemPrompt }, ...data],
            model: 'meta-llama/llama-3.2-3b-instruct:free',
            stream: true
        });

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                for await (const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content;
                    if (content) {
                        const text = encoder.encode(content);
                        controller.enqueue(text);
                    }
                }
            } catch (err) {
                controller.error(err);
            } finally {
                controller.close();
            }
        }
    });

    return new NextResponse(stream);
    } catch (err) {
    return new NextResponse(`Error: ${err.message}`, { status: 500 });
    }
}

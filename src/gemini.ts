const STORAGE_KEY = 'gemini-api-key';

export function getApiKey(): string | null {
    return localStorage.getItem(STORAGE_KEY);
}

export function setApiKey(key: string): void {
    localStorage.setItem(STORAGE_KEY, key);
}

const FLASH_MODEL = 'gemini-2.5-flash';
const PRO_MODEL = 'gemini-3-pro-preview'; // Gemini 3 Pro for reasoning

async function callGemini(model: string, contents: any[], systemInstruction?: string) {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('API key not set. Please add your Gemini API key in settings.');
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body: any = { contents };
    if (systemInstruction) {
        body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export async function transcribe(audioBlob: Blob): Promise<string> {
    const base64 = await blobToBase64(audioBlob);
    const mimeType = audioBlob.type || 'audio/webm';

    const contents = [{
        parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: 'Transcribe this audio accurately. Return only the transcription, nothing else.' }
        ]
    }];

    return callGemini(FLASH_MODEL, contents);
}

export async function summarize(text: string): Promise<string> {
    const contents = [{
        parts: [{ text }]
    }];

    return callGemini(
        FLASH_MODEL,
        contents,
        'Create a very short title (max 6 words) summarizing this text. Return only the title.'
    );
}

export async function reason(
    history: Array<{ role: 'user' | 'model'; content: string }>,
    latestAudioBlob?: Blob
): Promise<string> {
    const contents = history.slice(0, -1).map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
    }));

    // For the latest user message, include audio if provided
    if (latestAudioBlob) {
        const base64 = await blobToBase64(latestAudioBlob);
        const mimeType = latestAudioBlob.type || 'audio/webm';
        contents.push({
            role: 'user',
            parts: [
                { inlineData: { mimeType, data: base64 } },
                { text: 'Listen to this audio and respond to what the user is saying.' }
            ] as any
        });
    } else if (history.length > 0) {
        // Fallback to text if no audio
        const lastMsg = history[history.length - 1];
        contents.push({
            role: lastMsg.role,
            parts: [{ text: lastMsg.content }]
        });
    }

    return callGemini(
        PRO_MODEL,
        contents,
        'You are a helpful research assistant. Always respond in the same language the user is using. Provide clear, informative responses. Do not suggest follow-up questions or topics to explore. Just answer what was asked.'
    );
}

async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

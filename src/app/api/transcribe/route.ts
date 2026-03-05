import { NextRequest, NextResponse } from "next/server";
import type { Utterance, TranscriptionResult } from "@/types";

export const maxDuration = 300; // 5 minutes for long videos

async function uploadToAssemblyAI(buffer: Buffer): Promise<string> {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
        throw new Error("ASSEMBLYAI_API_KEY is not configured. Please add it to your .env.local file.");
    }

    const response = await fetch("https://api.assemblyai.com/v2/upload", {
        method: "POST",
        headers: {
            authorization: apiKey,
            "content-type": "application/octet-stream",
        },
        body: new Uint8Array(buffer),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error al subir archivo a AssemblyAI: ${text}`);
    }

    const data = await response.json();
    return data.upload_url;
}

async function transcribeAudio(uploadUrl: string): Promise<{
    utterances: Array<{ speaker: string; text: string; start: number; end: number }>;
}> {
    const apiKey = process.env.ASSEMBLYAI_API_KEY!;

    // Start transcription
    const startResponse = await fetch("https://api.assemblyai.com/v2/transcript", {
        method: "POST",
        headers: {
            authorization: apiKey,
            "content-type": "application/json",
        },
        body: JSON.stringify({
            audio_url: uploadUrl,
            speaker_labels: true,
            language_code: "es",
            punctuate: true,
            format_text: true,
            speech_models: ["universal-2"],
        }),
    });

    if (!startResponse.ok) {
        const text = await startResponse.text();
        throw new Error(`Error al iniciar transcripción: ${text}`);
    }

    const startData = await startResponse.json();
    const transcriptId = startData.id;

    // Poll for completion
    while (true) {
        const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
            headers: { authorization: apiKey },
        });

        if (!pollResponse.ok) {
            throw new Error("Error al verificar estado de la transcripción.");
        }

        const pollData = await pollResponse.json();

        if (pollData.status === "completed") {
            return {
                utterances: (pollData.utterances || []).map((u: { speaker: string; text: string; start: number; end: number }) => ({
                    speaker: u.speaker,
                    text: u.text,
                    start: u.start,
                    end: u.end,
                })),
            };
        }

        if (pollData.status === "error") {
            throw new Error(pollData.error || "Error al transcribir el audio.");
        }

        // Wait 3 seconds before polling again
        await new Promise((resolve) => setTimeout(resolve, 3000));
    }
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("video") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No se proporcionó ningún archivo de video." },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = [
            "video/mp4", "video/quicktime", "video/webm", "video/x-msvideo",
            "video/x-matroska", "audio/mpeg", "audio/wav", "audio/mp4", "audio/x-m4a",
        ];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: `Tipo de archivo no soportado: ${file.type}. Use MP4, MOV, WEBM, AVI, MP3, WAV o M4A.` },
                { status: 400 }
            );
        }

        // Convert file to buffer and upload to AssemblyAI
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uploadUrl = await uploadToAssemblyAI(buffer);

        // Transcribe with speaker diarization
        const result = await transcribeAudio(uploadUrl);

        // Build speaker map
        const speakers = new Set(result.utterances.map((u) => u.speaker));
        const speakerMap: Record<string, string> = {};
        let index = 1;
        speakers.forEach((speaker) => {
            speakerMap[speaker] = `Hablante ${index}`;
            index++;
        });

        const transcriptionResult: TranscriptionResult = {
            utterances: result.utterances as Utterance[],
            speakerMap,
        };

        return NextResponse.json(transcriptionResult);
    } catch (error) {
        console.error("Transcription error:", error);
        const message =
            error instanceof Error ? error.message : "Error al procesar el video.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { getAssemblyAIClient } from "@/lib/assemblyai";
import type { Utterance, TranscriptionResult } from "@/types";

// Increase body size limit for video uploads (500MB)
export const config = {
    api: {
        bodyParser: false,
    },
};

export const maxDuration = 300; // 5 minutes for long videos

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
            "video/mp4",
            "video/quicktime",
            "video/webm",
            "video/x-msvideo",
            "video/x-matroska",
            "audio/mpeg",
            "audio/wav",
            "audio/mp4",
            "audio/x-m4a",
        ];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                {
                    error: `Tipo de archivo no soportado: ${file.type}. Use MP4, MOV, WEBM, AVI, MP3, WAV o M4A.`,
                },
                { status: 400 }
            );
        }

        const client = getAssemblyAIClient();

        // Upload file directly to AssemblyAI (no disk storage needed)
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadUrl = await client.files.upload(buffer);

        // Transcribe with speaker diarization
        const transcript = await client.transcripts.transcribe({
            audio: uploadUrl,
            speaker_labels: true,
            language_code: "es",
            punctuate: true,
            format_text: true,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            speech_models: ["universal-2"] as any,
        });

        if (transcript.status === "error") {
            throw new Error(
                transcript.error || "Error al transcribir el audio."
            );
        }

        // Process utterances
        const utterances: Utterance[] = (transcript.utterances || []).map(
            (u) => ({
                speaker: u.speaker,
                text: u.text,
                start: u.start,
                end: u.end,
            })
        );

        // Build speaker map
        const speakers = new Set(utterances.map((u) => u.speaker));
        const speakerMap: Record<string, string> = {};
        let index = 1;
        speakers.forEach((speaker) => {
            speakerMap[speaker] = `Hablante ${index}`;
            index++;
        });

        const result: TranscriptionResult = {
            utterances,
            speakerMap,
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error("Transcription error:", error);
        const message =
            error instanceof Error ? error.message : "Error al procesar el video.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

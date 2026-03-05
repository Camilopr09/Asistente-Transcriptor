"use client";

import React, { useState, useCallback } from "react";
import type { Utterance } from "@/types";

interface TranscriptViewerProps {
    utterances: Utterance[];
    speakerMap: Record<string, string>;
    onSpeakerMapChange: (newMap: Record<string, string>) => void;
}

function formatTimestamp(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const SPEAKER_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    A: {
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
        text: "text-purple-300",
        badge: "bg-purple-500/20",
    },
    B: {
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        text: "text-blue-300",
        badge: "bg-blue-500/20",
    },
    C: {
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        text: "text-emerald-300",
        badge: "bg-emerald-500/20",
    },
    D: {
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        text: "text-amber-300",
        badge: "bg-amber-500/20",
    },
    E: {
        bg: "bg-rose-500/10",
        border: "border-rose-500/20",
        text: "text-rose-300",
        badge: "bg-rose-500/20",
    },
    F: {
        bg: "bg-cyan-500/10",
        border: "border-cyan-500/20",
        text: "text-cyan-300",
        badge: "bg-cyan-500/20",
    },
};

function getSpeakerColors(speaker: string) {
    return (
        SPEAKER_COLORS[speaker] || {
            bg: "bg-gray-500/10",
            border: "border-gray-500/20",
            text: "text-gray-300",
            badge: "bg-gray-500/20",
        }
    );
}

export default function TranscriptViewer({
    utterances,
    speakerMap,
    onSpeakerMapChange,
}: TranscriptViewerProps) {
    const [editingSpeaker, setEditingSpeaker] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");

    const startEditing = useCallback(
        (speakerId: string) => {
            setEditingSpeaker(speakerId);
            setEditValue(speakerMap[speakerId] || speakerId);
        },
        [speakerMap]
    );

    const saveEdit = useCallback(
        (speakerId: string) => {
            if (editValue.trim()) {
                const newMap = { ...speakerMap, [speakerId]: editValue.trim() };
                onSpeakerMapChange(newMap);
            }
            setEditingSpeaker(null);
        },
        [editValue, speakerMap, onSpeakerMapChange]
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent, speakerId: string) => {
            if (e.key === "Enter") {
                saveEdit(speakerId);
            } else if (e.key === "Escape") {
                setEditingSpeaker(null);
            }
        },
        [saveEdit]
    );

    if (utterances.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-white/40">
                <svg className="w-16 h-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <p className="text-lg font-medium">No hay transcripción aún</p>
                <p className="text-sm mt-1">Sube un video para comenzar</p>
            </div>
        );
    }

    // Get unique speakers for the legend
    const uniqueSpeakers = Object.keys(speakerMap);

    return (
        <div className="space-y-4">
            {/* Speaker Legend / Rename Bar */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wider text-white/40 mb-3 font-medium">
                    Hablantes — haz clic para editar el nombre
                </p>
                <div className="flex flex-wrap gap-2">
                    {uniqueSpeakers.map((speakerId) => {
                        const colors = getSpeakerColors(speakerId);
                        return (
                            <div
                                key={speakerId}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${colors.badge} border ${colors.border} transition-all duration-300`}
                            >
                                {editingSpeaker === speakerId ? (
                                    <input
                                        type="text"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onBlur={() => saveEdit(speakerId)}
                                        onKeyDown={(e) => handleKeyDown(e, speakerId)}
                                        autoFocus
                                        className={`bg-transparent border-none outline-none ${colors.text} font-medium text-sm w-28`}
                                    />
                                ) : (
                                    <button
                                        onClick={() => startEditing(speakerId)}
                                        className={`${colors.text} font-medium text-sm hover:underline flex items-center gap-1.5 cursor-pointer`}
                                    >
                                        {speakerMap[speakerId]}
                                        <svg
                                            className="w-3 h-3 opacity-50"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                            />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Transcript Messages */}
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {utterances.map((utterance, index) => {
                    const colors = getSpeakerColors(utterance.speaker);
                    const speakerName =
                        speakerMap[utterance.speaker] || `Hablante ${utterance.speaker}`;

                    return (
                        <div
                            key={index}
                            className={`p-4 rounded-xl ${colors.bg} border ${colors.border} transition-all duration-300 hover:bg-white/[0.08] group animate-fadeIn`}
                            style={{ animationDelay: `${index * 30}ms` }}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <span
                                    className={`text-sm font-semibold ${colors.text}`}
                                >
                                    {speakerName}
                                </span>
                                <span className="text-xs text-white/25 bg-white/5 px-2 py-0.5 rounded-full">
                                    {formatTimestamp(utterance.start)} →{" "}
                                    {formatTimestamp(utterance.end)}
                                </span>
                            </div>
                            <p className="text-white/80 text-sm leading-relaxed">
                                {utterance.text}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

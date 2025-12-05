import { useState, useRef, useCallback, useImperativeHandle, forwardRef, useEffect } from 'react';

interface AudioRecorderProps {
    onRecordingComplete: (blob: Blob) => void;
    disabled?: boolean;
}

export interface AudioRecorderRef {
    startRecording: () => void;
    stopRecording: () => void;
    isRecording: boolean;
}

export const AudioRecorder = forwardRef<AudioRecorderRef, AudioRecorderProps>(
    function AudioRecorder({ onRecordingComplete, disabled }, ref) {
        const [isRecording, setIsRecording] = useState(false);
        const mediaRecorderRef = useRef<MediaRecorder | null>(null);
        const chunksRef = useRef<Blob[]>([]);
        const isRecordingRef = useRef(false);
        const streamRef = useRef<MediaStream | null>(null);

        // Keep refs to latest prop values for use in stable callbacks
        const onRecordingCompleteRef = useRef(onRecordingComplete);
        const disabledRef = useRef(disabled);

        useEffect(() => {
            onRecordingCompleteRef.current = onRecordingComplete;
        }, [onRecordingComplete]);

        useEffect(() => {
            disabledRef.current = disabled;
        }, [disabled]);

        const startRecording = useCallback(async () => {
            if (disabledRef.current || isRecordingRef.current) return;

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                streamRef.current = stream;
                const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
                mediaRecorderRef.current = mediaRecorder;
                chunksRef.current = [];

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        chunksRef.current.push(e.data);
                    }
                };

                mediaRecorder.onstop = () => {
                    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                    onRecordingCompleteRef.current(blob);
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorder.start();
                setIsRecording(true);
                isRecordingRef.current = true;
            } catch (err) {
                console.error('Failed to start recording:', err);
            }
        }, []); // No dependencies - uses refs for everything

        const stopRecording = useCallback(() => {
            if (mediaRecorderRef.current && isRecordingRef.current) {
                mediaRecorderRef.current.stop();
                setIsRecording(false);
                isRecordingRef.current = false;
            }
        }, []);

        // Expose methods via ref for parent component (spacebar recording)
        // Using empty dependency array since callbacks are stable
        useImperativeHandle(ref, () => ({
            startRecording,
            stopRecording,
            get isRecording() {
                return isRecordingRef.current;
            }
        }), [startRecording, stopRecording]);

        return (
            <button
                className={`audio-recorder ${isRecording ? 'recording' : ''}`}
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                disabled={disabled}
            >
                {disabled ? '...' : isRecording ? '🔴 Recording... (or hold Space)' : '🎤 Hold to speak (or hold Space)'}
            </button>
        );
    }
);

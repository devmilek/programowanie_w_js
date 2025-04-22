// This file manages the recording functionality of the application. It exports functions to start and stop recording, store audio data for each channel, and play back the recorded tracks.

let audioContext;
let mediaRecorder;
let recordedChunks = [];

export function initRecorder() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = handleDataAvailable;
        })
        .catch(error => {
            console.error('Error accessing audio devices.', error);
        });
}

function handleDataAvailable(event) {
    if (event.data.size > 0) {
        recordedChunks.push(event.data);
    }
}

export function startRecording() {
    recordedChunks = [];
    mediaRecorder.start();
}

export function stopRecording() {
    return new Promise((resolve) => {
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            resolve(url);
        };
        mediaRecorder.stop();
    });
}
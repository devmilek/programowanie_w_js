// This file contains the logic for handling drum sounds. 
// It exports functions to play sounds based on keyboard input, 
// manage the audio elements, and control the playback of individual drum sounds.

const sounds = {
    a: new Audio('./sounds/clap.wav'),
    s: new Audio('./sounds/kick.wav'),
    d: new Audio('./sounds/hihat.wav'),
    f: new Audio('./sounds/snare.wav')
};

function playSound(key) {
    const sound = sounds[key];
    if (sound) {
        sound.currentTime = 0; // Rewind to the start
        sound.play();
    }
}

function handleKeyPress(event) {
    const key = event.key.toLowerCase();
    playSound(key);
}

document.addEventListener('keydown', handleKeyPress);

export { playSound };
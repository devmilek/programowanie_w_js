// This file serves as the entry point for the JavaScript application. 
// It initializes the drum machine, sets up event listeners for keyboard interactions, and manages the playback of drum sounds.

document.addEventListener('DOMContentLoaded', () => {
    const sounds = {
        'a': document.getElementById('s1'),
        's': document.getElementById('s2'),
        'd': document.getElementById('s3'),
        // Add more sounds as needed
    };

    function playSound(key) {
        const sound = sounds[key];
        if (sound) {
            sound.currentTime = 0; // Rewind to the start
            sound.play();
        }
    }

    document.addEventListener('keydown', (event) => {
        playSound(event.key);
    });

    // Optional: Add click event listeners for sound buttons if needed
});
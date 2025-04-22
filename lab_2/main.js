const slider = document.getElementById('slider');
const slides = document.querySelectorAll('.slide');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const indicators = document.getElementById('indicators');
const pausePlayBtn = document.getElementById('pause-play');
const animationToggleBtn = document.getElementById('animation-toggle');
const kenBurnsToggleBtn = document.getElementById('ken-burns-toggle');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeLightbox = document.getElementById('close-lightbox');

let currentIndex = 0;
let interval;
let isPlaying = true;
let animationType = 'slide';
let kenBurnsEnabled = false;

function initSlider() {
    for (let i = 0; i < slides.length; i++) {
        const indicator = document.createElement('div');
        indicator.classList.add('indicator');
        if (i === 0) indicator.classList.add('active');
        indicator.addEventListener('click', () => goToSlide(i));
        indicators.appendChild(indicator);
    }

    startAutoPlay();
}

function goToSlide(index) {
    const indicatorElements = document.querySelectorAll('.indicator');

    indicatorElements.forEach(ind => ind.classList.remove('active'));

    indicatorElements[index].classList.add('active');

    if (animationType === 'slide') {
        slider.style.transform = `translateX(-${index * 100}%)`;
    } else if (animationType === 'fade') {
        slides.forEach(slide => slide.classList.remove('active'));

        slides[index].classList.add('active');
    }

    currentIndex = index;
}

function nextSlide() {
    let nextIndex = currentIndex + 1;

    if (nextIndex >= slides.length) {
        nextIndex = 0;
    }

    goToSlide(nextIndex);
}

function prevSlide() {
    let prevIndex = currentIndex - 1;

    if (prevIndex < 0) {
        prevIndex = slides.length - 1;
    }

    goToSlide(prevIndex);
}

function startAutoPlay() {
    if (interval) clearInterval(interval);
    interval = setInterval(nextSlide, 3000);
}

function pauseAutoPlay() {
    if (interval) clearInterval(interval);
}

function togglePlayPause() {
    if (isPlaying) {
        pauseAutoPlay();
        pausePlayBtn.textContent = 'Start';
    } else {
        startAutoPlay();
        pausePlayBtn.textContent = 'Pauza';
    }

    isPlaying = !isPlaying;
}

function toggleAnimationType() {
    if (animationType === 'slide') {
        animationType = 'fade';
        slider.classList.add('fade');
        animationToggleBtn.textContent = 'Przełącz na Przesuwanie';

        slides.forEach((slide, index) => {
            slide.classList.remove('active');
            if (index === currentIndex) {
                slide.classList.add('active');
            }
        });
    } else {
        animationType = 'slide';
        slider.classList.remove('fade');
        animationToggleBtn.textContent = 'Przełącz na Zanikanie';

        slider.style.transform = `translateX(-${currentIndex * 100}%)`;
    }
}

function toggleKenBurns() {
    if (kenBurnsEnabled) {
        slides.forEach(slide => {
            slide.classList.remove('ken-burns');
        });
        kenBurnsToggleBtn.textContent = 'Włącz efekt Ken Burns';
    } else {
        slides.forEach(slide => {
            slide.classList.add('ken-burns');
        });
        kenBurnsToggleBtn.textContent = 'Wyłącz efekt Ken Burns';
    }

    kenBurnsEnabled = !kenBurnsEnabled;
}

function openLightbox(img) {
    pauseAutoPlay();
    lightboxImg.src = img.src;
    lightbox.style.display = 'flex';
}

function closeLightboxHandler() {
    lightbox.style.display = 'none';
    if (isPlaying) startAutoPlay();
}

prevBtn.addEventListener('click', () => {
    prevSlide();
    if (isPlaying) {
        pauseAutoPlay();
        startAutoPlay();
    }
});

nextBtn.addEventListener('click', () => {
    nextSlide();
    if (isPlaying) {
        pauseAutoPlay();
        startAutoPlay();
    }
});

pausePlayBtn.addEventListener('click', togglePlayPause);
animationToggleBtn.addEventListener('click', toggleAnimationType);
kenBurnsToggleBtn.addEventListener('click', toggleKenBurns);
closeLightbox.addEventListener('click', closeLightboxHandler);

initSlider();
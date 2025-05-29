const sliderConfig = {
  currentSlide: 0,
  totalSlides: 5,
  autoPlay: true,
  interval: 4000,
  animationType: "slide",
};

let slider = null;
let autoPlayTimer = null;
let isPlaying = true;

const slidesContainer = document.getElementById("slides");
const dotsContainer = document.getElementById("dotsContainer");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const playPauseBtn = document.getElementById("playPauseBtn");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxClose = document.getElementById("lightboxClose");

document.addEventListener("DOMContentLoaded", function () {
  initializeSlider();
  setupEventListeners();
  startAutoPlay();
});

function initializeSlider() {
  slider = {
    container: slidesContainer,
    slides: document.querySelectorAll(".slide"),
    dots: document.querySelectorAll(".dot"),
    current: 0,
    total: sliderConfig.totalSlides,
  };

  updateSliderPosition();
  updateDots();
}

function setupEventListeners() {
  prevBtn.addEventListener("click", function () {
    goToPreviousSlide();
  });

  nextBtn.addEventListener("click", function () {
    goToNextSlide();
  });

  dotsContainer.addEventListener("click", function (e) {
    if (e.target.classList.contains("dot")) {
      const slideIndex = parseInt(e.target.dataset.slide);
      goToSlide(slideIndex);
    }
  });

  playPauseBtn.addEventListener("click", function () {
    togglePlayPause();
  });

  slider.slides.forEach(function (slide, index) {
    slide.addEventListener("click", function () {
      openLightbox(slide);
    });
  });

  lightboxClose.addEventListener("click", function () {
    closeLightbox();
  });

  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", function (e) {
    switch (e.key) {
      case "ArrowLeft":
        goToPreviousSlide();
        break;
      case "ArrowRight":
        goToNextSlide();
        break;
      case " ":
        e.preventDefault();
        togglePlayPause();
        break;
      case "Escape":
        closeLightbox();
        break;
    }
  });
}

function goToPreviousSlide() {
  slider.current--;
  if (slider.current < 0) {
    slider.current = slider.total - 1;
  }
  updateSlider();
}

function goToNextSlide() {
  slider.current++;
  if (slider.current >= slider.total) {
    slider.current = 0;
  }
  updateSlider();
}

function goToSlide(index) {
  if (index >= 0 && index < slider.total) {
    slider.current = index;
    updateSlider();
  }
}

function updateSlider() {
  updateSliderPosition();
  updateDots();
  addSlideAnimation();
}

function updateSliderPosition() {
  const translateX = -slider.current * (100 / slider.total);

  if (sliderConfig.animationType === "fade") {
    slider.slides.forEach(function (slide, index) {
      if (index === slider.current) {
        slide.style.opacity = "1";
        slide.style.zIndex = "2";
      } else {
        slide.style.opacity = "0";
        slide.style.zIndex = "1";
      }
    });
  } else {
    slider.container.style.transform = `translateX(${translateX}%)`;
  }
}

function updateDots() {
  slider.dots.forEach(function (dot, index) {
    if (index === slider.current) {
      dot.classList.add("active");
    } else {
      dot.classList.remove("active");
    }
  });
}

function addSlideAnimation() {
  const currentSlideElement = slider.slides[slider.current];
  const content = currentSlideElement.querySelector(".slide-content");

  content.classList.remove("slide-in", "fade-in");

  setTimeout(function () {
    if (sliderConfig.animationType === "fade") {
      content.classList.add("fade-in");
    } else {
      content.classList.add("slide-in");
    }
  }, 100);
}

function startAutoPlay() {
  if (sliderConfig.autoPlay && !autoPlayTimer) {
    autoPlayTimer = setInterval(function () {
      goToNextSlide();
    }, sliderConfig.interval);
    isPlaying = true;
    playPauseBtn.textContent = "Pauza";
  }
}

function stopAutoPlay() {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer);
    autoPlayTimer = null;
    isPlaying = false;
    playPauseBtn.textContent = "Start";
  }
}

function togglePlayPause() {
  if (isPlaying) {
    stopAutoPlay();
  } else {
    startAutoPlay();
  }
}

function openLightbox(slide) {
  const playing = isPlaying;
  if (isPlaying) {
    stopAutoPlay();
  }

  const backgroundImage = getComputedStyle(slide).backgroundImage;
  const imageUrl = backgroundImage.slice(5, -2);

  lightboxImg.src = imageUrl;
  lightbox.style.display = "flex";

  setTimeout(function () {
    lightbox.style.opacity = "1";
  }, 10);

  lightbox.dataset.wasPlaying = playing;
}

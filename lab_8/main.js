const OPENWEATHERMAP_API_KEY = "646c8237b850e75ba289ea587f55cd85";
const MAX_LOCATIONS = 10;
const CACHE_DURATION_MINUTES = 5;
const AUTO_UPDATE_INTERVAL_MINUTES = 5;

const cityInput = document.getElementById("cityInput");
const addCityBtn = document.getElementById("addCityBtn");
const suggestionsContainer = document.getElementById("suggestions");
const weatherCardsContainer = document.getElementById("weatherCards");
const errorMessage = document.getElementById("error-message");
const limitMessage = document.getElementById("limit-message");
const chartModal = document.getElementById("chartModal");
const chartModalTitle = document.getElementById("chartModalTitle");
const closeChartModalBtn = document.getElementById("closeChartModal");
const hourlyChartCanvas = document.getElementById("hourlyChart");
let hourlyChart = null;

let savedLocations = JSON.parse(localStorage.getItem("weatherLocations")) || [];
let weatherCache = JSON.parse(localStorage.getItem("weatherCache")) || {};
let debounceTimer;

async function getCurrentWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    city
  )}&appid=${OPENWEATHERMAP_API_KEY}&units=metric&lang=pl`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Nie znaleziono miasta: ${city}`);
      } else {
        throw new Error(`blad: ${response.statusText}`);
      }
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("blad podczas pobierania pogody", error);
    showError(error.message);
    return null;
  }
}

async function getForecast(city) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
    city
  )}&appid=${OPENWEATHERMAP_API_KEY}&units=metric&lang=pl`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`blad api prognozy: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("blad podczas pobierania prognozy:", error);
    return null;
  }
}
async function getCitySuggestions(query) {
  if (query.length < 3) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query
  )}&count=5&language=pl&format=json`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`blad api: ${response.statusText}`);
    }
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("blad podczas pobierania sugensttii:", error);
    return [];
  }
}
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
  setTimeout(() => {
    errorMessage.classList.add("hidden");
  }, 5000);
}

function updateLimitMessage() {
  if (savedLocations.length >= MAX_LOCATIONS) {
    limitMessage.classList.remove("hidden");
    cityInput.disabled = true;
    addCityBtn.disabled = true;
  } else {
    limitMessage.classList.add("hidden");
    cityInput.disabled = false;
    addCityBtn.disabled = false;
  }
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function isCacheValid(timestamp) {
  if (!timestamp) return false;
  const now = Date.now();
  const cacheAgeMinutes = (now - timestamp) / (1000 * 60);
  return cacheAgeMinutes < CACHE_DURATION_MINUTES;
}

function getWeatherIconUrl(iconCode) {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

// ui

function createWeatherCard(city, weatherData) {
  const card = document.createElement("div");
  card.className =
    "weather-card bg-gradient-to-br from-blue-100 to-blue-200 p-5 rounded-lg shadow hover:shadow-md transition duration-300 relative"; // Dodano relative dla przycisku usuwania
  card.dataset.city = city;

  if (!weatherData || !weatherData.main || !weatherData.weather) {
    card.innerHTML = `
                    <h3 class="text-xl font-semibold text-gray-800 mb-2">${city}</h3>
                    <p class="text-gray-600">Ładowanie danych...</p>
                    <button class="remove-city-btn absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1 px-2 rounded-full" data-city="${city}">&times;</button>
                `;
  } else {
    const iconUrl = getWeatherIconUrl(weatherData.weather[0].icon);
    card.innerHTML = `
                    <button class="remove-city-btn absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1 px-2 rounded-full" data-city="${city}">&times;</button>
                    <div class="flex items-center mb-3">
                        <img src="${iconUrl}" alt="${
      weatherData.weather[0].description
    }" class="w-12 h-12 mr-3">
                        <div>
                            <h3 class="text-xl font-semibold text-gray-800">${city}</h3>
                            <p class="text-sm text-gray-600 capitalize">${
                              weatherData.weather[0].description
                            }</p>
                        </div>
                    </div>
                    <div class="text-gray-700 space-y-1">
                        <p><span class="font-medium">Temperatura:</span> ${Math.round(
                          weatherData.main.temp
                        )}°C</p>
                        <p><span class="font-medium">Odczuwalna:</span> ${Math.round(
                          weatherData.main.feels_like
                        )}°C</p>
                        <p><span class="font-medium">Wilgotność:</span> ${
                          weatherData.main.humidity
                        }%</p>
                        <p><span class="font-medium">Ciśnienie:</span> ${
                          weatherData.main.pressure
                        } hPa</p>
                        <p><span class="font-medium">Wiatr:</span> ${weatherData.wind.speed.toFixed(
                          1
                        )} m/s</p>
                    </div>
                    <p class="text-xs text-gray-500 mt-3">Ostatnia aktualizacja: ${new Date(
                      weatherData.timestamp
                    ).toLocaleTimeString()}</p>
                `;
  }

  card.addEventListener("click", (event) => {
    if (event.target.classList.contains("remove-city-btn")) {
      return;
    }
    displayHourlyChart(city);
  });

  const removeBtn = card.querySelector(".remove-city-btn");
  if (removeBtn) {
    removeBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      removeLocation(city);
    });
  }

  weatherCardsContainer.appendChild(card);
}

function updateWeatherCard(city, weatherData) {
  const card = weatherCardsContainer.querySelector(
    `.weather-card[data-city="${city}"]`
  );
  if (card && weatherData && weatherData.main && weatherData.weather) {
    const iconUrl = getWeatherIconUrl(weatherData.weather[0].icon);
    card.innerHTML = `
                    <button class="remove-city-btn absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1 px-2 rounded-full" data-city="${city}">&times;</button>
                    <div class="flex items-center mb-3">
                        <img src="${iconUrl}" alt="${
      weatherData.weather[0].description
    }" class="w-12 h-12 mr-3">
                        <div>
                            <h3 class="text-xl font-semibold text-gray-800">${city}</h3>
                            <p class="text-sm text-gray-600 capitalize">${
                              weatherData.weather[0].description
                            }</p>
                        </div>
                    </div>
                    <div class="text-gray-700 space-y-1">
                        <p><span class="font-medium">Temperatura:</span> ${Math.round(
                          weatherData.main.temp
                        )}°C</p>
                        <p><span class="font-medium">Odczuwalna:</span> ${Math.round(
                          weatherData.main.feels_like
                        )}°C</p>
                        <p><span class="font-medium">Wilgotność:</span> ${
                          weatherData.main.humidity
                        }%</p>
                        <p><span class="font-medium">Ciśnienie:</span> ${
                          weatherData.main.pressure
                        } hPa</p>
                        <p><span class="font-medium">Wiatr:</span> ${weatherData.wind.speed.toFixed(
                          1
                        )} m/s</p>
                    </div>
                    <p class="text-xs text-gray-500 mt-3">Ostatnia aktualizacja: ${new Date(
                      weatherData.timestamp
                    ).toLocaleTimeString()}</p>
                `;

    const removeBtn = card.querySelector(".remove-city-btn");
    if (removeBtn) {
      removeBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        removeLocation(city);
      });
    }
  } else if (card) {
    card.querySelector("p.text-gray-600").textContent =
      "Błąd ładowania danych.";
  }
}

// renderowanie
function renderLocations() {
  weatherCardsContainer.innerHTML = "";
  savedLocations.forEach((city) => {
    const cachedData = weatherCache[city];
    createWeatherCard(city, cachedData);
    fetchAndUpdateWeather(city);
  });
  updateLimitMessage();
}

function displaySuggestions(suggestions) {
  suggestionsContainer.innerHTML = "";
  if (suggestions.length > 0) {
    suggestions.forEach((cityData) => {
      const suggestionDiv = document.createElement("div");
      let displayName = cityData.name;
      if (cityData.admin1) displayName += `, ${cityData.admin1}`;
      if (cityData.country) displayName += `, ${cityData.country}`;
      suggestionDiv.textContent = displayName;
      suggestionDiv.addEventListener("click", () => {
        cityInput.value = cityData.name;
        suggestionsContainer.classList.add("hidden");
        suggestionsContainer.innerHTML = "";
        addLocation();
      });
      suggestionsContainer.appendChild(suggestionDiv);
    });
    suggestionsContainer.classList.remove("hidden");
  } else {
    suggestionsContainer.classList.add("hidden");
  }
}

// wykresy
async function displayHourlyChart(city) {
  chartModalTitle.textContent = `Prognoza godzinowa dla: ${city}`;
  chartModal.classList.remove("hidden");

  const forecastData = await getForecast(city);

  if (hourlyChart) {
    hourlyChart.destroy();
  }

  if (forecastData && forecastData.list) {
    const next12HoursData = forecastData.list.slice(0, 4);

    const labels = next12HoursData.map((item) => {
      const date = new Date(item.dt * 1000);
      return `${date.getHours()}:00`;
    });
    const temperatures = next12HoursData.map((item) => item.main.temp);

    const ctx = hourlyChartCanvas.getContext("2d");
    hourlyChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Temperatura (°C)",
            data: temperatures,
            fill: true,
            borderColor: "rgb(59, 130, 246)",
            backgroundColor: "rgba(59, 130, 246, 0.2)",
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: "Temperatura °C",
            },
          },
          x: {
            title: {
              display: true,
              text: "Godzina",
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    });
  } else {
    const ctx = hourlyChartCanvas.getContext("2d");
    ctx.clearRect(0, 0, hourlyChartCanvas.width, hourlyChartCanvas.height);
    ctx.font = "16px Inter";
    ctx.fillStyle = "#dc2626";
    ctx.textAlign = "center";
    ctx.fillText(
      "Nie udało się załadować prognozy.",
      hourlyChartCanvas.width / 2,
      hourlyChartCanvas.height / 2
    );
    console.error("brak prognozy do wyswietlenia", city);
  }
}

function hideChartModal() {
  chartModal.classList.add("hidden");
  if (hourlyChart) {
    hourlyChart.destroy();
    hourlyChart = null;
  }
}

async function fetchAndUpdateWeather(city, forceUpdate = false) {
  const cached = weatherCache[city];

  if (!forceUpdate && cached && isCacheValid(cached.timestamp)) {
    updateWeatherCard(city, cached);
    return;
  }

  const currentData = await getCurrentWeather(city);

  if (currentData) {
    currentData.timestamp = Date.now();
    weatherCache[city] = currentData;
    saveData("weatherCache", weatherCache);
    updateWeatherCard(city, currentData);
  } else {
    if (cached) {
      console.warn(
        `Nie udało się pobrać nowych danych dla ${city}, używanie starych danych z cache.`
      );
      updateWeatherCard(city, cached);
    } else {
      updateWeatherCard(city, null);
    }
  }
}

// lokalizacje
function addLocation() {
  const city = cityInput.value.trim();
  if (!city) {
    showError("Wpisz nazwe maista");
    return;
  }
  if (savedLocations.includes(city)) {
    showError("To miasto jest juz na liście");
    return;
  }
  if (savedLocations.length >= MAX_LOCATIONS) {
    showError("Osiągnięto maksymalną liczbę lokalizacji: 10");
    return;
  }

  getCurrentWeather(city).then((data) => {
    if (data) {
      savedLocations.push(city);
      saveData("weatherLocations", savedLocations);
      createWeatherCard(city, null);
      fetchAndUpdateWeather(city, true);
      cityInput.value = "";
      suggestionsContainer.classList.add("hidden");
      updateLimitMessage();
    }
  });
}

function removeLocation(cityToRemove) {
  savedLocations = savedLocations.filter((city) => city !== cityToRemove);
  saveData("weatherLocations", savedLocations);
  delete weatherCache[cityToRemove];
  saveData("weatherCache", weatherCache);
  renderLocations();
}

function autoUpdateWeather() {
  console.log("aktialiowanie pogody");
  savedLocations.forEach((city) => {
    fetchAndUpdateWeather(city);
  });
}

addCityBtn.addEventListener("click", addLocation);
cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    addLocation();
  }
});

cityInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  const query = cityInput.value.trim();
  suggestionsContainer.classList.add("hidden");
  if (query.length >= 3) {
    debounceTimer = setTimeout(async () => {
      const suggestions = await getCitySuggestions(query);
      displaySuggestions(suggestions);
    }, 500);
  } else {
    suggestionsContainer.innerHTML = "";
  }
});

document.addEventListener("click", (event) => {
  if (
    !cityInput.contains(event.target) &&
    !suggestionsContainer.contains(event.target)
  ) {
    suggestionsContainer.classList.add("hidden");
  }
});

closeChartModalBtn.addEventListener("click", hideChartModal);
chartModal.addEventListener("click", (event) => {
  if (event.target === chartModal) {
    hideChartModal();
  }
});

renderLocations();
setInterval(autoUpdateWeather, AUTO_UPDATE_INTERVAL_MINUTES * 60 * 1000);

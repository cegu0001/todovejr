// Genbruger weathercode -> ikon mapping fra "outdoor pakken" (open_meteo/weather_open_meteo.js)
export const wwCodes = {
  0: "clearsky_day.png",
  1: "fair_day.png",
  2: "partlycloudy_day.png",
  3: "cloudy.png",
  45: "fog.png",
  48: "fog.png",
  51: "lightrain.png",
  53: "lightrain.png",
  55: "lightrain.png",
  56: "lightsleet.png",
  57: "lightsleet.png",
  61: "lightrain.png",
  63: "rain.png",
  65: "heavyrain.png",
  66: "lightsleet.png",
  67: "lightsleet.png",
  71: "lightsnow.png",
  73: "snow.png",
  75: "heavysnow.png",
  77: "lightsnow.png",
  80: "lightrainshowers_day.png",
  81: "rainshowers_day.png",
  82: "heavyrainshowers_day.png",
  85: "lightsnowshowers_day.png",
  86: "heavysnowshowers_day.png",
  95: "rainandthunder.png",
  96: "rainandthunder.png",
  99: "rainandthunder.png",
};

// Danske beskrivelser til feedback-tekst i UI'et
const wwDescriptions = {
  0: "Klar himmel",
  1: "Pænt vejr",
  2: "Delvist skyet",
  3: "Skyet",
  45: "Tåge",
  48: "Tåge med rimfrost",
  51: "Let regn",
  53: "Regn",
  55: "Tæt regn",
  56: "Lette sne/isslag",
  57: "Isslag",
  61: "Let regn",
  63: "Regn",
  65: "Kraftig regn",
  66: "Isslag",
  67: "Kraftigt isslag",
  71: "Let sne",
  73: "Sne",
  75: "Kraftig sne",
  77: "Snekorn",
  80: "Lette regnbyger",
  81: "Regnbyger",
  82: "Kraftige regnbyger",
  85: "Lette snebyger",
  86: "Kraftige snebyger",
  95: "Tordenvejr",
  96: "Tordenvejr med hagl",
  99: "Kraftigt tordenvejr med hagl",
};

// Koder der tæller som "regn" (og dermed uegnet til udendørs opgaver)
const rainCodes = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);

export function isRainCode(code) {
  return rainCodes.has(code);
}

export function getWeatherIcon(code) {
  return wwCodes[code] ? `png/${wwCodes[code]}` : "png/no_weather.png";
}

export function getWeatherDescription(code) {
  return wwDescriptions[code] || "Ukendt vejr";
}

/**
 * Finder breddegrad/længdegrad for et bynavn via Open-Meteo's gratis geokodnings-API.
 * Kaster en fejl hvis byen ikke findes, så den kan fanges og vises som feedback.
 */
export async function geocodeLocation(cityName) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    cityName,
  )}&count=1&language=da&format=json`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Kunne ikke slå lokation op");
  }
  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error(`Fandt ikke en lokation der matcher "${cityName}"`);
  }

  const match = data.results[0];
  return {
    latitude: match.latitude,
    longitude: match.longitude,
    name: match.name,
  };
}

/**
 * Henter vejrudsigt (weathercode + min/max temperatur) for en given dato og lokation.
 * Open-Meteo's forecast-endpoint dækker ca. 92 dage tilbage og 16 dage frem, så
 * dage udenfor det interval vil naturligt fejle her - det fanges af den kaldende kode.
 */
export async function fetchWeatherForDate(dateStr, latitude, longitude) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto` +
    `&start_date=${dateStr}&end_date=${dateStr}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Vejr-API'et svarede ikke korrekt");
  }
  const data = await response.json();

  if (!data.daily || !data.daily.weathercode || data.daily.weathercode.length === 0) {
    throw new Error("Ingen vejrdata for den valgte dato");
  }

  return {
    code: data.daily.weathercode[0],
    tempMax: data.daily.temperature_2m_max[0],
    tempMin: data.daily.temperature_2m_min[0],
  };
}

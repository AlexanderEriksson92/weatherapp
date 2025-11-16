// src/App.tsx

import { useState, useEffect } from 'react';
import './App.css';

// 1. TYPEDEFINITION: Interfacet för väderdata (flyttat hit för att undvika importproblem)
interface WeatherData {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
  };
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  }[];
  wind: {
    speed: number;
    deg: number;
  };
  sys: {
    country: string;
  };
}

// --- ERSÄTT DESSA VÄRDEN ---
const API_KEY = 'fe6d82ad06724c0e87c5e3a66bead4da'; // <--- ERSÄTT MED DIN NYCKEL
const CITY = 'Stockholm'; 
const UNITS = 'metric'; // Celsius
// ----------------------------

function App() {
  // 2. STATE MANAGEMENT
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 3. API-ANROP
  useEffect(() => {
    const fetchWeather = async () => {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&units=${UNITS}&appid=${API_KEY}`;

      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          // Försöker läsa felmeddelandet från API:et
          const errorData = await response.json();
          throw new Error(`Kunde inte hämta väderdata: ${errorData.message || response.statusText}`);
        }
        
        // Kastar datan till vårt definierade interface WeatherData
        const data: WeatherData = await response.json();
        
        setWeatherData(data);
        setError(null);

      } catch (err) {
        setError(err instanceof Error ? err.message : "Ett okänt fel uppstod.");
        setWeatherData(null);
      } finally {
        // Detta garanterar att vi lämnar laddningsläget oavsett resultat
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, []); // Körs bara vid första renderingen

  // 4. RENDERING & KONTROLLER (ORDER VIKTIG)
  if (isLoading) {
    return <div className="weather-app">Laddar väderdata...</div>;
  }

  if (error) {
    return <div className="weather-app error">Fel: {error}</div>;
  }

  // TypeScript-kontroll som garanterar att weatherData är fyllt
  if (!weatherData) {
    return <div className="weather-app">Ingen data tillgänglig.</div>;
  }

  // Slutlig rendering när data finns
  return (
    <div className="weather-app">
      <h1>Väder i {weatherData.name}, {weatherData.sys.country}</h1>
      <div className="weather-details">
        {/* Visa temperaturen avrundad */}
        <p>Temperatur: {Math.round(weatherData.main.temp)}°C</p>
        <p>Känns som: {Math.round(weatherData.main.feels_like)}°C</p>
        <p>Beskrivning: {weatherData.weather[0].description}</p>
        <p>Vindhastighet: {weatherData.wind.speed} m/s</p>
      </div>
    </div>
  );
}

export default App;
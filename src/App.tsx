import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Wind,
  Droplets,
  Thermometer,
  Cloud,
  Sun,
  CloudRain,
  Snowflake,
  MapPin,
  Navigation
} from 'lucide-react';
import './App.css';

// --- INTERFACES ---
interface ForecastItem {
  dt: number;
  dt_txt: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
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
}

interface ForecastData {
  city: {
    name: string;
    country: string;
  };
  list: ForecastItem[];
}

// --- KONSTANTER ---
const API_KEY = 'fe6d82ad06724c0e87c5e3a66bead4da';
const UNITS = 'metric';
const LANGUAGE = 'sv';

function App() {
  // --- STATES ---
  const [cityInput, setCityInput] = useState<string>('');
  const [citySearch, setCitySearch] = useState<string>('Stockholm');
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyForecasts, setDailyForecasts] = useState<ForecastItem[]>([]);

  // Autocomplete states
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // --- HJÄLPFUNKTIONER ---
  const getWeatherIcon = (main: string) => {
    switch (main.toLowerCase()) {
      case 'clouds': return <Cloud size={32} className="weather-icon" />;
      case 'rain':
      case 'drizzle': return <CloudRain size={32} className="weather-icon" />;
      case 'snow': return <Snowflake size={32} className="weather-icon" />;
      case 'clear': return <Sun size={32} className="weather-icon" />;
      default: return <Sun size={32} className="weather-icon" />;
    }
  };

  // --- API ANROP ---
  const fetchWeather = async (query: string, isCoords = false) => {
    setIsLoading(true);
    setError(null);

    const url = isCoords
      ? `https://api.openweathermap.org/data/2.5/forecast?${query}&units=${UNITS}&lang=${LANGUAGE}&appid=${API_KEY}`
      : `https://api.openweathermap.org/data/2.5/forecast?q=${query}&units=${UNITS}&lang=${LANGUAGE}&appid=${API_KEY}`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Kunde inte hitta platsen");
      const data: ForecastData = await response.json();

      // Extrahera unika datum för att få en daglig översikt
      const uniqueDates = new Set<string>();
      const daily = data.list.filter(item => {
        const date = item.dt_txt.split(' ')[0];
        if (!uniqueDates.has(date) && (item.dt_txt.includes('12:00:00') || uniqueDates.size === 0)) {
          uniqueDates.add(date);
          return true;
        }
        return false;
      });

      setForecastData(data);
      setDailyForecasts(daily);
      setDailyForecasts(daily.slice(0, 5));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ett fel uppstod");
    } finally {
      setIsLoading(false);
    }
  };

  // --- EFFECTS ---

  // Huvudväder vid ändring av citySearch
  useEffect(() => {
    fetchWeather(citySearch);
  }, [citySearch]);

  // Autocomplete logik (Debounce)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (cityInput.length < 3) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await fetch(
          `https://api.openweathermap.org/geo/1.0/direct?q=${cityInput}&limit=5&appid=${API_KEY}`
        );
        const data = await response.json();
        setSuggestions(data);
      } catch (err) {
        console.error("Kunde inte hämta förslag", err);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 400);
    return () => clearTimeout(timeoutId);
  }, [cityInput]);

  // Stäng förslag när man klickar utanför
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- HANDLERS ---
  const handleSelectSuggestion = (city: any) => {
    const query = city.state ? `${city.name},${city.state},${city.country}` : `${city.name},${city.country}`;
    setCitySearch(query);
    setCityInput(city.name);
    setShowSuggestions(false);
  };
  
  // Hämta väder baserat på användarens nuvarande position
  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        fetchWeather(`lat=${latitude}&lon=${longitude}`, true);
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cityInput.trim()) {
      setCitySearch(cityInput);
      setShowSuggestions(false);
    }
  };

  const today = dailyForecasts[0];

  return (
    <div className={`weather-container ${today?.weather[0].main.toLowerCase() || ''}`}>
      <div className="weather-glass-card">

        <header className="weather-header">
          <div className="search-container" ref={searchContainerRef}>
            <form onSubmit={handleSubmit} className="search-bar">
              <input
                value={cityInput}
                onChange={(e) => {
                  setCityInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Sök stad..."
              />
              <button type="submit"><Search size={20} /></button>
            </form>

            {showSuggestions && suggestions.length > 0 && (
              <ul className="suggestions-list">
                {suggestions.map((city, index) => (
                  <li key={index} onClick={() => handleSelectSuggestion(city)}>
                    <MapPin size={14} />
                    <span>{city.name}, {city.state ? `${city.state}, ` : ''}{city.country}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button onClick={handleLocationClick} className="location-btn">
            <Navigation size={20} />
          </button>
        </header>

        {isLoading ? (
          <div className="status-display">
            <div className="spinner"></div>
            <p>Hämtar väder...</p>
          </div>
        ) : error ? (
          <div className="status-display">
            <p className="error-msg">{error}</p>
            <button onClick={() => setCitySearch('Stockholm')}>Gå tillbaka</button>
          </div>
        ) : forecastData && today && (
          <main className="weather-content">
            <section className="current-weather">
              <div className="location-info">
                <MapPin size={16} />
                <h2>{forecastData.city.name}, {forecastData.city.country}</h2>
              </div>
              <p className="date-today">
                {new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>

              <div className="main-temp-display">
                {getWeatherIcon(today.weather[0].main)}
                <h1>{Math.round(today.main.temp)}°</h1>
              </div>

              <p className="description-text">{today.weather[0].description}</p>

              <div className="stats-row">
                <div className="stat-item">
                  <Droplets size={18} />
                  <span>{today.main.humidity}%</span>
                  <small>Fuktighet</small>
                </div>
                <div className="stat-item">
                  <Wind size={18} />
                  <span>{today.wind.speed} m/s</span>
                  <small>Vind</small>
                </div>
                <div className="stat-item">
                  <Thermometer size={18} />
                  <span>{Math.round(today.main.feels_like)}°</span>
                  <small>Känns som</small>
                </div>
              </div>
            </section>

            <section className="forecast-section">
              <div className="forecast-grid">
                {dailyForecasts.slice(1).map((day) => (
                  <div key={day.dt} className="forecast-mini-card">
                    <span className="day-name">
                      {new Date(day.dt_txt).toLocaleDateString('sv-SE', { weekday: 'short' })}
                    </span>
                    {getWeatherIcon(day.weather[0].main)}
                    <span className="day-temp">{Math.round(day.main.temp)}°</span>
                  </div>
                ))}
              </div>
            </section>
          </main>
        )}
      </div>
    </div>
  );
}

export default App;
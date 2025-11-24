import { useState, useEffect } from 'react';
import './App.css';

interface ForecastItem {
  dt: number;
  dt_txt: string;
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
}

interface ForecastData {
  city: {
    name: string;
    country: string;
  };
  list: ForecastItem[];
}

const API_KEY = 'fe6d82ad06724c0e87c5e3a66bead4da';
const CITY = 'Stockholm'; 
const UNITS = 'metric';
const LANGUAGE = 'sv';

const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { weekday: 'short' };
    let dayName = date.toLocaleDateString('sv-SE', options);
    return dayName.charAt(0).toUpperCase() + dayName.slice(1);
};

const isToday = (dateString: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    const itemDate = new Date(dateString);
    itemDate.setHours(0, 0, 0, 0); 

    return today.getTime() === itemDate.getTime();
};

function App() {
  const [cityInput, setCityInput] = useState<string>(CITY);
  const [citySearch, setCitySearch] = useState<string>(CITY);
  
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyForecasts, setDailyForecasts] = useState<ForecastItem[]>([]);

  useEffect(() => {
    if (!citySearch) return;

    const fetchForecast = async () => {
      setIsLoading(true);
      setError(null);
      
      const url = `https://api.openweathermap.org/data/2.5/forecast?q=${citySearch}&units=${UNITS}&lang=${LANGUAGE}&appid=${API_KEY}`;

      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || response.statusText);
        }
        
        const data: ForecastData = await response.json();
        
        // Filtrering: Plockar ut de 5 unika dagarna (kl 12:00)
        const uniqueDates = new Set<string>();
        const dailyForecasts = data.list.filter(item => {
            const date = item.dt_txt.split(' ')[0];
            if (!uniqueDates.has(date) && item.dt_txt.includes('12:00:00') && uniqueDates.size < 5) {
                uniqueDates.add(date);
                return true;
            }
            return false;
        });

        setForecastData(data);
        setDailyForecasts(dailyForecasts.slice(0, 5));

      } catch (err) {
        setError(err instanceof Error ? err.message : "Ett okänt fel uppstod.");
        setForecastData(null);
        setDailyForecasts([]);
      } finally {
        setIsLoading(false); 
      }
    };

    fetchForecast();
  }, [citySearch]); 

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCitySearch(cityInput); 
  };
  
  if (isLoading) {
    return (
        <div className="weather-app">
            <form onSubmit={handleSubmit} className="search-form">
                <input type="text" placeholder="Ange stad..." value={cityInput} onChange={(e) => setCityInput(e.target.value)} required />
                <button type="submit">Sök</button>
            </form>
            <p>Laddar väderdata...</p>
        </div>
    );
  }

  if (error) {
    return (
        <div className="weather-app">
            <form onSubmit={handleSubmit} className="search-form">
                <input type="text" placeholder="Ange stad..." value={cityInput} onChange={(e) => setCityInput(e.target.value)} required />
                <button type="submit">Sök</button>
            </form>
            <p className="error">Fel: {error}</p>
        </div>
    );
  }

  if (!forecastData || dailyForecasts.length === 0) {
    return <div className="weather-app">Ingen data tillgänglig.</div>;
  }

  return (
    <div className="weather-app">
      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="text"
          placeholder="Ange stad..."
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
          required
        />
        <button type="submit">Sök</button>
      </form>
      
      <h1>Prognos för {forecastData.city.name}, {forecastData.city.country}</h1>

      <div className="forecast-list">
        {dailyForecasts.map((day) => (
          <div 
            key={day.dt} 
            className={`forecast-item ${isToday(day.dt_txt) ? 'today-item' : ''}`}
          >
            <h3>{getDayName(day.dt_txt)}</h3> 
            {/* KORRIGERAD RAD */}
            <p className="temp">{Math.round(day.main.temp)}°C</p>
            <p className="description">{day.weather[0].description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
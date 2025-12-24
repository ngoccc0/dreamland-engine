import { WeatherCondition, WeatherType, WeatherIntensity } from '@/core/types/weather';

/**
 * Derive visual emoji for weather condition (for UI rendering).
 */
export function getWeatherEmoji(weather: WeatherCondition): string {
    switch (weather.type) {
        case WeatherType.CLEAR: return '☀️';
        case WeatherType.CLOUDY: return '☁️';
        case WeatherType.RAIN: return weather.intensity === WeatherIntensity.SEVERE ? '⛈️' : '🌧️';
        case WeatherType.SNOW: return '❄️';
        case WeatherType.WIND: return '💨';
        case WeatherType.STORM: return '⛈️';
        case WeatherType.THUNDER_STORM: return '⛈️';
        case WeatherType.FOG: return '🌫️';
        case WeatherType.HEAVY_FOG: return '🌫️';
        case WeatherType.HEATWAVE: return '🔥';
        case WeatherType.BLIZZARD: return '❄️';
        case WeatherType.SANDSTORM: return '🌪️';
        default: return '🌤️';
    }
}

/**
 * Describe weather condition in natural language.
 */
export function describeWeather(weather: WeatherCondition): string {
    const intensity =
        weather.intensity === WeatherIntensity.SEVERE ? ' intense'
            : weather.intensity === WeatherIntensity.NORMAL ? '' : ' mild';

    switch (weather.type) {
        case WeatherType.CLEAR: return `Clear skies (${weather.temperature}°C)`;
        case WeatherType.CLOUDY: return `Cloudy skies (${weather.temperature}°C)`;
        case WeatherType.RAIN: return `${intensity} rain (${weather.temperature}°C)`;
        case WeatherType.SNOW: return `${intensity} snow (${weather.temperature}°C)`;
        case WeatherType.WIND: return `${intensity} winds (${weather.windSpeed} km/h)`;
        case WeatherType.STORM: return `${intensity} storm`;
        case WeatherType.THUNDER_STORM: return `Thunderstorm`;
        case WeatherType.FOG: return `${intensity} fog (visibility: ${weather.visibility}m)`;
        case WeatherType.HEAVY_FOG: return `Heavy fog (visibility: ${weather.visibility}m)`;
        case WeatherType.HEATWAVE: return `Extreme heat (${weather.temperature}°C)`;
        case WeatherType.BLIZZARD: return `Blizzard (${weather.temperature}°C)`;
        case WeatherType.SANDSTORM: return `Sandstorm`;
        default: return 'Unknown weather';
    }
}

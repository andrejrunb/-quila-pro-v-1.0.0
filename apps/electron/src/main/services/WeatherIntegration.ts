import Logger from './Logger';

/**
 * Passo 2: Implementar OpenWeatherMap (Gratuito)
 * Integração com API de clima para análise contextual de presença
 */

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  cloudiness: number;
  condition: string;
  description: string;
  icon: string;
  timestamp: number;
}

export interface AttendanceWeatherCorrelation {
  date: string;
  weather: WeatherData;
  attendanceRate: number;
  absentCount: number;
  insight: string;
}

export class WeatherIntegration {
  private apiKey: string;
  private logger: Logger;
  private baseUrl = 'https://api.openweathermap.org/data/2.5';
  private schoolLocation: { lat: number; lon: number } = {
    lat: -23.5505, // São Paulo (padrão)
    lon: -46.6333,
  };

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENWEATHER_API_KEY || '';
    this.logger = new Logger('WeatherIntegration');

    if (!this.apiKey) {
      this.logger.warn('OpenWeatherMap API key não configurada. Usando modo simulado.');
    }
  }

  /**
   * Configurar localização da escola
   */
  setSchoolLocation(lat: number, lon: number): void {
    this.schoolLocation = { lat, lon };
    this.logger.info(`Localização da escola configurada: ${lat}, ${lon}`);
  }

  /**
   * Obter dados de clima atual
   */
  async getCurrentWeather(): Promise<WeatherData | null> {
    try {
      if (!this.apiKey) {
        return this.simulateWeatherData();
      }

      const url = `${this.baseUrl}/weather?lat=${this.schoolLocation.lat}&lon=${this.schoolLocation.lon}&appid=${this.apiKey}&units=metric&lang=pt_br`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      return {
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: Math.round(data.wind.speed * 10) / 10,
        cloudiness: data.clouds.all,
        condition: data.weather[0].main,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logger.error(`Erro ao obter clima: ${(error as Error).message}`);
      return this.simulateWeatherData();
    }
  }

  /**
   * Obter previsão de 5 dias
   */
  async getForecast(): Promise<WeatherData[]> {
    try {
      if (!this.apiKey) {
        return [this.simulateWeatherData()!];
      }

      const url = `${this.baseUrl}/forecast?lat=${this.schoolLocation.lat}&lon=${this.schoolLocation.lon}&appid=${this.apiKey}&units=metric&lang=pt_br`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      return data.list.slice(0, 5).map((item: any) => ({
        temperature: Math.round(item.main.temp),
        feelsLike: Math.round(item.main.feels_like),
        humidity: item.main.humidity,
        pressure: item.main.pressure,
        windSpeed: Math.round(item.wind.speed * 10) / 10,
        cloudiness: item.clouds.all,
        condition: item.weather[0].main,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        timestamp: item.dt * 1000,
      }));
    } catch (error) {
      this.logger.error(`Erro ao obter previsão: ${(error as Error).message}`);
      return [this.simulateWeatherData()!];
    }
  }

  /**
   * Analisar impacto do clima na presença
   */
  async analyzeWeatherImpact(
    weatherData: WeatherData,
    attendanceRate: number,
    absentCount: number
  ): Promise<AttendanceWeatherCorrelation> {
    try {
      const insight = this.generateInsight(weatherData, attendanceRate, absentCount);

      return {
        date: new Date().toISOString().split('T')[0],
        weather: weatherData,
        attendanceRate,
        absentCount,
        insight,
      };
    } catch (error) {
      this.logger.error(`Erro ao analisar impacto: ${(error as Error).message}`);
      return {
        date: new Date().toISOString().split('T')[0],
        weather: weatherData,
        attendanceRate,
        absentCount,
        insight: 'Erro ao gerar insight',
      };
    }
  }

  /**
   * Gerar insight contextual
   */
  private generateInsight(
    weather: WeatherData,
    attendanceRate: number,
    absentCount: number
  ): string {
    let insight = '';

    // Análise de temperatura
    if (weather.temperature > 35) {
      insight += '🌡️ Dia muito quente. ';
    } else if (weather.temperature < 10) {
      insight += '❄️ Dia muito frio. ';
    }

    // Análise de chuva
    if (
      weather.condition.toLowerCase().includes('rain') ||
      weather.condition.toLowerCase().includes('chuva')
    ) {
      insight += '🌧️ Chuva detectada. ';
      if (attendanceRate < 80) {
        insight += `Presença reduzida (${attendanceRate}%). `;
      }
    }

    // Análise de vento
    if (weather.windSpeed > 30) {
      insight += '💨 Vento forte. ';
    }

    // Análise de umidade
    if (weather.humidity > 80) {
      insight += '💧 Umidade alta. ';
    }

    // Análise de presença
    if (attendanceRate > 95) {
      insight += '✅ Excelente presença. ';
    } else if (attendanceRate < 70) {
      insight += `⚠️ Presença baixa (${attendanceRate}%). ${absentCount} alunos ausentes. `;
    }

    // Correlação
    if (
      (weather.condition.toLowerCase().includes('rain') ||
        weather.condition.toLowerCase().includes('chuva')) &&
      attendanceRate < 80
    ) {
      insight += 'Possível correlação entre chuva e ausências.';
    }

    return insight || 'Dia normal de aulas.';
  }

  /**
   * Simular dados de clima (para testes sem API key)
   */
  private simulateWeatherData(): WeatherData {
    const conditions = [
      { condition: 'Sunny', description: 'Ensolarado', icon: '01d' },
      { condition: 'Cloudy', description: 'Nublado', icon: '04d' },
      { condition: 'Rainy', description: 'Chuvoso', icon: '10d' },
      { condition: 'Stormy', description: 'Tempestuoso', icon: '11d' },
    ];

    const random = conditions[Math.floor(Math.random() * conditions.length)];

    return {
      temperature: Math.round(Math.random() * 15 + 20), // 20-35°C
      feelsLike: Math.round(Math.random() * 15 + 20),
      humidity: Math.round(Math.random() * 40 + 40), // 40-80%
      pressure: Math.round(Math.random() * 20 + 1010), // 1010-1030 hPa
      windSpeed: Math.round(Math.random() * 20 * 10) / 10, // 0-20 km/h
      cloudiness: Math.round(Math.random() * 100),
      condition: random.condition,
      description: random.description,
      icon: random.icon,
      timestamp: Date.now(),
    };
  }

  /**
   * Formatar dados de clima para exibição
   */
  formatWeatherData(weather: WeatherData): string {
    return `
🌡️ Temperatura: ${weather.temperature}°C (sensação: ${weather.feelsLike}°C)
💧 Umidade: ${weather.humidity}%
💨 Vento: ${weather.windSpeed} km/h
☁️ Nebulosidade: ${weather.cloudiness}%
📝 Condição: ${weather.description}
    `.trim();
  }

  /**
   * Obter emoji para condição climática
   */
  getWeatherEmoji(condition: string): string {
    const condition_lower = condition.toLowerCase();

    if (condition_lower.includes('sun') || condition_lower.includes('clear')) return '☀️';
    if (condition_lower.includes('cloud')) return '☁️';
    if (condition_lower.includes('rain') || condition_lower.includes('chuva')) return '🌧️';
    if (condition_lower.includes('storm') || condition_lower.includes('tempest')) return '⛈️';
    if (condition_lower.includes('snow')) return '❄️';
    if (condition_lower.includes('wind')) return '💨';
    if (condition_lower.includes('fog')) return '🌫️';

    return '🌤️';
  }
}

export default WeatherIntegration;



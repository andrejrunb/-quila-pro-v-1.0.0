import Logger from './Logger';

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  icon: string;
}

interface AttendanceContext {
  date: string;
  weather: WeatherData;
  expectedAttendance: number;
  actualAttendance: number;
  variance: number;
  analysis: string;
}

export class OpenWeatherMapService {
  private logger: Logger;
  private apiKey: string;
  private baseUrl: string = 'https://api.openweathermap.org/data/2.5';
  private schoolLatitude: number = -23.5505; // São Paulo (default)
  private schoolLongitude: number = -46.6333;

  constructor(apiKey: string) {
    this.logger = new Logger('OpenWeatherMapService');
    this.apiKey = apiKey;
  }

  /**
   * Obter dados de clima atual
   */
  async getCurrentWeather(): Promise<WeatherData> {
    try {
      const url = `${this.baseUrl}/weather?lat=${this.schoolLatitude}&lon=${this.schoolLongitude}&appid=${this.apiKey}&units=metric&lang=pt_br`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        temperature: data.main.temp,
        condition: data.weather[0].main,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        precipitation: data.rain?.['1h'] || 0,
        icon: data.weather[0].icon,
      };
    } catch (error) {
      this.logger.error('Erro ao obter dados de clima', error);
      throw error;
    }
  }

  /**
   * Obter previsão de clima para 5 dias
   */
  async getForecast(): Promise<WeatherData[]> {
    try {
      const url = `${this.baseUrl}/forecast?lat=${this.schoolLatitude}&lon=${this.schoolLongitude}&appid=${this.apiKey}&units=metric&lang=pt_br`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      return data.list.map((item: any) => ({
        temperature: item.main.temp,
        condition: item.weather[0].main,
        humidity: item.main.humidity,
        windSpeed: item.wind.speed,
        precipitation: item.rain?.['3h'] || 0,
        icon: item.weather[0].icon,
      }));
    } catch (error) {
      this.logger.error('Erro ao obter previsão', error);
      throw error;
    }
  }

  /**
   * Analisar impacto do clima na presença
   */
  async analyzeWeatherImpactOnAttendance(
    expectedAttendance: number,
    actualAttendance: number
  ): Promise<AttendanceContext> {
    try {
      const weather = await this.getCurrentWeather();
      const variance = actualAttendance - expectedAttendance;
      const variancePercentage = (variance / expectedAttendance) * 100;

      let analysis = '';

      // Análise baseada em condições climáticas
      if (weather.condition.includes('Rain')) {
        analysis += 'Dia chuvoso - ';
        if (variancePercentage < -5) {
          analysis += 'Presença abaixo do esperado (possível impacto da chuva)';
        } else {
          analysis += 'Presença normal apesar da chuva';
        }
      } else if (weather.temperature > 35) {
        analysis += 'Dia muito quente - ';
        if (variancePercentage < -3) {
          analysis += 'Presença reduzida (possível impacto do calor)';
        } else {
          analysis += 'Presença normal apesar do calor';
        }
      } else if (weather.temperature < 10) {
        analysis += 'Dia muito frio - ';
        if (variancePercentage < -3) {
          analysis += 'Presença reduzida (possível impacto do frio)';
        } else {
          analysis += 'Presença normal apesar do frio';
        }
      } else {
        analysis += 'Condições climáticas normais - ';
        if (variancePercentage > 0) {
          analysis += 'Presença acima do esperado';
        } else if (variancePercentage < 0) {
          analysis += 'Presença abaixo do esperado';
        } else {
          analysis += 'Presença conforme esperado';
        }
      }

      return {
        date: new Date().toISOString().split('T')[0],
        weather,
        expectedAttendance,
        actualAttendance,
        variance,
        analysis,
      };
    } catch (error) {
      this.logger.error('Erro ao analisar impacto do clima', error);
      throw error;
    }
  }

  /**
   * Obter alertas de clima severo
   */
  async getSevereWeatherAlerts(): Promise<string[]> {
    try {
      const weather = await this.getCurrentWeather();
      const alerts: string[] = [];

      if (weather.condition.includes('Thunderstorm')) {
        alerts.push('⚠️ Tempestade em andamento - Recomenda-se evitar atividades ao ar livre');
      }

      if (weather.temperature > 38) {
        alerts.push('🌡️ Calor extremo - Recomenda-se aumentar hidratação');
      }

      if (weather.windSpeed > 40) {
        alerts.push('💨 Ventos fortes - Recomenda-se cuidado em áreas abertas');
      }

      if (weather.precipitation > 50) {
        alerts.push('🌧️ Chuva intensa - Recomenda-se cuidado nas áreas de circulação');
      }

      return alerts;
    } catch (error) {
      this.logger.error('Erro ao obter alertas de clima', error);
      return [];
    }
  }

  /**
   * Definir localização da escola
   */
  setSchoolLocation(latitude: number, longitude: number): void {
    this.schoolLatitude = latitude;
    this.schoolLongitude = longitude;
    this.logger.info(`Localização da escola atualizada: ${latitude}, ${longitude}`);
  }
}

export default OpenWeatherMapService;


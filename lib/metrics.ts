export interface APIMetrics {
  endpoint: string;
  timestamp: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  duration: number; // milliseconds
  inputSize: number; // bytes
  outputSize: number; // bytes
  model?: string;
  error?: string;
}

class MetricsCollector {
  private metrics: APIMetrics[] = [];
  private maxMetrics = 1000; // Храним последние 1000 запросов

  log(metrics: APIMetrics) {
    this.metrics.push(metrics);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Логируем в консоль для разработки
    console.log(`[Metrics] ${metrics.endpoint}:`, {
      tokens: metrics.totalTokens || 'N/A',
      duration: `${metrics.duration}ms`,
      inputSize: `${(metrics.inputSize / 1024).toFixed(2)}KB`,
      outputSize: `${(metrics.outputSize / 1024).toFixed(2)}KB`,
      model: metrics.model || 'N/A',
    });
  }

  getStats(endpoint?: string) {
    const filtered = endpoint
      ? this.metrics.filter((m) => m.endpoint === endpoint)
      : this.metrics;

    if (filtered.length === 0) {
      return null;
    }

    const totalTokens = filtered.reduce((sum, m) => sum + (m.totalTokens || 0), 0);
    const avgDuration = filtered.reduce((sum, m) => sum + m.duration, 0) / filtered.length;
    const avgInputSize = filtered.reduce((sum, m) => sum + m.inputSize, 0) / filtered.length;
    const avgOutputSize = filtered.reduce((sum, m) => sum + m.outputSize, 0) / filtered.length;

    return {
      count: filtered.length,
      totalTokens,
      avgTokens: totalTokens / filtered.length,
      avgDuration,
      avgInputSize,
      avgOutputSize,
    };
  }

  getAllMetrics() {
    return [...this.metrics];
  }

  clear() {
    this.metrics = [];
  }
}

export const metricsCollector = new MetricsCollector();


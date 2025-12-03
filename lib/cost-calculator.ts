// Цены для GPT-5.1 из скриншота
const PRICING = {
  input: 1.250 / 1_000_000,      // $1.250 per 1M tokens
  cachedInput: 0.125 / 1_000_000, // $0.125 per 1M tokens
  output: 10.000 / 1_000_000,     // $10.000 per 1M tokens
};

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface CostBreakdown {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  tokenUsage: TokenUsage;
}

export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  useCache: boolean = false
): CostBreakdown {
  const inputCost = inputTokens * (useCache ? PRICING.cachedInput : PRICING.input);
  const outputCost = outputTokens * PRICING.output;
  const totalCost = inputCost + outputCost;

  return {
    inputCost,
    outputCost,
    totalCost,
    tokenUsage: {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
    },
  };
}

export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${(cost * 1000).toFixed(3)}`;
  }
  return `$${cost.toFixed(4)}`;
}


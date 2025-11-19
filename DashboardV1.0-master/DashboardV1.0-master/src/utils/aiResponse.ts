import { BusinessType } from '../types';

export const getAIResponse = (message: string, type: BusinessType) => {
  const responses = {
    sales: [
      "Based on your sales data patterns, I recommend focusing on Q4 performance optimization.",
      "The pattern analysis shows your highest conversion rates occur on Tuesdays and Wednesdays.",
      "Consider implementing lead scoring based on the identified behavioral patterns.",
      "Your sales cycle data suggests opportunities for faster deal closure in the enterprise segment."
    ],
    marketing: [
      "Your competitor analysis shows they're gaining market share through social media campaigns.",
      "I recommend adjusting your marketing budget allocation based on competitor spending patterns.",
      "The market trends indicate your competitors are investing heavily in video content.",
      "Consider launching a competitive response campaign targeting their weak points."
    ],
    both: [
      "Integrating your sales and marketing data reveals alignment opportunities.",
      "Your marketing qualified leads convert better when sales follows up within 2 hours.",
      "Both sales and marketing data show seasonal patterns that can inform strategy.",
      "Consider a unified approach to customer acquisition based on the pattern analysis."
    ]
  };
  
  const typeResponses = responses[type || 'sales'];
  return typeResponses[Math.floor(Math.random() * typeResponses.length)];
}; 
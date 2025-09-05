interface ParsedReportData {
  sales?: number;
  inventory?: Array<{ item: string; count: number; action: string }>;
  notes?: string;
  alerts?: string[];
  customer_feedback?: string;
  staff_observations?: string;
}

interface AIResponse {
  success: boolean;
  data?: ParsedReportData;
  confidence?: number;
  error?: string;
}

interface BusinessInsights {
  keyFindings: string[];
  recommendations: Array<{ type: string; title: string; description: string; impact: string }>;
  anomalies: Array<{ type: string; description: string; severity: 'low' | 'medium' | 'high' }>;
  opportunities: Array<{ title: string; description: string; potentialValue: number }>;
}

interface AIInsightsResponse {
  success: boolean;
  insights?: BusinessInsights;
  error?: string;
}

interface GeneratedLocationData {
  name?: string;
  address?: string;
  manager?: string;
  status?: 'active' | 'inactive' | 'attention';
}

interface LocationGenerationResponse {
  success: boolean;
  data?: GeneratedLocationData;
  confidence?: number;
  error?: string;
}

interface GeneratedProductData {
  name?: string;
  sku?: string;
  category?: string;
  price?: number;
  stock?: number;
  min_stock?: number;
}

interface ProductGenerationResponse {
  success: boolean;
  data?: GeneratedProductData;
  confidence?: number;
  error?: string;
}

interface GeneratedSaleData {
  timestamp?: string;
  total?: number;
  items?: number;
  staff?: string;
  payment_method?: string;
}

interface SaleGenerationResponse {
  success: boolean;
  data?: GeneratedSaleData;
  confidence?: number;
  error?: string;
}

interface GeneratedAlertData {
  type?: 'low_stock' | 'high_return' | 'unusual_activity' | 'sales_spike' | 'system';
  severity?: 'low' | 'medium' | 'high';
  message?: string;
  timestamp?: string;
}

interface AlertGenerationResponse {
  success: boolean;
  data?: GeneratedAlertData;
  confidence?: number;
  error?: string;
}

class AIService {
  private readonly geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
  private readonly apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  async parseRetailReport(rawText: string, confidenceThreshold: number = 85): Promise<AIResponse> {
    if (!this.apiKey) {
      console.warn('Gemini API key not found, using fallback parsing');
      return this.fallbackParsing(rawText, confidenceThreshold);
    }

    try {
      // Create a structured prompt for better parsing
      const prompt = this.createParsingPrompt(rawText);
      
      // Try the Gemini API
      const response = await this.callGeminiAPI(prompt);
      
      if (response.success && response.data && response.confidence! >= (confidenceThreshold / 100)) {
        return response;
      } else {
        // Fallback to rule-based parsing
        return this.fallbackParsing(rawText, confidenceThreshold);
      }
    } catch (error) {
      console.error('AI parsing failed:', error);
      return this.fallbackParsing(rawText, confidenceThreshold);
    }
  }

  async generateLocationDetails(description: string): Promise<LocationGenerationResponse> {
    if (!this.apiKey) {
      console.warn('Gemini API key not found, using fallback location parsing');
      return this.fallbackLocationParsing(description);
    }

    try {
      const prompt = this.createLocationPrompt(description);
      const rawResponse = await this.callGeminiRaw(prompt);
      
      if (rawResponse.success && rawResponse.text) {
        const locationData = this.extractLocationDataFromAIResponse(rawResponse.text);
        return {
          success: true,
          data: locationData,
          confidence: 0.85 // AI-based parsing confidence
        };
      } else {
        return this.fallbackLocationParsing(description);
      }
    } catch (error) {
      console.error('AI location generation failed:', error);
      return this.fallbackLocationParsing(description);
    }
  }

  async generateProductDetails(description: string): Promise<ProductGenerationResponse> {
    if (!this.apiKey) {
      console.warn('Gemini API key not found, using fallback product parsing');
      return this.fallbackProductParsing(description);
    }

    try {
      const prompt = this.createProductPrompt(description);
      const rawResponse = await this.callGeminiRaw(prompt);
      
      if (rawResponse.success && rawResponse.text) {
        const productData = this.extractProductDataFromAIResponse(rawResponse.text);
        return {
          success: true,
          data: productData,
          confidence: 0.85
        };
      } else {
        return this.fallbackProductParsing(description);
      }
    } catch (error) {
      console.error('AI product generation failed:', error);
      return this.fallbackProductParsing(description);
    }
  }

  async generateSaleDetails(description: string, locationId?: string): Promise<SaleGenerationResponse> {
    if (!this.apiKey) {
      console.warn('Gemini API key not found, using fallback sale parsing');
      return this.fallbackSaleParsing(description);
    }

    try {
      const prompt = this.createSalePrompt(description, locationId);
      const rawResponse = await this.callGeminiRaw(prompt);
      
      if (rawResponse.success && rawResponse.text) {
        const saleData = this.extractSaleDataFromAIResponse(rawResponse.text);
        return {
          success: true,
          data: saleData,
          confidence: 0.85
        };
      } else {
        return this.fallbackSaleParsing(description);
      }
    } catch (error) {
      console.error('AI sale generation failed:', error);
      return this.fallbackSaleParsing(description);
    }
  }

  async generateAlertDetails(description: string, locationId?: string): Promise<AlertGenerationResponse> {
    if (!this.apiKey) {
      console.warn('Gemini API key not found, using fallback alert parsing');
      return this.fallbackAlertParsing(description);
    }

    try {
      const prompt = this.createAlertPrompt(description, locationId);
      const rawResponse = await this.callGeminiRaw(prompt);
      
      if (rawResponse.success && rawResponse.text) {
        const alertData = this.extractAlertDataFromAIResponse(rawResponse.text);
        return {
          success: true,
          data: alertData,
          confidence: 0.85
        };
      } else {
        return this.fallbackAlertParsing(description);
      }
    } catch (error) {
      console.error('AI alert generation failed:', error);
      return this.fallbackAlertParsing(description);
    }
  }

  async generateBusinessInsights(analyticsSummary: string): Promise<AIInsightsResponse> {
    if (!this.apiKey) {
      // Use rule-based insights generation as fallback
      const insights = this.generateRuleBasedInsights();
      return { success: true, insights };
    }

    try {
      const prompt = this.createInsightsPrompt(analyticsSummary);
      const response = await this.callGeminiRaw(prompt);

      if (response.success && response.text) {
        const insights = this.extractInsightsFromAIResponse(response.text);
        return { success: true, insights };
      } else {
        // Fallback to rule-based insights
        const insights = this.generateRuleBasedInsights();
        return { success: true, insights };
      }
    } catch (error) {
      console.error('Error generating business insights:', error);
      // Fallback to rule-based insights
      const insights = this.generateRuleBasedInsights();
      return { success: true, insights };
    }
  }

  // Prompt creation methods
  private createProductPrompt(description: string): string {
    return `Parse this product description and extract structured data for a retail product.

Description: "${description}"

Please respond with a JSON object containing:
- name: product name
- sku: stock keeping unit (generate if not provided)
- category: product category (Electronics, Beauty, Food & Beverage, Accessories, Clothing, Home & Garden, Sports, Books, Other)
- price: retail price (number)
- stock: current stock quantity (number)
- min_stock: minimum stock threshold (number)

Generate reasonable values if some fields are missing. Use market knowledge for pricing.

Response:`;
  }

  private createSalePrompt(description: string, locationId?: string): string {
    return `Parse this sale description and extract structured data for a retail transaction.

Description: "${description}"
${locationId ? `Location ID: ${locationId}` : ''}

Please respond with a JSON object containing:
- timestamp: ISO timestamp (default to now if not specified)
- total: sale total amount (number)
- items: number of items sold (number, default 1)
- staff: staff member name (string)
- payment_method: Cash, Credit Card, Debit Card, Digital Wallet, Bank Transfer, or Gift Card

Generate reasonable values if some fields are missing.

Response:`;
  }

  private createAlertPrompt(description: string, locationId?: string): string {
    return `Parse this alert description and extract structured data for a retail alert.

Description: "${description}"
${locationId ? `Location ID: ${locationId}` : ''}

Please respond with a JSON object containing:
- type: low_stock, high_return, unusual_activity, sales_spike, or system
- severity: low, medium, or high
- message: alert message describing the issue
- timestamp: ISO timestamp (default to now)

Determine appropriate values based on the description context.

Response:`;
  }

  private createInsightsPrompt(analyticsSummary: string): string {
    return `Analyze this business analytics summary and provide insights in JSON format.

Analytics Summary: "${analyticsSummary}"

Please respond with a JSON object containing:
- keyFindings: array of key observations (strings)
- recommendations: array of objects with {type, title, description, impact}
- anomalies: array of objects with {type, description, severity}
- opportunities: array of objects with {title, description, potentialValue}

Focus on actionable insights for a retail business. Be specific and practical.

Response:`;
  }

  private createLocationPrompt(description: string): string {
    return `Parse this location description and extract structured data for a retail store location.

Description: "${description}"

Please respond with a JSON object containing:
- name: store/location name
- address: full address
- manager: manager name if mentioned
- status: "active", "inactive", or "attention" based on context

Only include fields if they can be reasonably extracted from the description.

Response:`;
  }

  private createParsingPrompt(rawText: string): string {
    return `Parse this retail report into structured data. Extract sales amounts, inventory changes, notes, and any alerts.

Report: "${rawText}"

Please respond with a JSON object containing:
- sales: total sales amount (number)
- inventory: array of {item, count, action} objects
- notes: important observations
- alerts: array of alert messages
- customer_feedback: any customer comments
- staff_observations: staff notes

Response:`;
  }

  // Extraction methods
  private extractProductDataFromAIResponse(aiText: string): GeneratedProductData {
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return this.validateProductData(parsed);
      }
    } catch { // Removed unused 'e'
      // JSON parsing failed, continue with rule-based
    }

    return this.extractProductWithRules(aiText);
  }

  private extractSaleDataFromAIResponse(aiText: string): GeneratedSaleData {
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return this.validateSaleData(parsed);
      }
    } catch { // Removed unused 'e'
      // JSON parsing failed, continue with rule-based
    }

    return this.extractSaleWithRules(aiText);
  }

  private extractAlertDataFromAIResponse(aiText: string): GeneratedAlertData {
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return this.validateAlertData(parsed);
      }
    } catch { // Removed unused 'e'
      // JSON parsing failed, continue with rule-based
    }

    return this.extractAlertWithRules(aiText);
  }

  private extractLocationDataFromAIResponse(aiText: string): GeneratedLocationData {
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return this.validateLocationData(parsed);
      }
    } catch { // Removed unused 'e'
      // JSON parsing failed, continue with rule-based
    }

    return this.extractLocationWithRules();
  }

  private extractInsightsFromAIResponse(aiText: string): BusinessInsights {
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return this.validateInsightsData(parsed);
      }
    } catch { // Removed unused 'e', warning is sufficient
      console.warn('Failed to parse AI insights response, using fallback');
    }

    // Fallback to rule-based insights if AI parsing fails
    return this.generateRuleBasedInsights(aiText);
  }

  // Validation methods
  private validateProductData(data: Record<string, unknown>): GeneratedProductData {
    const result: GeneratedProductData = {};
    
    if (typeof data.name === 'string' && data.name.trim()) {
      result.name = data.name.trim();
    }
    
    if (typeof data.sku === 'string' && data.sku.trim()) {
      result.sku = data.sku.trim();
    }
    
    if (typeof data.category === 'string' && data.category.trim()) {
      result.category = data.category.trim();
    }
    
    if (typeof data.price === 'number' && data.price > 0) {
      result.price = data.price;
    }
    
    if (typeof data.stock === 'number' && data.stock >= 0) {
      result.stock = data.stock;
    }
    
    if (typeof data.min_stock === 'number' && data.min_stock >= 0) {
      result.min_stock = data.min_stock;
    }

    return result;
  }

  private validateSaleData(data: Record<string, unknown>): GeneratedSaleData {
    const result: GeneratedSaleData = {};
    
    if (typeof data.timestamp === 'string') {
      result.timestamp = data.timestamp;
    }
    
    if (typeof data.total === 'number' && data.total > 0) {
      result.total = data.total;
    }
    
    if (typeof data.items === 'number' && data.items > 0) {
      result.items = data.items;
    }
    
    if (typeof data.staff === 'string' && data.staff.trim()) {
      result.staff = data.staff.trim();
    }
    
    if (typeof data.payment_method === 'string' && data.payment_method.trim()) {
      result.payment_method = data.payment_method.trim();
    }

    return result;
  }

  private validateAlertData(data: Record<string, unknown>): GeneratedAlertData {
    const result: GeneratedAlertData = {};
    
    if (typeof data.type === 'string' && ['low_stock', 'high_return', 'unusual_activity', 'sales_spike', 'system'].includes(data.type)) {
      result.type = data.type;
    }
    
    if (['low', 'medium', 'high'].includes(data.severity)) {
      result.severity = data.severity;
    }
    
    if (typeof data.message === 'string' && data.message.trim()) {
      result.message = data.message.trim();
    }
    
    if (typeof data.timestamp === 'string') {
      result.timestamp = data.timestamp;
    }

    return result;
  }

  private validateLocationData(data: Record<string, unknown>): GeneratedLocationData {
    const result: GeneratedLocationData = {};
    
    if (typeof data.name === 'string' && data.name.trim()) {
      result.name = data.name.trim();
    }
    
    if (typeof data.address === 'string' && data.address.trim()) {
      result.address = data.address.trim();
    }
    
    if (typeof data.manager === 'string' && data.manager.trim()) {
      result.manager = data.manager.trim();
    }
    
    if (['active', 'inactive', 'attention'].includes(data.status)) {
      result.status = data.status;
    }

    return result;
  }

  private validateInsightsData(data: Record<string, unknown>): BusinessInsights {
    const result: BusinessInsights = {
      keyFindings: [],
      recommendations: [],
      anomalies: [],
      opportunities: []
    };

    if (Array.isArray(data.keyFindings)) {
      result.keyFindings = data.keyFindings.filter((f: unknown): f is string => typeof f === 'string');
    }

    if (Array.isArray(data.recommendations)) {
      result.recommendations = data.recommendations.filter((r: unknown): r is BusinessInsights['recommendations'][0] => {
        const rec = r as Record<string, unknown>;
        return rec && typeof rec.type === 'string' && typeof rec.title === 'string' &&
               typeof rec.description === 'string' && typeof rec.impact === 'string';
      });
    }

    if (Array.isArray(data.anomalies)) {
      result.anomalies = data.anomalies.filter((a: unknown): a is BusinessInsights['anomalies'][0] => {
        const anomaly = a as Record<string, unknown>;
        return anomaly && typeof anomaly.type === 'string' && typeof anomaly.description === 'string' &&
               typeof anomaly.severity === 'string' && ['low', 'medium', 'high'].includes(anomaly.severity);
      });
    }

    if (Array.isArray(data.opportunities)) {
      result.opportunities = data.opportunities.filter((o: unknown): o is BusinessInsights['opportunities'][0] => {
        const opp = o as Record<string, unknown>;
        return opp && typeof opp.title === 'string' && typeof opp.description === 'string' &&
               typeof opp.potentialValue === 'number';
      });
    }

    return result;
  }

  // Fallback methods
  private fallbackProductParsing(description: string): ProductGenerationResponse {
    const productData = this.extractProductWithRules(description);
    
    return {
      success: true,
      data: productData,
      confidence: 0.65
    };
  }

  private fallbackSaleParsing(description: string): SaleGenerationResponse {
    const saleData = this.extractSaleWithRules(description);
    
    return {
      success: true,
      data: saleData,
      confidence: 0.65
    };
  }

  private fallbackAlertParsing(description: string): AlertGenerationResponse {
    const alertData = this.extractAlertWithRules(description);
    
    return {
      success: true,
      data: alertData,
      confidence: 0.65
    };
  }

  private fallbackLocationParsing(description: string): LocationGenerationResponse {
    const locationData = this.extractLocationWithRules();
    
    return {
      success: true,
      data: locationData,
      confidence: 0.65
    };
  }

  private fallbackParsing(rawText: string, confidenceThreshold: number): AIResponse {
    const parsedData = this.extractDataWithRules(rawText);
    const confidence = 0.65; // Rule-based parsing confidence
    
    return {
      success: confidence >= (confidenceThreshold / 100),
      data: parsedData,
      confidence: confidence
    };
  }

  // Rule-based extraction methods (simplified for safety)
  private extractProductWithRules(text: string): GeneratedProductData {
    const result: GeneratedProductData = {};

    // Extract basic patterns
    const priceMatch = text.match(/\$(\d+(?:\.\d{2})?)/);
    if (priceMatch) result.price = parseFloat(priceMatch[1]);

    const stockMatch = text.match(/(\d+)\s*units?/i);
    if (stockMatch) result.stock = parseInt(stockMatch[1]);

    // Set defaults
    if (!result.price) result.price = 29.99;
    if (!result.stock) result.stock = 10;
    if (!result.min_stock) result.min_stock = Math.floor((result.stock || 10) * 0.2);
    if (!result.category) result.category = 'Other';
    if (!result.name) result.name = 'Product';
    if (!result.sku) result.sku = 'SKU-' + Math.floor(Math.random() * 1000);

    return result;
  }

  private extractSaleWithRules(text: string): GeneratedSaleData {
    const result: GeneratedSaleData = {};

    const priceMatch = text.match(/\$(\d+(?:\.\d{2})?)/);
    if (priceMatch) result.total = parseFloat(priceMatch[1]);

    // Set defaults
    if (!result.total) result.total = 25.99;
    if (!result.items) result.items = 1;
    if (!result.staff) result.staff = 'Store Staff';
    if (!result.payment_method) result.payment_method = 'Cash';
    if (!result.timestamp) result.timestamp = new Date().toISOString();

    return result;
  }

  private extractAlertWithRules(text: string): GeneratedAlertData {
    const result: GeneratedAlertData = {};

    // Simple pattern matching
    if (text.toLowerCase().includes('stock')) {
      result.type = 'low_stock';
      result.severity = 'medium';
    } else {
      result.type = 'system';
      result.severity = 'low';
    }

    result.message = text.trim() || 'System alert generated';
    result.timestamp = new Date().toISOString();

    return result;
  }

  private extractLocationWithRules(): GeneratedLocationData {
    const result: GeneratedLocationData = {};

    // Extract basic info
    result.name = 'New Location';
    result.status = 'active';

    return result;
  }

  private extractDataFromAIResponse(aiText: string): ParsedReportData {
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch { // Removed unused 'e'
      // JSON parsing failed, continue with rule-based
    }

    return this.extractDataWithRules();
  }

  private extractDataWithRules(): ParsedReportData {
    const result: ParsedReportData = {
      inventory: [],
      alerts: [],
      notes: ''
    };

    // Extract sales amounts
    const salesMatches = text.match(/\$?(\d+(?:\.\d{2})?)/g);
    if (salesMatches) {
      const amounts = salesMatches.map(m => parseFloat(m.replace('$', '')));
      result.sales = amounts.reduce((sum, amount) => sum + amount, 0);
    }

    return result;
  }

  // Gemini API methods
  private async callGeminiRaw(prompt: string): Promise<{ success: boolean; text?: string; error?: string }> {
    try {
      const response = await fetch(`${this.geminiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 500,
            topP: 0.8,
            topK: 10
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API failed with status ${response.status}`);
      }

      const result = await response.json();
      
      if (result.candidates && result.candidates[0] && result.candidates[0].content) {
        const aiText = result.candidates[0].content.parts[0].text;
        return {
          success: true,
          text: aiText
        };
      } else {
        throw new Error('Invalid response format from Gemini API');
      }
    } catch (error) {
      console.error('Gemini API call failed:', error);
      return { success: false, error: 'AI service unavailable' };
    }
  }

  private async callGeminiAPI(prompt: string): Promise<AIResponse> {
    try {
      const rawResponse = await this.callGeminiRaw(prompt);
      
      if (rawResponse.success && rawResponse.text) {
        const parsedData = this.extractDataFromAIResponse(rawResponse.text);
        
        return {
          success: true,
          data: parsedData,
          confidence: 0.85
        };
      } else {
        throw new Error(rawResponse.error || 'Invalid response format from Gemini API');
      }
    } catch (error) {
      console.error('Gemini API call failed:', error);
      return { success: false, error: 'AI service unavailable' };
    }
  }

  // Rule-based insights generation
  private generateRuleBasedInsights(): BusinessInsights { // Removed unused _summary parameter
    const keyFindings: string[] = [];
    const recommendations: BusinessInsights['recommendations'] = [];
    const anomalies: BusinessInsights['anomalies'] = [];
    const opportunities: BusinessInsights['opportunities'] = [];

    // Basic analysis
    keyFindings.push("Business analytics data has been processed");
    
    recommendations.push({
      type: 'general',
      title: 'Continue Monitoring',
      description: 'Keep tracking key metrics for improved insights',
      impact: 'Medium - Better decision making'
    });

    return {
      keyFindings,
      recommendations,
      anomalies,
      opportunities
    };
  }

  // Connection test
  async testConnection(): Promise<boolean> {
    if (!this.apiKey) return false;
    
    try {
      const response = await this.callGeminiRaw('Test connection');
      return response.success;
    } catch (error) {
      console.warn('Gemini API test failed:', error);
      return false;
    }
  }
}

export const aiService = new AIService();
export type { 
  ParsedReportData, 
  AIResponse, 
  BusinessInsights, 
  AIInsightsResponse, 
  GeneratedLocationData, 
  LocationGenerationResponse,
  GeneratedProductData,
  ProductGenerationResponse,
  GeneratedSaleData,
  SaleGenerationResponse,
  GeneratedAlertData,
  AlertGenerationResponse
};
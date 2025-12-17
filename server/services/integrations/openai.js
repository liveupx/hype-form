// ===========================================
// OpenAI Integration Service
// ===========================================
// AI-powered form generation, smart suggestions, and more

const axios = require('axios');

class OpenAIService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.openai.com/v1';
    this.model = 'gpt-4o-mini'; // Cost-effective for most tasks
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  // Test connection
  async testConnection() {
    try {
      const response = await axios.get(`${this.baseUrl}/models`, {
        headers: this.getHeaders()
      });
      return { success: true, models: response.data.data.length };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  // Generic chat completion
  async chat(messages, options = {}) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: options.model || this.model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens || 2000
        },
        { headers: this.getHeaders() }
      );

      return {
        content: response.data.choices[0].message.content,
        usage: response.data.usage
      };
    } catch (error) {
      throw new Error(`OpenAI error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // ===========================================
  // FORM GENERATION
  // ===========================================

  // Generate form from description
  async generateForm(description, options = {}) {
    const systemPrompt = `You are a form builder AI. Generate a JSON form structure based on the user's description.
    
Return ONLY valid JSON with this structure:
{
  "title": "Form Title",
  "description": "Form description",
  "fields": [
    {
      "type": "SHORT_TEXT|LONG_TEXT|EMAIL|PHONE|NUMBER|DATE|SELECT|MULTI_SELECT|RADIO|CHECKBOX|FILE_UPLOAD|RATING|NPS|SCALE|YES_NO|ADDRESS",
      "label": "Question text",
      "description": "Optional helper text",
      "required": true/false,
      "options": ["Option 1", "Option 2"] // Only for SELECT, MULTI_SELECT, RADIO, CHECKBOX
    }
  ]
}

Field type guidelines:
- SHORT_TEXT: Single line text (names, titles)
- LONG_TEXT: Multi-line text (messages, descriptions)
- EMAIL: Email addresses
- PHONE: Phone numbers
- NUMBER: Numeric values
- DATE: Date picker
- SELECT: Dropdown single choice
- MULTI_SELECT: Multiple choices allowed
- RADIO: Single choice displayed as buttons
- CHECKBOX: Yes/no checkbox
- FILE_UPLOAD: File attachment
- RATING: 1-5 stars
- NPS: Net Promoter Score (0-10)
- SCALE: Custom scale
- YES_NO: Yes/No buttons
- ADDRESS: Full address

Create a logical flow with appropriate field types. Include 5-15 fields typically.`;

    const userPrompt = `Create a form for: ${description}${options.context ? `\n\nAdditional context: ${options.context}` : ''}`;

    const response = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { temperature: 0.7 });

    // Parse JSON from response
    let formData;
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = response.content;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      formData = JSON.parse(jsonStr.trim());
    } catch (e) {
      throw new Error('Failed to parse AI response as JSON');
    }

    // Add order to fields
    formData.fields = formData.fields.map((field, index) => ({
      ...field,
      order: index
    }));

    return formData;
  }

  // Generate form fields suggestions
  async suggestFields(formTitle, existingFields = []) {
    const systemPrompt = `You are a form builder AI. Suggest additional fields for a form.
    
Return ONLY a JSON array of field suggestions:
[
  {
    "type": "FIELD_TYPE",
    "label": "Question text",
    "required": true/false,
    "reason": "Why this field would be useful"
  }
]

Suggest 3-5 relevant fields that aren't already in the form.`;

    const existingLabels = existingFields.map(f => f.label).join(', ');
    const userPrompt = `Form title: "${formTitle}"
Existing fields: ${existingLabels || 'None'}

Suggest additional useful fields.`;

    const response = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { temperature: 0.8 });

    let suggestions;
    try {
      let jsonStr = response.content;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1];
      suggestions = JSON.parse(jsonStr.trim());
    } catch (e) {
      suggestions = [];
    }

    return suggestions;
  }

  // ===========================================
  // SMART RESPONSES
  // ===========================================

  // Analyze submission sentiment
  async analyzeSentiment(text) {
    const response = await this.chat([
      {
        role: 'system',
        content: 'Analyze the sentiment of the text. Return JSON: {"sentiment": "positive|negative|neutral", "score": 0-1, "summary": "brief summary"}'
      },
      { role: 'user', content: text }
    ], { temperature: 0.3 });

    try {
      return JSON.parse(response.content);
    } catch {
      return { sentiment: 'neutral', score: 0.5, summary: '' };
    }
  }

  // Generate summary of submissions
  async summarizeSubmissions(submissions, formTitle) {
    const systemPrompt = `Analyze form submissions and provide insights.
    
Return JSON:
{
  "summary": "Overall summary",
  "keyThemes": ["Theme 1", "Theme 2"],
  "sentiment": "Overall sentiment",
  "actionItems": ["Suggested action 1"],
  "stats": {
    "totalResponses": number,
    "commonAnswers": {}
  }
}`;

    const submissionData = submissions.slice(0, 50).map(s => ({
      answers: s.answers
    }));

    const response = await this.chat([
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Form: "${formTitle}"\n\nSubmissions:\n${JSON.stringify(submissionData, null, 2)}`
      }
    ], { temperature: 0.5, maxTokens: 1500 });

    try {
      let jsonStr = response.content;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1];
      return JSON.parse(jsonStr.trim());
    } catch {
      return { summary: response.content };
    }
  }

  // ===========================================
  // CONTENT GENERATION
  // ===========================================

  // Generate thank you message
  async generateThankYouMessage(formTitle, context = '') {
    const response = await this.chat([
      {
        role: 'system',
        content: 'Generate a friendly, professional thank you message for a form submission. Keep it brief (2-3 sentences).'
      },
      {
        role: 'user',
        content: `Form: "${formTitle}"${context ? `\nContext: ${context}` : ''}`
      }
    ], { temperature: 0.8, maxTokens: 200 });

    return response.content;
  }

  // Generate email template
  async generateEmailTemplate(type, context) {
    const templates = {
      submission_notification: 'Create an email to notify the form owner about a new submission',
      confirmation: 'Create a confirmation email to send to form respondents',
      follow_up: 'Create a follow-up email to send to form respondents after some time'
    };

    const response = await this.chat([
      {
        role: 'system',
        content: `${templates[type] || 'Create an email template'}. Return JSON: {"subject": "...", "body": "..."}`
      },
      { role: 'user', content: JSON.stringify(context) }
    ], { temperature: 0.7 });

    try {
      return JSON.parse(response.content);
    } catch {
      return { subject: '', body: response.content };
    }
  }

  // ===========================================
  // SPAM DETECTION
  // ===========================================

  // Check if submission is spam
  async detectSpam(submission) {
    const response = await this.chat([
      {
        role: 'system',
        content: `Analyze if this form submission is spam. Return JSON: {"isSpam": true/false, "confidence": 0-1, "reasons": ["reason1"]}`
      },
      { role: 'user', content: JSON.stringify(submission) }
    ], { temperature: 0.2 });

    try {
      return JSON.parse(response.content);
    } catch {
      return { isSpam: false, confidence: 0, reasons: [] };
    }
  }

  // ===========================================
  // FIELD VALIDATION
  // ===========================================

  // Generate validation rules
  async generateValidation(fieldType, fieldLabel) {
    const response = await this.chat([
      {
        role: 'system',
        content: `Suggest validation rules for a form field. Return JSON: {"regex": "...", "minLength": number, "maxLength": number, "customMessage": "..."}`
      },
      {
        role: 'user',
        content: `Field type: ${fieldType}\nLabel: ${fieldLabel}`
      }
    ], { temperature: 0.3 });

    try {
      return JSON.parse(response.content);
    } catch {
      return {};
    }
  }

  // ===========================================
  // TRANSLATION
  // ===========================================

  // Translate form content
  async translateForm(formData, targetLanguage) {
    const response = await this.chat([
      {
        role: 'system',
        content: `Translate the form content to ${targetLanguage}. Keep the JSON structure, only translate text values (title, description, labels, options).`
      },
      { role: 'user', content: JSON.stringify(formData) }
    ], { temperature: 0.3, maxTokens: 3000 });

    try {
      let jsonStr = response.content;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1];
      return JSON.parse(jsonStr.trim());
    } catch {
      throw new Error('Translation failed');
    }
  }

  // ===========================================
  // FORM IMPROVEMENT
  // ===========================================

  // Suggest improvements for form
  async suggestImprovements(formData) {
    const response = await this.chat([
      {
        role: 'system',
        content: `Analyze this form and suggest improvements. Return JSON array: [{"field": "field label or general", "suggestion": "improvement idea", "priority": "high|medium|low"}]`
      },
      { role: 'user', content: JSON.stringify(formData) }
    ], { temperature: 0.7 });

    try {
      let jsonStr = response.content;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1];
      return JSON.parse(jsonStr.trim());
    } catch {
      return [];
    }
  }

  // Generate A/B test variations
  async generateABVariations(field) {
    const response = await this.chat([
      {
        role: 'system',
        content: `Generate 2 A/B test variations for this form field. Return JSON: {"variations": [{"label": "...", "description": "..."}, {"label": "...", "description": "..."}]}`
      },
      { role: 'user', content: JSON.stringify(field) }
    ], { temperature: 0.9 });

    try {
      return JSON.parse(response.content);
    } catch {
      return { variations: [] };
    }
  }
}

module.exports = OpenAIService;

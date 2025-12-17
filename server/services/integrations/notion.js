// ===========================================
// Notion Integration Service
// ===========================================
// Sync form submissions to Notion databases

const axios = require('axios');

class NotionService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.notion.com/v1';
    this.version = '2022-06-28';
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Notion-Version': this.version
    };
  }

  // Test connection
  async testConnection() {
    try {
      const response = await axios.get(`${this.baseUrl}/users/me`, {
        headers: this.getHeaders()
      });
      return { 
        success: true, 
        user: response.data.name || response.data.id 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  // Search for databases
  async searchDatabases(query = '') {
    try {
      const response = await axios.post(
        `${this.baseUrl}/search`,
        {
          query,
          filter: { property: 'object', value: 'database' },
          sort: { direction: 'descending', timestamp: 'last_edited_time' }
        },
        { headers: this.getHeaders() }
      );

      return response.data.results.map(db => ({
        id: db.id,
        title: db.title?.[0]?.plain_text || 'Untitled',
        url: db.url,
        properties: Object.keys(db.properties)
      }));
    } catch (error) {
      throw new Error(`Failed to search databases: ${error.message}`);
    }
  }

  // Get database schema
  async getDatabaseSchema(databaseId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/databases/${databaseId}`,
        { headers: this.getHeaders() }
      );

      const properties = {};
      for (const [name, prop] of Object.entries(response.data.properties)) {
        properties[name] = {
          id: prop.id,
          type: prop.type,
          name: name
        };
        
        // Include options for select/multi-select
        if (prop.type === 'select' && prop.select?.options) {
          properties[name].options = prop.select.options.map(o => o.name);
        }
        if (prop.type === 'multi_select' && prop.multi_select?.options) {
          properties[name].options = prop.multi_select.options.map(o => o.name);
        }
      }

      return {
        id: response.data.id,
        title: response.data.title?.[0]?.plain_text || 'Untitled',
        properties
      };
    } catch (error) {
      throw new Error(`Failed to get database schema: ${error.message}`);
    }
  }

  // Convert value to Notion property format
  formatPropertyValue(type, value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    switch (type) {
      case 'title':
        return { title: [{ text: { content: String(value) } }] };
      
      case 'rich_text':
        return { rich_text: [{ text: { content: String(value) } }] };
      
      case 'number':
        return { number: parseFloat(value) || 0 };
      
      case 'select':
        return { select: { name: String(value) } };
      
      case 'multi_select':
        const items = Array.isArray(value) ? value : [value];
        return { multi_select: items.map(v => ({ name: String(v) })) };
      
      case 'date':
        return { date: { start: new Date(value).toISOString().split('T')[0] } };
      
      case 'checkbox':
        return { checkbox: Boolean(value) };
      
      case 'email':
        return { email: String(value) };
      
      case 'phone_number':
        return { phone_number: String(value) };
      
      case 'url':
        return { url: String(value) };
      
      default:
        return { rich_text: [{ text: { content: String(value) } }] };
    }
  }

  // Create a page (row) in database
  async createPage(databaseId, properties) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/pages`,
        {
          parent: { database_id: databaseId },
          properties
        },
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        id: response.data.id,
        url: response.data.url
      };
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      throw new Error(`Failed to create page: ${errorMsg}`);
    }
  }

  // Process form submission
  async processSubmission(databaseId, formData, fieldMapping = {}) {
    // Get database schema
    const schema = await this.getDatabaseSchema(databaseId);
    const properties = {};

    for (const [fieldId, value] of Object.entries(formData)) {
      const notionProperty = fieldMapping[fieldId];
      
      if (notionProperty && schema.properties[notionProperty]) {
        const propType = schema.properties[notionProperty].type;
        const formattedValue = this.formatPropertyValue(propType, value);
        
        if (formattedValue) {
          properties[notionProperty] = formattedValue;
        }
      }
    }

    // Add timestamp if there's a date field called "Submitted" or similar
    const dateFields = ['Submitted', 'Date', 'Created', 'Timestamp'];
    for (const df of dateFields) {
      if (schema.properties[df] && schema.properties[df].type === 'date') {
        properties[df] = { date: { start: new Date().toISOString() } };
        break;
      }
    }

    return this.createPage(databaseId, properties);
  }

  // Create a new database
  async createDatabase(parentPageId, title, properties = []) {
    const dbProperties = {
      Name: { title: {} }
    };

    // Add default properties for form submissions
    const defaultProps = [
      { name: 'Email', type: 'email' },
      { name: 'Submitted', type: 'date' },
      { name: 'Status', type: 'select', options: ['New', 'Reviewed', 'Contacted'] }
    ];

    [...defaultProps, ...properties].forEach(prop => {
      if (prop.type === 'select') {
        dbProperties[prop.name] = {
          select: {
            options: (prop.options || []).map(o => ({ name: o }))
          }
        };
      } else if (prop.type === 'multi_select') {
        dbProperties[prop.name] = {
          multi_select: {
            options: (prop.options || []).map(o => ({ name: o }))
          }
        };
      } else {
        dbProperties[prop.name] = { [prop.type]: {} };
      }
    });

    try {
      const response = await axios.post(
        `${this.baseUrl}/databases`,
        {
          parent: { page_id: parentPageId },
          title: [{ text: { content: title } }],
          properties: dbProperties
        },
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        id: response.data.id,
        url: response.data.url
      };
    } catch (error) {
      throw new Error(`Failed to create database: ${error.message}`);
    }
  }

  // Query database entries
  async queryDatabase(databaseId, filter = {}, sorts = []) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/databases/${databaseId}/query`,
        { filter, sorts, page_size: 100 },
        { headers: this.getHeaders() }
      );

      return response.data.results.map(page => ({
        id: page.id,
        url: page.url,
        properties: page.properties,
        createdTime: page.created_time
      }));
    } catch (error) {
      throw new Error(`Failed to query database: ${error.message}`);
    }
  }
}

module.exports = NotionService;

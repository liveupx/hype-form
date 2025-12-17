// ===========================================
// Airtable Integration Service
// ===========================================
// Sync form submissions to Airtable bases

const axios = require('axios');

class AirtableService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.airtable.com/v0';
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
      const response = await axios.get(
        `https://api.airtable.com/v0/meta/whoami`,
        { headers: this.getHeaders() }
      );
      return {
        success: true,
        userId: response.data.id,
        email: response.data.email
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  // List all bases
  async listBases() {
    try {
      const response = await axios.get(
        `https://api.airtable.com/v0/meta/bases`,
        { headers: this.getHeaders() }
      );

      return response.data.bases.map(base => ({
        id: base.id,
        name: base.name,
        permissionLevel: base.permissionLevel
      }));
    } catch (error) {
      throw new Error(`Failed to list bases: ${error.message}`);
    }
  }

  // Get base schema (tables and fields)
  async getBaseSchema(baseId) {
    try {
      const response = await axios.get(
        `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
        { headers: this.getHeaders() }
      );

      return response.data.tables.map(table => ({
        id: table.id,
        name: table.name,
        primaryFieldId: table.primaryFieldId,
        fields: table.fields.map(field => ({
          id: field.id,
          name: field.name,
          type: field.type,
          options: field.options
        }))
      }));
    } catch (error) {
      throw new Error(`Failed to get base schema: ${error.message}`);
    }
  }

  // Get table fields
  async getTableFields(baseId, tableId) {
    const schema = await this.getBaseSchema(baseId);
    const table = schema.find(t => t.id === tableId || t.name === tableId);
    
    if (!table) {
      throw new Error('Table not found');
    }

    return table.fields;
  }

  // Convert value to Airtable field format
  formatFieldValue(fieldType, value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    switch (fieldType) {
      case 'singleLineText':
      case 'multilineText':
      case 'richText':
        return String(value);

      case 'email':
        return String(value).toLowerCase();

      case 'url':
        return String(value);

      case 'phoneNumber':
        return String(value);

      case 'number':
      case 'currency':
      case 'percent':
        return parseFloat(value) || 0;

      case 'checkbox':
        return Boolean(value);

      case 'singleSelect':
        return String(value);

      case 'multipleSelects':
        if (Array.isArray(value)) return value.map(String);
        return [String(value)];

      case 'date':
        return new Date(value).toISOString().split('T')[0];

      case 'dateTime':
        return new Date(value).toISOString();

      case 'rating':
        return Math.min(Math.max(parseInt(value) || 0, 0), 5);

      case 'multipleAttachments':
        if (Array.isArray(value)) {
          return value.map(url => ({ url }));
        }
        return [{ url: value }];

      default:
        return String(value);
    }
  }

  // Create a record
  async createRecord(baseId, tableIdOrName, fields) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${baseId}/${encodeURIComponent(tableIdOrName)}`,
        { fields },
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        id: response.data.id,
        fields: response.data.fields,
        createdTime: response.data.createdTime
      };
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.message;
      throw new Error(`Failed to create record: ${errorMsg}`);
    }
  }

  // Create multiple records (batch)
  async createRecords(baseId, tableIdOrName, records) {
    try {
      // Airtable allows max 10 records per request
      const batches = [];
      for (let i = 0; i < records.length; i += 10) {
        batches.push(records.slice(i, i + 10));
      }

      const results = [];
      for (const batch of batches) {
        const response = await axios.post(
          `${this.baseUrl}/${baseId}/${encodeURIComponent(tableIdOrName)}`,
          { records: batch.map(fields => ({ fields })) },
          { headers: this.getHeaders() }
        );
        results.push(...response.data.records);
      }

      return {
        success: true,
        records: results
      };
    } catch (error) {
      throw new Error(`Failed to create records: ${error.message}`);
    }
  }

  // Update a record
  async updateRecord(baseId, tableIdOrName, recordId, fields) {
    try {
      const response = await axios.patch(
        `${this.baseUrl}/${baseId}/${encodeURIComponent(tableIdOrName)}/${recordId}`,
        { fields },
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        id: response.data.id,
        fields: response.data.fields
      };
    } catch (error) {
      throw new Error(`Failed to update record: ${error.message}`);
    }
  }

  // List records
  async listRecords(baseId, tableIdOrName, options = {}) {
    try {
      const params = {};
      if (options.view) params.view = options.view;
      if (options.maxRecords) params.maxRecords = options.maxRecords;
      if (options.filterByFormula) params.filterByFormula = options.filterByFormula;
      if (options.sort) params.sort = options.sort;

      const response = await axios.get(
        `${this.baseUrl}/${baseId}/${encodeURIComponent(tableIdOrName)}`,
        { headers: this.getHeaders(), params }
      );

      return {
        records: response.data.records,
        offset: response.data.offset
      };
    } catch (error) {
      throw new Error(`Failed to list records: ${error.message}`);
    }
  }

  // Delete a record
  async deleteRecord(baseId, tableIdOrName, recordId) {
    try {
      await axios.delete(
        `${this.baseUrl}/${baseId}/${encodeURIComponent(tableIdOrName)}/${recordId}`,
        { headers: this.getHeaders() }
      );
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete record: ${error.message}`);
    }
  }

  // Process form submission
  async processSubmission(baseId, tableIdOrName, formData, fieldMapping = {}) {
    // Get table schema for type conversion
    let tableFields = [];
    try {
      tableFields = await this.getTableFields(baseId, tableIdOrName);
    } catch (e) {
      // If we can't get schema, just use string values
    }

    const fields = {};

    for (const [fieldId, value] of Object.entries(formData)) {
      const airtableField = fieldMapping[fieldId];
      
      if (airtableField) {
        // Find field type from schema
        const schemaField = tableFields.find(f => 
          f.name === airtableField || f.id === airtableField
        );
        
        const fieldType = schemaField?.type || 'singleLineText';
        const formattedValue = this.formatFieldValue(fieldType, value);
        
        if (formattedValue !== null) {
          fields[airtableField] = formattedValue;
        }
      }
    }

    // Add timestamp if there's a field for it
    const timestampFields = ['Created', 'Submitted', 'Date', 'Timestamp', 'Created At'];
    for (const tf of timestampFields) {
      if (tableFields.find(f => f.name === tf && !fields[tf])) {
        fields[tf] = new Date().toISOString();
        break;
      }
    }

    return this.createRecord(baseId, tableIdOrName, fields);
  }

  // Find record by field value
  async findRecord(baseId, tableIdOrName, fieldName, value) {
    try {
      const formula = `{${fieldName}} = "${value}"`;
      const result = await this.listRecords(baseId, tableIdOrName, {
        filterByFormula: formula,
        maxRecords: 1
      });

      return result.records[0] || null;
    } catch (error) {
      throw new Error(`Failed to find record: ${error.message}`);
    }
  }

  // Upsert record (create or update)
  async upsertRecord(baseId, tableIdOrName, fields, uniqueFieldName) {
    const uniqueValue = fields[uniqueFieldName];
    
    if (!uniqueValue) {
      return this.createRecord(baseId, tableIdOrName, fields);
    }

    const existing = await this.findRecord(baseId, tableIdOrName, uniqueFieldName, uniqueValue);
    
    if (existing) {
      return this.updateRecord(baseId, tableIdOrName, existing.id, fields);
    }
    
    return this.createRecord(baseId, tableIdOrName, fields);
  }
}

module.exports = AirtableService;

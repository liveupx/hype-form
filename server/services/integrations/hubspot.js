// ===========================================
// HubSpot Integration Service
// ===========================================
// Sync form submissions to HubSpot CRM

const axios = require('axios');

class HubSpotService {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseUrl = 'https://api.hubapi.com';
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  // Test connection
  async testConnection() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/account-info/v3/details`,
        { headers: this.getHeaders() }
      );
      return {
        success: true,
        portalId: response.data.portalId,
        accountType: response.data.accountType
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // ===========================================
  // CONTACTS
  // ===========================================

  // Create a contact
  async createContact(properties) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/crm/v3/objects/contacts`,
        { properties },
        { headers: this.getHeaders() }
      );
      return {
        success: true,
        id: response.data.id,
        properties: response.data.properties
      };
    } catch (error) {
      // Check if contact already exists
      if (error.response?.status === 409) {
        const existingId = error.response.data.message.match(/ID: (\d+)/)?.[1];
        if (existingId) {
          return this.updateContact(existingId, properties);
        }
      }
      throw new Error(`Failed to create contact: ${error.response?.data?.message || error.message}`);
    }
  }

  // Update a contact
  async updateContact(contactId, properties) {
    try {
      const response = await axios.patch(
        `${this.baseUrl}/crm/v3/objects/contacts/${contactId}`,
        { properties },
        { headers: this.getHeaders() }
      );
      return {
        success: true,
        id: response.data.id,
        properties: response.data.properties,
        updated: true
      };
    } catch (error) {
      throw new Error(`Failed to update contact: ${error.message}`);
    }
  }

  // Search for contact by email
  async findContactByEmail(email) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/crm/v3/objects/contacts/search`,
        {
          filterGroups: [{
            filters: [{
              propertyName: 'email',
              operator: 'EQ',
              value: email
            }]
          }]
        },
        { headers: this.getHeaders() }
      );

      if (response.data.results.length > 0) {
        return response.data.results[0];
      }
      return null;
    } catch (error) {
      throw new Error(`Failed to search contact: ${error.message}`);
    }
  }

  // Create or update contact
  async upsertContact(email, properties) {
    const existing = await this.findContactByEmail(email);
    
    if (existing) {
      return this.updateContact(existing.id, properties);
    }
    
    return this.createContact({ email, ...properties });
  }

  // ===========================================
  // DEALS
  // ===========================================

  // Create a deal
  async createDeal(properties, associations = {}) {
    try {
      const payload = { properties };

      // Add associations if provided
      if (associations.contactId) {
        payload.associations = [{
          to: { id: associations.contactId },
          types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }]
        }];
      }

      const response = await axios.post(
        `${this.baseUrl}/crm/v3/objects/deals`,
        payload,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        id: response.data.id,
        properties: response.data.properties
      };
    } catch (error) {
      throw new Error(`Failed to create deal: ${error.message}`);
    }
  }

  // Get deal stages
  async getDealPipelines() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/crm/v3/pipelines/deals`,
        { headers: this.getHeaders() }
      );

      return response.data.results.map(pipeline => ({
        id: pipeline.id,
        label: pipeline.label,
        stages: pipeline.stages.map(s => ({
          id: s.id,
          label: s.label
        }))
      }));
    } catch (error) {
      throw new Error(`Failed to get pipelines: ${error.message}`);
    }
  }

  // ===========================================
  // COMPANIES
  // ===========================================

  // Create a company
  async createCompany(properties) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/crm/v3/objects/companies`,
        { properties },
        { headers: this.getHeaders() }
      );
      return {
        success: true,
        id: response.data.id,
        properties: response.data.properties
      };
    } catch (error) {
      throw new Error(`Failed to create company: ${error.message}`);
    }
  }

  // ===========================================
  // FORMS & SUBMISSIONS
  // ===========================================

  // Submit to HubSpot form (alternative method)
  async submitForm(portalId, formGuid, fields) {
    try {
      const response = await axios.post(
        `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formGuid}`,
        {
          fields: Object.entries(fields).map(([name, value]) => ({
            name,
            value: String(value)
          }))
        }
      );
      return { success: true, data: response.data };
    } catch (error) {
      throw new Error(`Failed to submit form: ${error.message}`);
    }
  }

  // ===========================================
  // PROPERTIES
  // ===========================================

  // Get contact properties
  async getContactProperties() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/crm/v3/properties/contacts`,
        { headers: this.getHeaders() }
      );

      return response.data.results.map(prop => ({
        name: prop.name,
        label: prop.label,
        type: prop.type,
        fieldType: prop.fieldType,
        options: prop.options
      }));
    } catch (error) {
      throw new Error(`Failed to get properties: ${error.message}`);
    }
  }

  // ===========================================
  // PROCESS FORM SUBMISSION
  // ===========================================

  async processSubmission(formData, fieldMapping = {}, options = {}) {
    const contactProperties = {};
    const dealProperties = {};
    let email = null;

    // Map form fields to HubSpot properties
    for (const [fieldId, value] of Object.entries(formData)) {
      const mapping = fieldMapping[fieldId];

      if (!mapping) continue;

      // Handle email specially
      if (mapping === 'email' || fieldId.toLowerCase().includes('email')) {
        email = value;
        contactProperties.email = value;
      }
      // Contact properties
      else if (mapping.startsWith('contact.')) {
        contactProperties[mapping.replace('contact.', '')] = value;
      }
      // Deal properties
      else if (mapping.startsWith('deal.')) {
        dealProperties[mapping.replace('deal.', '')] = value;
      }
      // Default to contact property
      else {
        contactProperties[mapping] = value;
      }
    }

    // Common field mappings
    const commonMappings = {
      firstname: ['first_name', 'first', 'fname', 'name'],
      lastname: ['last_name', 'last', 'lname', 'surname'],
      phone: ['phone', 'phone_number', 'tel', 'mobile'],
      company: ['company', 'company_name', 'organization'],
      jobtitle: ['job_title', 'title', 'position', 'role'],
      website: ['website', 'url', 'site'],
      address: ['address', 'street'],
      city: ['city'],
      state: ['state', 'province'],
      zip: ['zip', 'zipcode', 'postal_code']
    };

    // Auto-map common fields
    for (const [fieldId, value] of Object.entries(formData)) {
      const fieldLower = fieldId.toLowerCase();
      
      for (const [hubspotProp, aliases] of Object.entries(commonMappings)) {
        if (!contactProperties[hubspotProp] && 
            aliases.some(alias => fieldLower.includes(alias))) {
          contactProperties[hubspotProp] = value;
          break;
        }
      }

      // Auto-detect email
      if (!email && (fieldLower.includes('email') || 
          String(value).match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))) {
        email = value;
        contactProperties.email = value;
      }
    }

    if (!email) {
      throw new Error('No email field found in form submission');
    }

    // Add source info
    if (options.formTitle) {
      contactProperties.hs_lead_status = 'NEW';
      contactProperties.recent_conversion_event_name = options.formTitle;
    }

    // Create or update contact
    const contactResult = await this.upsertContact(email, contactProperties);

    // Create deal if deal properties exist or if option is set
    let dealResult = null;
    if (Object.keys(dealProperties).length > 0 || options.createDeal) {
      dealProperties.dealname = dealProperties.dealname || 
        `${contactProperties.firstname || email} - ${options.formTitle || 'Form Submission'}`;
      dealProperties.pipeline = dealProperties.pipeline || 'default';
      dealProperties.dealstage = dealProperties.dealstage || 'appointmentscheduled';

      dealResult = await this.createDeal(dealProperties, {
        contactId: contactResult.id
      });
    }

    return {
      success: true,
      contact: contactResult,
      deal: dealResult
    };
  }
}

module.exports = HubSpotService;

// ===========================================
// Mailchimp Integration Service
// ===========================================
// Sync form submissions to Mailchimp email lists

const axios = require('axios');
const crypto = require('crypto');

class MailchimpService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.dc = apiKey ? apiKey.split('-')[1] : 'us1'; // Data center from API key
    this.baseUrl = `https://${this.dc}.api.mailchimp.com/3.0`;
  }

  // Get authorization header
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  // Get MD5 hash of email (required by Mailchimp)
  getSubscriberHash(email) {
    return crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
  }

  // Test connection
  async testConnection() {
    try {
      const response = await axios.get(`${this.baseUrl}/ping`, {
        headers: this.getHeaders()
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  }

  // Get all lists/audiences
  async getLists() {
    try {
      const response = await axios.get(`${this.baseUrl}/lists`, {
        headers: this.getHeaders(),
        params: { count: 100 }
      });
      return response.data.lists.map(list => ({
        id: list.id,
        name: list.name,
        memberCount: list.stats.member_count
      }));
    } catch (error) {
      throw new Error(`Failed to get lists: ${error.message}`);
    }
  }

  // Get merge fields for a list
  async getMergeFields(listId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/lists/${listId}/merge-fields`,
        { headers: this.getHeaders() }
      );
      return response.data.merge_fields.map(field => ({
        tag: field.tag,
        name: field.name,
        type: field.type,
        required: field.required
      }));
    } catch (error) {
      throw new Error(`Failed to get merge fields: ${error.message}`);
    }
  }

  // Add or update subscriber
  async addSubscriber(listId, email, data = {}) {
    const subscriberHash = this.getSubscriberHash(email);
    
    const payload = {
      email_address: email,
      status_if_new: data.status || 'subscribed',
      merge_fields: {}
    };

    // Map common fields
    if (data.firstName) payload.merge_fields.FNAME = data.firstName;
    if (data.lastName) payload.merge_fields.LNAME = data.lastName;
    if (data.phone) payload.merge_fields.PHONE = data.phone;
    if (data.company) payload.merge_fields.COMPANY = data.company;
    if (data.address) payload.merge_fields.ADDRESS = data.address;
    if (data.birthday) payload.merge_fields.BIRTHDAY = data.birthday;

    // Add any custom merge fields
    if (data.mergeFields) {
      payload.merge_fields = { ...payload.merge_fields, ...data.mergeFields };
    }

    // Add tags
    if (data.tags && data.tags.length > 0) {
      payload.tags = data.tags;
    }

    try {
      const response = await axios.put(
        `${this.baseUrl}/lists/${listId}/members/${subscriberHash}`,
        payload,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        id: response.data.id,
        email: response.data.email_address,
        status: response.data.status
      };
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message;
      throw new Error(`Failed to add subscriber: ${errorMsg}`);
    }
  }

  // Add tags to subscriber
  async addTags(listId, email, tags) {
    const subscriberHash = this.getSubscriberHash(email);
    
    const payload = {
      tags: tags.map(tag => ({ name: tag, status: 'active' }))
    };

    try {
      await axios.post(
        `${this.baseUrl}/lists/${listId}/members/${subscriberHash}/tags`,
        payload,
        { headers: this.getHeaders() }
      );
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to add tags: ${error.message}`);
    }
  }

  // Unsubscribe
  async unsubscribe(listId, email) {
    const subscriberHash = this.getSubscriberHash(email);
    
    try {
      await axios.patch(
        `${this.baseUrl}/lists/${listId}/members/${subscriberHash}`,
        { status: 'unsubscribed' },
        { headers: this.getHeaders() }
      );
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to unsubscribe: ${error.message}`);
    }
  }

  // Get subscriber info
  async getSubscriber(listId, email) {
    const subscriberHash = this.getSubscriberHash(email);
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/lists/${listId}/members/${subscriberHash}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(`Failed to get subscriber: ${error.message}`);
    }
  }

  // Process form submission
  async processSubmission(listId, formData, fieldMapping = {}) {
    // Extract email from form data
    let email = null;
    const subscriberData = {};

    for (const [fieldId, value] of Object.entries(formData)) {
      const mapping = fieldMapping[fieldId];
      
      if (mapping === 'email' || fieldId.toLowerCase().includes('email')) {
        email = value;
      } else if (mapping === 'firstName' || fieldId.toLowerCase().includes('first')) {
        subscriberData.firstName = value;
      } else if (mapping === 'lastName' || fieldId.toLowerCase().includes('last')) {
        subscriberData.lastName = value;
      } else if (mapping === 'phone' || fieldId.toLowerCase().includes('phone')) {
        subscriberData.phone = value;
      } else if (mapping === 'company' || fieldId.toLowerCase().includes('company')) {
        subscriberData.company = value;
      } else if (mapping) {
        // Custom merge field
        if (!subscriberData.mergeFields) subscriberData.mergeFields = {};
        subscriberData.mergeFields[mapping] = value;
      }
    }

    if (!email) {
      throw new Error('No email field found in form submission');
    }

    return this.addSubscriber(listId, email, subscriberData);
  }
}

module.exports = MailchimpService;

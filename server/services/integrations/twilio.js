// ===========================================
// Twilio Integration Service
// ===========================================
// Send SMS notifications for form submissions

const axios = require('axios');

class TwilioService {
  constructor(accountSid, authToken, fromNumber) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.fromNumber = fromNumber;
    this.baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}`;
  }

  getAuth() {
    return {
      username: this.accountSid,
      password: this.authToken
    };
  }

  // Test connection
  async testConnection() {
    try {
      const response = await axios.get(
        `${this.baseUrl}.json`,
        { auth: this.getAuth() }
      );
      return {
        success: true,
        accountName: response.data.friendly_name,
        status: response.data.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Send SMS
  async sendSMS(to, body) {
    try {
      const params = new URLSearchParams();
      params.append('To', this.formatPhoneNumber(to));
      params.append('From', this.fromNumber);
      params.append('Body', body.substring(0, 1600)); // Twilio limit

      const response = await axios.post(
        `${this.baseUrl}/Messages.json`,
        params,
        { auth: this.getAuth() }
      );

      return {
        success: true,
        sid: response.data.sid,
        status: response.data.status,
        to: response.data.to
      };
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      throw new Error(`Failed to send SMS: ${errorMsg}`);
    }
  }

  // Send SMS to multiple recipients
  async sendBulkSMS(recipients, body) {
    const results = [];
    
    for (const to of recipients) {
      try {
        const result = await this.sendSMS(to, body);
        results.push({ to, ...result });
      } catch (error) {
        results.push({ to, success: false, error: error.message });
      }
    }

    return results;
  }

  // Format phone number to E.164 format
  formatPhoneNumber(phone) {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');
    
    // If it doesn't start with country code, assume US (+1)
    if (cleaned.length === 10) {
      cleaned = '1' + cleaned;
    }
    
    return '+' + cleaned;
  }

  // Create message body from form submission
  createSubmissionMessage(formTitle, formData, options = {}) {
    let message = options.prefix || `📝 New submission: ${formTitle}\n\n`;
    
    // Add key fields
    const priorityFields = ['name', 'email', 'phone', 'message'];
    const addedFields = new Set();

    // First add priority fields
    for (const [key, value] of Object.entries(formData)) {
      const keyLower = key.toLowerCase();
      if (priorityFields.some(pf => keyLower.includes(pf))) {
        message += `${key}: ${value}\n`;
        addedFields.add(key);
      }
    }

    // Then add remaining fields (up to character limit)
    for (const [key, value] of Object.entries(formData)) {
      if (!addedFields.has(key) && message.length < 1400) {
        const line = `${key}: ${value}\n`;
        if (message.length + line.length < 1500) {
          message += line;
        }
      }
    }

    // Add suffix/link if provided
    if (options.viewUrl) {
      message += `\nView: ${options.viewUrl}`;
    }

    return message.trim();
  }

  // Send form submission notification
  async sendSubmissionNotification(to, formTitle, formData, options = {}) {
    const body = this.createSubmissionMessage(formTitle, formData, options);
    return this.sendSMS(to, body);
  }

  // Process form submission
  async processSubmission(formTitle, formData, fieldLabels = {}, config = {}) {
    const recipients = config.recipients || [];
    
    if (recipients.length === 0) {
      throw new Error('No SMS recipients configured');
    }

    // Map field IDs to labels
    const labeledData = {};
    for (const [fieldId, value] of Object.entries(formData)) {
      const label = fieldLabels[fieldId] || fieldId;
      labeledData[label] = value;
    }

    const results = [];
    for (const recipient of recipients) {
      try {
        const result = await this.sendSubmissionNotification(
          recipient,
          formTitle,
          labeledData,
          { viewUrl: config.viewUrl }
        );
        results.push(result);
      } catch (error) {
        results.push({ to: recipient, success: false, error: error.message });
      }
    }

    return {
      success: results.some(r => r.success),
      results
    };
  }

  // Send verification code
  async sendVerificationCode(to, code) {
    const body = `Your HypeForm verification code is: ${code}. This code expires in 10 minutes.`;
    return this.sendSMS(to, body);
  }

  // Send custom notification
  async sendNotification(to, type, data) {
    const templates = {
      submission_received: `✅ New form submission received for "${data.formTitle}". Total responses: ${data.totalResponses}`,
      form_published: `🚀 Your form "${data.formTitle}" is now live! Share it at: ${data.formUrl}`,
      milestone: `🎉 Congrats! Your form "${data.formTitle}" just hit ${data.milestone} submissions!`,
      daily_summary: `📊 Daily Summary:\n${data.submissions} new submissions\n${data.views} views\nTop form: ${data.topForm}`
    };

    const body = templates[type] || data.message || 'HypeForm Notification';
    return this.sendSMS(to, body);
  }

  // Get message history
  async getMessages(options = {}) {
    try {
      const params = {};
      if (options.to) params.To = this.formatPhoneNumber(options.to);
      if (options.from) params.From = options.from;
      if (options.dateSent) params.DateSent = options.dateSent;
      if (options.pageSize) params.PageSize = options.pageSize;

      const response = await axios.get(
        `${this.baseUrl}/Messages.json`,
        { auth: this.getAuth(), params }
      );

      return response.data.messages.map(msg => ({
        sid: msg.sid,
        to: msg.to,
        from: msg.from,
        body: msg.body,
        status: msg.status,
        dateSent: msg.date_sent,
        price: msg.price
      }));
    } catch (error) {
      throw new Error(`Failed to get messages: ${error.message}`);
    }
  }

  // Check phone number validity
  async lookupNumber(phoneNumber) {
    try {
      const formatted = this.formatPhoneNumber(phoneNumber);
      const response = await axios.get(
        `https://lookups.twilio.com/v1/PhoneNumbers/${formatted}`,
        { auth: this.getAuth() }
      );

      return {
        valid: true,
        phoneNumber: response.data.phone_number,
        countryCode: response.data.country_code,
        carrier: response.data.carrier
      };
    } catch (error) {
      if (error.response?.status === 404) {
        return { valid: false };
      }
      throw new Error(`Lookup failed: ${error.message}`);
    }
  }
}

module.exports = TwilioService;

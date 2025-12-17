// ===========================================
// Discord Integration Service
// ===========================================
// Send form submission notifications to Discord channels

const axios = require('axios');

class DiscordService {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
  }

  // Validate webhook URL
  isValidWebhook() {
    return this.webhookUrl && 
           this.webhookUrl.includes('discord.com/api/webhooks/');
  }

  // Test webhook
  async testConnection() {
    if (!this.isValidWebhook()) {
      return { success: false, error: 'Invalid webhook URL' };
    }

    try {
      // Get webhook info
      const response = await axios.get(this.webhookUrl);
      return {
        success: true,
        name: response.data.name,
        channelId: response.data.channel_id,
        guildId: response.data.guild_id
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  // Send simple message
  async sendMessage(content) {
    try {
      await axios.post(this.webhookUrl, { content });
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  // Send rich embed message
  async sendEmbed(embed) {
    try {
      await axios.post(this.webhookUrl, { embeds: [embed] });
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to send embed: ${error.message}`);
    }
  }

  // Create embed from form submission
  createSubmissionEmbed(formTitle, formData, options = {}) {
    const embed = {
      title: options.title || `📝 New Submission: ${formTitle}`,
      color: options.color || 0xf59e0b, // Amber color
      timestamp: new Date().toISOString(),
      footer: {
        text: options.footerText || 'HypeForm'
      }
    };

    // Add description if provided
    if (options.description) {
      embed.description = options.description;
    }

    // Convert form data to fields
    const fields = [];
    for (const [label, value] of Object.entries(formData)) {
      if (value !== null && value !== undefined && value !== '') {
        let displayValue = value;
        
        // Handle arrays
        if (Array.isArray(value)) {
          displayValue = value.join(', ');
        }
        // Handle objects
        else if (typeof value === 'object') {
          displayValue = JSON.stringify(value);
        }
        // Truncate long values
        if (String(displayValue).length > 1024) {
          displayValue = String(displayValue).substring(0, 1021) + '...';
        }

        fields.push({
          name: String(label).substring(0, 256),
          value: String(displayValue) || '-',
          inline: String(displayValue).length < 50
        });
      }
    }

    // Discord allows max 25 fields
    embed.fields = fields.slice(0, 25);

    // Add thumbnail if provided
    if (options.thumbnail) {
      embed.thumbnail = { url: options.thumbnail };
    }

    // Add author
    if (options.author) {
      embed.author = {
        name: options.author.name || 'HypeForm',
        icon_url: options.author.icon,
        url: options.author.url
      };
    }

    return embed;
  }

  // Send form submission notification
  async sendSubmissionNotification(formTitle, formData, options = {}) {
    const embed = this.createSubmissionEmbed(formTitle, formData, options);
    return this.sendEmbed(embed);
  }

  // Send notification with action buttons (using components - requires bot)
  // For webhooks, we'll include links in the embed instead
  async sendWithLinks(formTitle, formData, links = {}) {
    const embed = this.createSubmissionEmbed(formTitle, formData);
    
    // Add links to description
    const linkTexts = [];
    if (links.viewSubmission) {
      linkTexts.push(`[📋 View Submission](${links.viewSubmission})`);
    }
    if (links.viewForm) {
      linkTexts.push(`[📝 View Form](${links.viewForm})`);
    }
    if (links.dashboard) {
      linkTexts.push(`[📊 Dashboard](${links.dashboard})`);
    }

    if (linkTexts.length > 0) {
      embed.description = linkTexts.join(' • ');
    }

    return this.sendEmbed(embed);
  }

  // Process form submission
  async processSubmission(formTitle, formData, fieldLabels = {}, options = {}) {
    // Map field IDs to labels
    const labeledData = {};
    for (const [fieldId, value] of Object.entries(formData)) {
      const label = fieldLabels[fieldId] || fieldId;
      labeledData[label] = value;
    }

    return this.sendSubmissionNotification(formTitle, labeledData, options);
  }

  // Send custom notification (for events like form published, etc.)
  async sendNotification(type, data) {
    const embeds = {
      form_published: {
        title: '🚀 Form Published',
        description: `**${data.formTitle}** is now live!`,
        color: 0x22c55e,
        fields: [
          { name: 'Form URL', value: data.formUrl || 'N/A', inline: false }
        ]
      },
      submission_milestone: {
        title: '🎉 Milestone Reached!',
        description: `**${data.formTitle}** has reached ${data.count} submissions!`,
        color: 0x8b5cf6
      },
      daily_summary: {
        title: '📊 Daily Summary',
        description: `Here's your daily form activity`,
        color: 0x3b82f6,
        fields: [
          { name: 'New Submissions', value: String(data.submissions || 0), inline: true },
          { name: 'Form Views', value: String(data.views || 0), inline: true },
          { name: 'Completion Rate', value: `${data.completionRate || 0}%`, inline: true }
        ]
      }
    };

    const embed = embeds[type] || {
      title: 'HypeForm Notification',
      description: JSON.stringify(data),
      color: 0xf59e0b
    };

    embed.timestamp = new Date().toISOString();
    embed.footer = { text: 'HypeForm' };

    return this.sendEmbed(embed);
  }

  // Send error notification
  async sendError(error, context = {}) {
    const embed = {
      title: '⚠️ Error Alert',
      description: error.message || String(error),
      color: 0xef4444,
      timestamp: new Date().toISOString(),
      footer: { text: 'HypeForm Alert' }
    };

    if (context.formTitle) {
      embed.fields = [
        { name: 'Form', value: context.formTitle, inline: true }
      ];
    }

    return this.sendEmbed(embed);
  }
}

module.exports = DiscordService;

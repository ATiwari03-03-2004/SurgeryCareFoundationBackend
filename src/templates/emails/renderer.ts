const templates: Record<string, (data: Record<string, unknown>) => string> = {
  welcome: (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a73e8;">Welcome to Surgery Care</h1>
      <p>Hi ${data.firstName},</p>
      <p>Thank you for joining Surgery Care. Together, we can make a difference in patients' lives.</p>
      <p>If you have any questions, don't hesitate to reach out.</p>
      <p>Best regards,<br>The Surgery Care Team</p>
    </div>
  `,

  'verify-email': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a73e8;">Verify Your Email</h1>
      <p>Hi ${data.firstName},</p>
      <p>Please click the link below to verify your email address:</p>
      <p><a href="${data.verificationUrl}" style="background: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a></p>
      <p>This link expires in 24 hours.</p>
    </div>
  `,

  'reset-password': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a73e8;">Reset Your Password</h1>
      <p>Hi ${data.firstName},</p>
      <p>You requested a password reset. Click the link below:</p>
      <p><a href="${data.resetUrl}" style="background: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    </div>
  `,

  'donation-success': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a73e8;">Thank You for Your Donation!</h1>
      <p>Hi ${data.donorName || 'Generous Donor'},</p>
      <p>Your donation of <strong>₹${data.amount}</strong> to <strong>${data.campaignTitle}</strong> has been received successfully.</p>
      <p>Your generosity makes a real difference. A receipt will be sent to you shortly.</p>
      <p>Best regards,<br>The Surgery Care Team</p>
    </div>
  `,

  'payment-pending': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #f59e0b;">Payment Pending</h1>
      <p>Hi ${data.donorName},</p>
      <p>Your donation of ₹${data.amount} to ${data.campaignTitle} is being processed. We'll notify you once it's confirmed.</p>
    </div>
  `,

  'payment-failed': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #ef4444;">Payment Failed</h1>
      <p>Hi ${data.donorName},</p>
      <p>Unfortunately, your donation of ₹${data.amount} to ${data.campaignTitle} could not be processed.</p>
      <p>Please try again or contact support if the issue persists.</p>
    </div>
  `,

  'receipt-attached': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a73e8;">Your Donation Receipt</h1>
      <p>Hi ${data.donorName},</p>
      <p>Please find your donation receipt attached. Receipt number: <strong>${data.receiptNumber}</strong></p>
      <p>Amount: ₹${data.amount}<br>Campaign: ${data.campaignTitle}<br>Date: ${data.date}</p>
    </div>
  `,

  'campaign-approved': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #10b981;">Campaign Approved!</h1>
      <p>Hi ${data.creatorName},</p>
      <p>Great news! Your campaign <strong>${data.campaignTitle}</strong> has been approved and is now live.</p>
      <p>Share it with your network to start receiving donations.</p>
    </div>
  `,

  'campaign-rejected': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #ef4444;">Campaign Review Update</h1>
      <p>Hi ${data.creatorName},</p>
      <p>Your campaign <strong>${data.campaignTitle}</strong> requires changes before it can be approved.</p>
      <p><strong>Reason:</strong> ${data.reason}</p>
      <p>Please update your campaign and resubmit.</p>
    </div>
  `,

  'withdrawal-approved': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #10b981;">Withdrawal Approved</h1>
      <p>Hi ${data.creatorName},</p>
      <p>Your withdrawal request of ₹${data.amount} for campaign <strong>${data.campaignTitle}</strong> has been approved.</p>
      <p>The funds will be disbursed to your registered bank account.</p>
    </div>
  `,

  'withdrawal-rejected': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #ef4444;">Withdrawal Request Update</h1>
      <p>Hi ${data.creatorName},</p>
      <p>Your withdrawal request of ₹${data.amount} for campaign <strong>${data.campaignTitle}</strong> was not approved.</p>
      <p><strong>Reason:</strong> ${data.reason}</p>
    </div>
  `,

  'milestone-reached': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a73e8;">Milestone Reached!</h1>
      <p>Hi ${data.donorName},</p>
      <p>A campaign you donated to has reached a milestone:</p>
      <p><strong>${data.campaignTitle}</strong> — ${data.milestoneTitle}</p>
      <p>Thank you for making this possible!</p>
    </div>
  `,

  'recurring-reminder': (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a73e8;">Recurring Donation Reminder</h1>
      <p>Hi ${data.donorName},</p>
      <p>Your recurring donation of ₹${data.amount} to <strong>${data.campaignTitle}</strong> is scheduled for ${data.nextDate}.</p>
      <p>Thank you for your continued support!</p>
    </div>
  `,
};

export function renderTemplate(templateName: string, data: Record<string, unknown>): string {
  const renderer = templates[templateName];
  if (!renderer) {
    return `<p>Email template "${templateName}" not found.</p>`;
  }
  return renderer(data);
}

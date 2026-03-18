export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Surgery Care API',
    description: 'Backend API for the Surgery Care medical crowdfunding platform',
    version: '1.0.0',
    contact: { name: 'Surgery Care Team' },
  },
  servers: [
    { url: '/api/v1', description: 'API v1' },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'Users', description: 'User profile management' },
    { name: 'Public Campaigns', description: 'Public campaign browsing' },
    { name: 'Campaigns', description: 'Campaign creator endpoints' },
    { name: 'Moderation', description: 'Campaign moderation' },
    { name: 'Donations', description: 'Donation management' },
    { name: 'Payments', description: 'Payment processing' },
    { name: 'Withdrawals', description: 'Withdrawal requests' },
    { name: 'Finance', description: 'Finance management' },
    { name: 'Analytics', description: 'Dashboard analytics' },
    { name: 'Admin', description: 'Admin operations' },
    { name: 'Content', description: 'Trust & content management' },
    { name: 'Notifications', description: 'User notifications' },
    { name: 'Audit', description: 'Audit logs' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ApiSuccess: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { type: 'object' },
        },
      },
      ApiError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: {},
            },
          },
        },
      },
      PaginatedResult: {
        type: 'object',
        properties: {
          items: { type: 'array', items: {} },
          total: { type: 'integer' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
    },
  },
  paths: {
    // Auth
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  phone: { type: 'string' },
                  role: { type: 'string', enum: ['donor', 'campaign_creator'] },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } },
          409: { description: 'Email already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/logout': { post: { tags: ['Auth'], summary: 'Logout', responses: { 200: { description: 'Logged out' } } } },
    '/auth/refresh': { post: { tags: ['Auth'], summary: 'Refresh access token', responses: { 200: { description: 'Token refreshed' } } } },
    '/auth/me': { get: { tags: ['Auth'], summary: 'Get current session', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Session info' } } } },
    '/auth/verify-email': { post: { tags: ['Auth'], summary: 'Verify email address', responses: { 200: { description: 'Email verified' } } } },
    '/auth/forgot-password': { post: { tags: ['Auth'], summary: 'Request password reset', responses: { 200: { description: 'Reset link sent if email exists' } } } },
    '/auth/reset-password': { post: { tags: ['Auth'], summary: 'Reset password with token', responses: { 200: { description: 'Password reset' } } } },
    '/auth/change-password': { post: { tags: ['Auth'], summary: 'Change password', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Password changed' } } } },

    // Public campaigns
    '/public/campaigns': { get: { tags: ['Public Campaigns'], summary: 'List active campaigns', parameters: [{ in: 'query', name: 'page', schema: { type: 'integer' } }, { in: 'query', name: 'limit', schema: { type: 'integer' } }, { in: 'query', name: 'search', schema: { type: 'string' } }, { in: 'query', name: 'category', schema: { type: 'string' } }], responses: { 200: { description: 'Campaign list' } } } },
    '/public/campaigns/{slug}': { get: { tags: ['Public Campaigns'], summary: 'Get campaign by slug', parameters: [{ in: 'path', name: 'slug', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Campaign detail' } } } },
    '/public/campaigns/{slug}/updates': { get: { tags: ['Public Campaigns'], summary: 'Get campaign updates', parameters: [{ in: 'path', name: 'slug', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Campaign updates' } } } },

    // Campaigns
    '/campaigns': { post: { tags: ['Campaigns'], summary: 'Create campaign', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Campaign created' } } } },
    '/campaigns/me': { get: { tags: ['Campaigns'], summary: 'My campaigns', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Campaign list' } } } },
    '/campaigns/{id}': { get: { tags: ['Campaigns'], summary: 'Get campaign', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Campaign detail' } } }, patch: { tags: ['Campaigns'], summary: 'Update campaign', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Updated' } } } },
    '/campaigns/{id}/submit': { post: { tags: ['Campaigns'], summary: 'Submit for review', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Submitted' } } } },
    '/campaigns/{id}/updates': { post: { tags: ['Campaigns'], summary: 'Add update', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Update posted' } } } },
    '/campaigns/{id}/milestones': { post: { tags: ['Campaigns'], summary: 'Add milestone', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Milestone created' } } } },
    '/campaigns/{id}/documents/upload-url': { post: { tags: ['Campaigns'], summary: 'Get upload URL for document', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Upload URL' } } } },

    // Moderation
    '/moderation/campaigns': { get: { tags: ['Moderation'], summary: 'List pending campaigns', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Pending campaigns' } } } },
    '/moderation/campaigns/{id}/approve': { post: { tags: ['Moderation'], summary: 'Approve campaign', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Approved' } } } },
    '/moderation/campaigns/{id}/reject': { post: { tags: ['Moderation'], summary: 'Reject campaign', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Rejected' } } } },

    // Payments
    '/payments/create-intent': { post: { tags: ['Payments'], summary: 'Create payment intent', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Intent created' } } } },
    '/payments/webhooks/{provider}': { post: { tags: ['Payments'], summary: 'Payment webhook', responses: { 200: { description: 'Processed' } } } },

    // Finance
    '/finance/donations': { get: { tags: ['Finance'], summary: 'All donations', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Donations' } } } },
    '/finance/withdrawals': { get: { tags: ['Finance'], summary: 'All withdrawals', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Withdrawals' } } } },
    '/finance/withdrawals/{id}/approve': { post: { tags: ['Finance'], summary: 'Approve withdrawal', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Approved' } } } },
    '/finance/withdrawals/{id}/disburse': { post: { tags: ['Finance'], summary: 'Disburse funds', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Disbursed' } } } },

    // Admin
    '/admin/dashboard': { get: { tags: ['Admin'], summary: 'Admin dashboard', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Dashboard data' } } } },
    '/admin/donors': { get: { tags: ['Admin'], summary: 'List donors', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Donors' } } } },

    // Trust / Content
    '/public/trust/partner-hospitals': { get: { tags: ['Content'], summary: 'Partner hospitals', responses: { 200: { description: 'Hospitals' } } } },
    '/public/trust/board-members': { get: { tags: ['Content'], summary: 'Board members', responses: { 200: { description: 'Members' } } } },
  },
};

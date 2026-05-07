const serviceMap = {
  auth: {
    path: 'auth',
    host: process.env.AUTH_SERVICE_HOST || 'localhost',
    port: process.env.AUTH_SERVICE_PORT || 8001,
  },
  course: {
    path: 'course',
    host: process.env.COURSE_SERVICE_HOST || 'localhost',
    port: process.env.COURSE_SERVICE_PORT || 8002,
  },
  assessment: {
    path: 'assessment',
    host: process.env.ASSESSMENT_SERVICE_HOST || 'localhost',
    port: process.env.ASSESSMENT_SERVICE_PORT || 8003,
  },
  organisation: {
    path: 'organisation',
    host: process.env.ORGANISATION_SERVICE_HOST || 'localhost',
    port: process.env.ORGANISATION_SERVICE_PORT || 8004,
  },
  college: {
    path: 'college',
    host: process.env.COLLEGE_SERVICE_HOST || 'localhost',
    port: process.env.COLLEGE_SERVICE_PORT || 8005,
  },
  payment: {
    path: 'payment',
    host: process.env.PAYMENT_SERVICE_HOST || 'localhost',
    port: process.env.PAYMENT_SERVICE_PORT || 8006,
  },
  admin: {
    path: 'admin',
    host: process.env.ADMIN_SERVICE_HOST || 'localhost',
    port: process.env.ADMIN_SERVICE_PORT || 8007,
    stripPrefix: '/api/v1/admin',
    forwardPrefix: '/api',
  },

};

export default serviceMap;

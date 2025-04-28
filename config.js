require('dotenv').config();

module.exports = {
    // Server configuration
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // MongoDB configuration
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/education_system',
    
    // JWT configuration
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiration: process.env.JWT_EXPIRATION || '24h',
    
    // CORS configuration
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    
    // Logging configuration
    logLevel: process.env.LOG_LEVEL || 'info',
    
    // Email configuration
    emailService: process.env.EMAIL_SERVICE || 'gmail',
    emailUser: process.env.EMAIL_USER,
    emailPassword: process.env.EMAIL_PASSWORD,
    
    // File upload configuration
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: process.env.MAX_FILE_SIZE || 5242880, // 5MB
    
    // Rate limiting configuration
    rateLimitWindow: process.env.RATE_LIMIT_WINDOW || 15 * 60 * 1000, // 15 minutes
    rateLimitMax: process.env.RATE_LIMIT_MAX || 100,
    
    // Session configuration
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret',
    sessionMaxAge: process.env.SESSION_MAX_AGE || 24 * 60 * 60 * 1000, // 24 hours
    
    // Security configuration
    bcryptSaltRounds: process.env.BCRYPT_SALT_ROUNDS || 10,
    passwordMinLength: process.env.PASSWORD_MIN_LENGTH || 8,
    
    // Tenant configuration
    defaultTenant: 'uvu',
    allowedTenants: ['uvu', 'uofu'],
    
    // Tenant-specific configuration
    tenants: {
        uvu: {
            name: 'UVU',
            theme: {
                primaryColor: '#0066cc',
                secondaryColor: '#ffffff',
                accentColor: '#ffcc00'
            }
        },
        uofu: {
            name: 'UofU',
            theme: {
                primaryColor: '#cc0000',
                secondaryColor: '#ffffff',
                accentColor: '#000000'
            }
        }
    }
}; 
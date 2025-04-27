# Student Logs Application

A multi-tenant application for managing student logs, supporting both Utah Valley University (UVU) and University of Utah (UofU) with distinct branding and data separation.

## Features

- **Multi-tenant Support**: Separate instances for UVU and UofU with path-based routing
- **Authentication**: Secure login system with session management
- **Course Management**: Add and view courses specific to each institution
- **Student Logs**: Track and manage student logs with course association
- **Tenant-specific Styling**: Custom color schemes for each institution
  - UVU: Green and Red theme
  - UofU: Red and Black theme

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   SESSION_SECRET=your_session_secret
   ```

### Running the Application

1. Start the server:
   ```bash
   npm start
   ```
2. Access the application:
   - UVU: http://localhost:3000/uvu
   - UofU: http://localhost:3000/uofu

## Database Setup

The application uses MongoDB with the following collections:
- `users`: Stores user credentials and tenant information
- `courses`: Stores course information with tenant association
- `logs`: Stores student logs with course and tenant association

### Seeding the Database

To seed the database with initial data, run:
```bash
npm run seed
```

This will create:
- Admin users for both UVU and UofU
- Sample courses for each institution
- Test logs for demonstration

## API Endpoints

### Authentication
- `POST /auth/login`: User login
- `POST /auth/logout`: User logout
- `GET /auth/status`: Check authentication status

### Courses
- `GET /{tenant}/courses`: Get all courses for a tenant
- `POST /{tenant}/courses`: Add a new course (teacher/admin only)

### Logs
- `GET /logs`: Get logs for a specific course and student
- `POST /logs`: Add a new log entry

## Tenant-specific Features

### UVU
- Green and Red color scheme
- Custom UVU branding
- UVU-specific course management

### UofU
- Red and Black color scheme
- Custom UofU branding
- UofU-specific course management

## Security

- Session-based authentication
- Tenant isolation
- Role-based access control
- Secure password storage with bcrypt

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

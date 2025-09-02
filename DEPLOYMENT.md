# ProHappyAssignments - Deployment Guide

## Environment Variables for Coolify

The following environment variables need to be configured in your Coolify deployment:

### Database Configuration
```
DATABASE_URL=postgresql://username:password@hostname:port/database_name
```
**Required**: PostgreSQL database connection string
- Replace `username`, `password`, `hostname`, `port`, and `database_name` with your actual database credentials
- Example: `postgresql://prohappy_user:your_secure_password@postgres.coolify.local:5432/prohappy_db`

### Next.js Configuration
```
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-very-secure-random-secret-here
```
**Required for production**:
- `NEXTAUTH_URL`: Your app's production URL
- `NEXTAUTH_SECRET`: Generate a secure random string (32+ characters)

### Optional Environment Variables
```
NODE_ENV=production
PORT=3000
```

## Database Setup

Before deploying, ensure your PostgreSQL database is set up with the required tables. The app includes the following core tables:

1. `users` - User accounts and roles
2. `homeworks` - Homework submissions
3. `homework_files` - File attachments
4. `homework_change_requests` - Change request tracking
5. `change_request_files` - Change request file attachments
6. `reference_codes` - Referral system codes
7. `notifications` - User notifications
8. `pricing_config` - System pricing configuration

## Coolify Deployment Steps

1. **Create New Project** in Coolify
2. **Add PostgreSQL Database** service
3. **Configure Environment Variables** as listed above
4. **Set Build Settings**:
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Node Version: 18 or higher
5. **Deploy** the application

## Initial Data Setup

After deployment, you may want to:
1. Create the super agent account
2. Set up initial pricing configuration
3. Create reference codes for user registration

## Contact Information Update

Don't forget to update the contact information in the bottom navbar:
- Update WhatsApp number in `/src/components/layout/bottom-navbar.tsx`
- Update email address in the same file
- Replace `YOUR_PHONE_NUMBER` with your actual WhatsApp number
- Replace `contact@prohappyassignments.com` with your actual email

## Health Check

The app includes a health check endpoint at `/api/health` that verifies database connectivity.

## Troubleshooting

Common issues:
1. **Database Connection**: Verify DATABASE_URL is correct
2. **Build Failures**: Ensure Node.js version compatibility
3. **Environment Variables**: Double-check all required variables are set

For support, contact your development team.
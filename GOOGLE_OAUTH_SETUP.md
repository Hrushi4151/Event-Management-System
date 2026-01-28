# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the EventFlow application.

## Prerequisites

- A Google Cloud Platform (GCP) account
- Access to Google Cloud Console

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "EventFlow")
5. Click "Create"

### 2. Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and click "Enable"

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" (unless you have a Google Workspace account)
   - Fill in the required information:
     - App name: EventFlow
     - User support email: Your email
     - Developer contact information: Your email
   - Click "Save and Continue"
   - Add scopes: `email`, `profile`
   - Click "Save and Continue"
   - Add test users (optional for development)
   - Click "Save and Continue"
   - Review and click "Back to Dashboard"

4. Create OAuth Client ID:
   - Application type: "Web application"
   - Name: "EventFlow Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)
   - Click "Create"

5. Copy the **Client ID** and **Client Secret**

### 4. Configure Environment Variables

1. Create a `.env.local` file in the root of your project (if it doesn't exist)
2. Add the following variables:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-key-here
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
MONGODB_URI=your-mongodb-connection-string
```

3. Generate `NEXTAUTH_SECRET`:
   - On Linux/Mac: `openssl rand -base64 32`
   - On Windows (PowerShell): `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))`
   - Or use an online generator: https://generate-secret.vercel.app/32

### 5. Test the Integration

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000/login`
3. Click "Continue with Google"
4. Sign in with your Google account
5. You should be redirected to the dashboard

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure the redirect URI in Google Console exactly matches: `http://localhost:3000/api/auth/callback/google`
- Check for trailing slashes or protocol mismatches (http vs https)

### Error: "invalid_client"
- Verify that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct in `.env.local`
- Make sure there are no extra spaces or quotes around the values
- Restart your development server after changing environment variables

### User Not Created in Database
- Check MongoDB connection string in `.env.local`
- Verify the database is accessible
- Check server logs for any errors

### OAuth Consent Screen Issues
- For development, add your email as a test user in the OAuth consent screen
- Make sure the consent screen is published (or in testing mode with test users added)

## Production Deployment

When deploying to production:

1. Update the OAuth consent screen to "Published" status
2. Add your production domain to authorized JavaScript origins
3. Add your production callback URL to authorized redirect URIs
4. Update `NEXTAUTH_URL` in your production environment variables
5. Ensure all environment variables are set in your hosting platform (Vercel, Netlify, etc.)

## Security Notes

- Never commit `.env.local` to version control
- Keep your `GOOGLE_CLIENT_SECRET` secure
- Use different OAuth credentials for development and production
- Regularly rotate your `NEXTAUTH_SECRET`

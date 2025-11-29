# Google OAuth Setup Guide

The error `Unsupported provider: provider is not enabled` indicates that Google OAuth is not enabled in your Supabase project.

## Step 1: Create Google Cloud Credentials
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project (or select an existing one).
3.  Navigate to **APIs & Services** > **OAuth consent screen**.
    -   Select **External** and click **Create**.
    -   Fill in the required app information (App name, User support email, Developer contact info).
    -   Click **Save and Continue**.
4.  Navigate to **Credentials**.
    -   Click **Create Credentials** > **OAuth client ID**.
    -   Select **Web application**.
    -   Name it (e.g., "Community SaaS").
    -   **Authorized JavaScript origins**: Add `http://localhost:3000` (and your production URL later).
    -   **Authorized redirect URIs**: Add `https://pkspgoxtmjwkeevqtfsc.supabase.co/auth/v1/callback`.
    -   Click **Create**.
5.  Copy the **Client ID** and **Client Secret**.

## Step 2: Enable Google Auth in Supabase
1.  Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Select your project.
3.  Navigate to **Authentication** > **Providers**.
4.  Select **Google**.
5.  Toggle **Enable Google**.
6.  Paste the **Client ID** and **Client Secret** from Step 1.
7.  Click **Save**.

## Step 3: Verify
1.  Return to your application.
2.  Click "Sign up with Google" again.
3.  It should now redirect you to the Google login page.

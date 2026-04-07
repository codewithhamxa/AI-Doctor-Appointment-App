<div align="center">

# Run and deploy your Medi Ai app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## **.env.local File:**  Node.js

1. GEMINI_API_KEY="your Api Key"

2. APP_URL="http://localhost:3000/"

3. MONGODB_URI="Your MongoDB Database URL"

4. NEXTAUTH_SECRET="my_super_secret_nextauth_key_123"
5. NEXTAUTH_URL="http://localhost:3000/"

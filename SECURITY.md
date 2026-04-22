# 🚨 Security Action Required: Rotate Your API Keys

During our security audit, several **LIVE** secret keys were found in your `.env` file. If these have been exposed (e.g., via a public repository or shared access), they must be changed immediately.

## 1. Immediate Action Checklist

### [ ] Stripe Secret Key
*   **Location**: `.env` (`STRIPE_SECRET_KEY`)
*   **Risk**: Critical (Financial access).
*   **Action**: Go to [Stripe Dashboard > Developers > API Keys](https://dashboard.stripe.com/apikeys) and **Roll Key**. 

### [ ] Anthropic API Key
*   **Location**: `.env` (`ANTHROPIC_API_KEY`)
*   **Risk**: High (Financial billing for AI credits).
*   **Action**: Go to [Anthropic Console](https://console.anthropic.com/settings/keys) and delete the old keys, then create new ones.

### [ ] Google Maps API Key
*   **Location**: `.env` (`NEXT_PUBLIC_GOOGLE_API_KEY` and `GOOGLE_API_KEY`)
*   **Risk**: High (Unrestricted billing).
*   **Action**: 
    1. Go to [Google Cloud Console > Credentials](https://console.cloud.google.com/google/maps-apis/credentials).
    2. Click on your key.
    3. Under **Application restrictions**, select **Websites (HTTP referrers)**.
    4. Add your domain (e.g., `https://ringscale.ai/*`).
    5. **Save** and then consider generating a new key if this one is already widely stolen.

### [ ] MongoDB Connection String
*   **Location**: `.env` (`MONGO_URL`)
*   **Risk**: Critical (Full Database access).
*   **Action**: Change your MongoDB password in Atlas and update the URL in `.env`.

---

## 2. Best Practices to Prevent Re-exposure

1.  **Never commit `.env`**: Ensure `.env` is always in your `.gitignore`. (I have verified it is currently ignored).
2.  **Use Environment Variables in Production**: If using Vercel, Railway, or Docker, set these keys in the platform's dashboard, not in a file on the server.
3.  **Strict Restrictions**: Always apply "Referrer" or "IP" restrictions to every API key you create.
4.  **No `NEXT_PUBLIC_` for Secrets**: In Next.js, any variable starting with `NEXT_PUBLIC_` is **sent to the browser**. Only use it for public keys like the Maps UI key.

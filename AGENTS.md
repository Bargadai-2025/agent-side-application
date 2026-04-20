# Bargad Agent Field App (PWA)

## Integration Points with Manager Dashboard
- **Shared Database**: Uses the same MongoDB `Agents` and `Customers` collections.
- **Real-time Tracking**: Updates the `location` field in the Agent document every 10 minutes. The Manager Dashboard listens for these changes (via polling/refresh) to move markers.
- **Verification Loop**: When an agent uploads a selfie, it saves the Cloudinary URL to the `verifiedAgentImage` field in the Customer document. This instantly changes the customer status to "Verified" on the manager's map.

## Tech Specs
- **Next.js App Router**
- **Vanilla CSS** (Mobile-first, Dark Mode)
- **Framer Motion** for premium feel.
- **PWA Capabilities**: Add to Home Screen support.

## Environment Variables
- `MONGODB_URI`: Shared with manager app.
- `CLOUDINARY_*`: Shared for unified image storage.

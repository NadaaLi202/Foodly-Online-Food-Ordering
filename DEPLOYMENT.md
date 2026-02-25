# Deployment Guide

This project is configured for single-server deployment where the Express backend serves the built Frontend static files.

## Environment Variables

### Backend (.env)

Create a `.env` file in the `Backend` directory with the following variables:

- `DB_CONNECTION`: Your MongoDB connection string.
- `PORT`: The port your server will run on (default: 4000).
- `SECRET_KEY`: JWT secret for authentication.
- `ALLOWED_ORIGIN`: Set to `true` to allow all origins, or a specific domain (e.g., `https://yourdomain.com`).
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name.
- `CLOUDINARY_API_KEY`: Cloudinary API key.
- `CLOUDINARY_API_SECRET`: Cloudinary API secret.

### Frontend (.env.production)

The production build uses `Frontend/.env.production`. By default, it is set to:
`VITE_API_URL=/api/v1`

This works when the frontend is served from the same domain as the backend.

## Deployment Steps

1. **Install Dependencies**:
   ```bash
   npm run install-all
   ```

2. **Build and Start**:
   ```bash
   npm run start:prod
   ```
   This command will:
   - Build the Frontend into `Frontend/dist`.
   - Start the Backend server which will serve the API and the static files.

## Production Checklist

- [ ] Ensure `Backend/.env` contains production credentials.
- [ ] Ensure `Frontend/.env.production` has the correct `VITE_API_URL`.
- [ ] Run `npm run build` locally to verify there are no build errors.

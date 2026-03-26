FROM node:20-bullseye AS base

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm install

COPY . .

# Build arguments
ARG NEXT_PUBLIC_GOOGLE_API_KEY
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_RAZORPAY_KEY_ID

# Set environment variables for build time
ENV NEXT_PUBLIC_GOOGLE_API_KEY=$NEXT_PUBLIC_GOOGLE_API_KEY
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_RAZORPAY_KEY_ID=$NEXT_PUBLIC_RAZORPAY_KEY_ID

RUN npx prisma generate
RUN npm run build

# 👇 IMPORTANT: copy static assets for standalone
RUN cp -r .next/static .next/standalone/.next/
RUN cp -r public .next/standalone/

EXPOSE 3000

CMD ["node", ".next/standalone/server.js"]
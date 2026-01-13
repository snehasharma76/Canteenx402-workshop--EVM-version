# EVM Fortune Cookie 🥠

A demonstration of the [x402 Payment Protocol](https://x402.org) using Next.js on Base Sepolia.

## Overview

This project shows how to implement HTTP 402 Payment Required flows using the x402 library. When a user requests a "fortune", they must pay a small amount of USDC, which is handled automatically by the x402-fetch wrapper.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Payment Protocol**: x402 v1 (`x402-next`, `x402-fetch`)
- **Blockchain**: Base Sepolia (Testnet)
- **Currency**: USDC
- **Wallet**: viem

## How It Works

```
User clicks "Open Fortune Cookie"
         ↓
1. Client makes request to /api/fortune
2. Middleware returns 402 + payment requirements
3. x402-fetch automatically:
   - Signs payment authorization
   - Sends to x402 facilitator
   - Retries request with payment proof
4. Server returns fortune
```

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy the example env file and add your private key:
```bash
cp env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_PRIVATE_KEY=0x_your_base_sepolia_private_key_here
```

### 3. Get Testnet USDC
1. Visit [Circle Faucet](https://faucet.circle.com/)
2. Select **Base Sepolia**
3. Request USDC for your wallet address

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
evm-fortune/
├── app/
│   ├── api/fortune/route.ts   # Protected API endpoint
│   ├── page.tsx               # Frontend with x402-fetch
│   ├── providers.tsx          # React providers
│   └── layout.tsx             # App layout
├── middleware.ts              # x402 payment middleware
├── env.example                # Environment template
└── package.json
```

## Key Files

### `middleware.ts`
Configures the x402 payment requirements:
```typescript
import { paymentMiddleware } from "x402-next";

export const middleware = paymentMiddleware(
  "0xYourReceiverAddress",
  {
    "/api/fortune": {
      price: "$0.01",           // USDC amount
      network: "base-sepolia",
      config: { description: "Your Fortune Awaits" },
    },
  }
);
```

### `app/page.tsx`
Uses `wrapFetchWithPayment` to automatically handle 402 responses:
```typescript
import { wrapFetchWithPayment } from "x402-fetch";

const fetchWithPayment = wrapFetchWithPayment(fetch, walletClient);
const res = await fetchWithPayment("/api/fortune");
```

## Security Notes

⚠️ **Never commit `.env.local`** - it contains your private key
- The `.gitignore` already excludes all `.env*` files
- For production, use proper secret management (Vercel, AWS Secrets, etc.)

## License

MIT

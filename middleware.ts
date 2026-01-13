import { paymentProxy } from "@x402/next";
import { x402ResourceServer } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import type { Network } from "@x402/core/types";

// x402 v2 API - Following official migration guide pattern
// Server-side: Use ExactEvmScheme class with .register() method

// Create the x402 resource server (uses default facilitator)
const server = new x402ResourceServer()
    .register("eip155:84532" as Network, new ExactEvmScheme());

// Define route configurations with v2 "accepts" format
// Key v2 changes:
// - Payment options in `accepts` array
// - `payTo` included in each payment option
// - Network uses CAIP-2 format (eip155:chainId)
const routes = {
    "/api/fortune": {
        accepts: [
            {
                scheme: "exact" as const,
                payTo: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" as `0x${string}`,
                price: "$0.01", // USDC
                network: "eip155:84532" as Network, // Base Sepolia
            },
        ],
        description: "Your Fortune Awaits",
        mimeType: "application/json",
    },
};

// Create the payment proxy with the pre-configured server
export const middleware = paymentProxy(routes, server);

export const config = {
    matcher: ["/api/fortune/:path*"],
};

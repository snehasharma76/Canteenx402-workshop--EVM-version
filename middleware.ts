import { paymentMiddleware } from "x402-next";

// Configure the payment middleware (x402 v1 API - same as reference starter kit)
export const middleware = paymentMiddleware(
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Receiver wallet address
    {
        // Route configurations for protected endpoints
        "/api/fortune": {
            price: "$0.01", // USDC (requires USDC in wallet)
            network: "base-sepolia",
            config: {
                description: "Your Fortune Awaits",
            },
        },
    }
);

// Configure which paths the middleware should run on
export const config = {
    matcher: ["/api/fortune/:path*"],
};

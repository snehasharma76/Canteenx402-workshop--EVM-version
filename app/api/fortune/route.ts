import { NextResponse } from "next/server";

export async function GET() {
    const fortunes = [
        "A fresh start will put you on your way.",
        "A friend is a present you give yourself.",
        "A gamer's diet is the best diet.",
        "A golden egg of opportunity falls into your lap this month.",
        "A good time to finish up old tasks.",
        "A hunch is creativity trying to tell you something.",
        "A lifetime of happiness lies ahead of you.",
        "A light heart carries you through all the hard times."
    ];

    const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];

    // Return the fortune in the format expected by the client
    return NextResponse.json({
        fortune,
        timestamp: new Date().toISOString()
    });
}

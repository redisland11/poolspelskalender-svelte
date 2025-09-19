// src/routes/api/trigger-notifications/+server.js
import { json } from '@sveltejs/kit';
import { createClient } from '@vercel/kv'; // Ändrad import
import { env } from '$env/dynamic/private'; // Ändrad import

export async function GET() {
    // Manuell anslutning till databasen
    const kv = createClient({
        url: env.REDIS_URL
    });

    try {
        const nowTimestamp = Math.floor(Date.now() / 1000);
        const keys = await kv.keys('pushover_notis:*');
        const notificationsToSend = [];

        for (const key of keys) {
            const timestamp = parseInt(key.split(':')[1], 10);
            if (timestamp <= nowTimestamp) {
                const notisData = await kv.get(key);
                if (notisData) {
                    notificationsToSend.push(
                        fetch("https://api.pushover.net/1/messages.json", {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                token: env.PUSHOVER_API_TOKEN,
                                user: notisData.userKey,
                                title: notisData.title,
                                message: notisData.message
                            })
                        })
                    );
                }
                await kv.del(key);
            }
        }

        await Promise.all(notificationsToSend);
        return json({ success: true, sent: notificationsToSend.length });
    } catch (error) {
        console.error("Cron job error:", error);
        return json({ success: false, error: error.message }, { status: 500 });
    }
}
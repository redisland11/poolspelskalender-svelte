// src/routes/api/trigger-notifications/+server.js
import { json } from '@sveltejs/kit';
import { kv } from '@vercel/kv';
import { PUSHOVER_API_TOKEN } from '$env/static/private';

export async function GET() {
    try {
        const nowTimestamp = Math.floor(Date.now() / 1000);
        // Hitta alla nycklar som börjar med "pushover_notis:"
        const keys = await kv.keys('pushover_notis:*');

        const notificationsToSend = [];

        for (const key of keys) {
            const timestamp = parseInt(key.split(':')[1], 10);

            // Om notisens tid har passerat
            if (timestamp <= nowTimestamp) {
                const notisData = await kv.get(key);
                if (notisData) {
                    notificationsToSend.push(
                        fetch("https://api.pushover.net/1/messages.json", {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                token: PUSHOVER_API_TOKEN,
                                user: notisData.userKey,
                                title: notisData.title,
                                message: notisData.message
                                // Notera: ingen timestamp här!
                            })
                        })
                    );
                }
                // Ta bort nyckeln från databasen oavsett
                await kv.del(key);
            }
        }

        // Vänta på att alla Pushover-anrop ska slutföras
        await Promise.all(notificationsToSend);

        return json({ success: true, sent: notificationsToSend.length });
    } catch (error) {
        console.error("Cron job error:", error);
        return json({ success: false, error: error.message }, { status: 500 });
    }
}
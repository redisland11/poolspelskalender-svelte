import { json } from '@sveltejs/kit';
import { createClient } from 'redis';
import { env } from '$env/dynamic/private';

export async function GET() {
    const client = createClient({ url: env.REDIS_URL });
    await client.connect();

    try {
        const nowTimestamp = Math.floor(Date.now() / 1000);
        const keys = await client.keys('pushover_notis:*');
        const notificationsToSend = [];
        const keysToDelete = [];

        for (const key of keys) {
            const timestamp = parseInt(key.split(':')[1], 10);
            if (timestamp <= nowTimestamp) {
                const notisDataString = await client.get(key);
                if (notisDataString) {
                    const notisData = JSON.parse(notisDataString);
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
                keysToDelete.push(key);
            }
        }
        
        if (keysToDelete.length > 0) {
            await client.del(keysToDelete);
        }

        await Promise.all(notificationsToSend);
        await client.quit();
        return json({ success: true, sent: notificationsToSend.length });

    } catch (error) {
        await client.quit();
        console.error("Cron job error:", error);
        return json({ success: false, error: error.message }, { status: 500 });
    }
}
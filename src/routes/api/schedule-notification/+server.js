import { json } from '@sveltejs/kit';
import { createClient } from 'redis';
import { env } from '$env/dynamic/private';
import { toDate } from 'date-fns-tz';
import { getUnixTime } from 'date-fns';

export async function POST({ request }) {
    const client = createClient({ url: env.REDIS_URL });
    await client.connect();

    const { userKey, title, message, spelstopp } = await request.json();

    if (!userKey || !title || !message || !spelstopp) {
        await client.quit();
        return json({ success: false, error: 'Saknar data' }, { status: 400 });
    }

    try {
        const timeZone = 'Europe/Stockholm';
        const eventDate = toDate(spelstopp, { timeZone });
        const fiveMinutesInMillis = 5 * 60 * 1000;
        const notifyDate = new Date(eventDate.getTime() - fiveMinutesInMillis);
        const notifyTimestamp = getUnixTime(notifyDate);
        const nowTimestamp = getUnixTime(new Date());

        if (notifyTimestamp <= nowTimestamp) {
            await client.quit();
            return json({ success: false, error: 'Spelstopp är för nära i tiden eller har redan passerat.' }, { status: 400 });
        }
        
        const uniqueId = Math.random().toString(36).substring(2, 9);
        const key = `pushover_notis:${notifyTimestamp}:${uniqueId}`;
        
        await client.set(key, JSON.stringify({ userKey, title, message }));
        
        await client.quit();
        return json({ success: true });

    } catch (error) {
        await client.quit();
        console.error('Fel vid schemaläggning:', error);
        return json({ success: false, error: error.message }, { status: 500 });
    }
}
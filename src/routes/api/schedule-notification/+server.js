// src/routes/api/schedule-notification/+server.js
import { json } from '@sveltejs/kit';
import { kv } from '@vercel/kv';
import { zonedTimeToUtc } from 'date-fns-tz';

export async function POST({ request }) {
    const { userKey, title, message, spelstopp } = await request.json();

    if (!userKey || !title || !message || !spelstopp) {
        return json({ success: false, error: 'Saknar data' }, { status: 400 });
    }

    try {
        const timeZone = 'Europe/Stockholm';
        const eventDateInUtc = zonedTimeToUtc(spelstopp, timeZone);
        const fiveMinutesInMillis = 5 * 60 * 1000;
        const notifyTimestamp = Math.floor((eventDateInUtc.getTime() - fiveMinutesInMillis) / 1000);

        // Skapa en unik nyckel för varje notis
        const uniqueId = Math.random().toString(36).substring(2, 9);
        const key = `pushover_notis:${notifyTimestamp}:${uniqueId}`;
        
        // Spara notis-data i Vercel KV. Den ligger kvar tills vårt cron-jobb hittar den.
        await kv.set(key, { userKey, title, message });

        return json({ success: true });

    } catch (error) {
        console.error('Fel vid schemaläggning:', error);
        return json({ success: false, error: error.message }, { status: 500 });
    }
}
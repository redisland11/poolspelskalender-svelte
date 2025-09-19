// src/routes/api/schedule-notification/+server.js
import { json } from '@sveltejs/kit';
import { kv } from '@vercel/kv';
// Importera de nya funktionerna
import { toDate } from 'date-fns-tz';
import { getUnixTime } from 'date-fns';

export async function POST({ request }) {
    const { userKey, title, message, spelstopp } = await request.json();

    if (!userKey || !title || !message || !spelstopp) {
        return json({ success: false, error: 'Saknar data' }, { status: 400 });
    }

    try {
        const timeZone = 'Europe/Stockholm';
        
        // Konvertera `spelstopp` från svensk tid till ett korrekt Date-objekt
        const eventDate = toDate(spelstopp, { timeZone });

        // Beräkna när notisen ska skickas (5 min innan)
        const fiveMinutesInMillis = 5 * 60 * 1000;
        const notifyDate = new Date(eventDate.getTime() - fiveMinutesInMillis);
        
        // Konvertera till Unix timestamp i sekunder
        const notifyTimestamp = getUnixTime(notifyDate);

        // Säkerhetskoll
        const nowTimestamp = getUnixTime(new Date());
        if (notifyTimestamp <= nowTimestamp) {
            return json({ success: false, error: 'Spelstopp är för nära i tiden eller har redan passerat.' }, { status: 400 });
        }
        
        const uniqueId = Math.random().toString(36).substring(2, 9);
        const key = `pushover_notis:${notifyTimestamp}:${uniqueId}`;
        
        await kv.set(key, { userKey, title, message });

        return json({ success: true });

    } catch (error) {
        console.error('Fel vid schemaläggning:', error);
        return json({ success: false, error: error.message }, { status: 500 });
    }
}
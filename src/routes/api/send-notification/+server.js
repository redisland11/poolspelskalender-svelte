// src/routes/api/send-notification/+server.js
import { json } from '@sveltejs/kit';
import { PUSHOVER_API_TOKEN } from '$env/static/private';

export async function POST({ request }) {
    const { userKey, title, message, spelstopp } = await request.json();

    if (!userKey || !title || !message || !spelstopp) {
        return json({ success: false, error: 'Saknar data' }, { status: 400 });
    }

    // --- NY, ROBUST LOGIK FÖR TIDSBERÄKNING ---
    // 1. Plocka isär tidsträngen i sina beståndsdelar.
    // Exempel: "2025-09-19 18:00"
    const [datePart, timePart] = spelstopp.split(' '); // ["2025-09-19", "18:00"]
    const [year, month, day] = datePart.split('-').map(Number); // [2025, 9, 19]
    const [hours, minutes] = timePart.split(':').map(Number); // [18, 0]

    // 2. Skapa ett datumobjekt. VIKTIGT: Vi använder Date.UTC() för att skapa ett
    //    datum i UTC, vilket ignorerar serverns lokala tidszon.
    //    Månaden i JavaScript är 0-indexerad (Jan=0), så vi måste dra av 1.
    const eventTimestampUTC = Date.UTC(year, month - 1, day, hours, minutes);

    // 3. Justera för svensk tidszon (CEST är UTC+2). Vi drar bort 2 timmar
    //    för att få den korrekta tiden i UTC.
    const cestOffsetInMillis = 2 * 60 * 60 * 1000;
    const correctEventTimestamp = eventTimestampUTC - cestOffsetInMillis;

    // 4. Beräkna när notisen ska skickas (5 min innan), i sekunder (Unix timestamp)
    const fiveMinutesInMillis = 5 * 60 * 1000;
    const notifyTimestamp = Math.floor((correctEventTimestamp - fiveMinutesInMillis) / 1000);

    // 5. Säkerhetskoll: Skicka inte om den beräknade tiden redan har passerat.
    const nowTimestamp = Math.floor(Date.now() / 1000);
    if (notifyTimestamp <= nowTimestamp) {
        return json({ success: false, error: 'Spelstopp är för nära i tiden eller har redan passerat.' }, { status: 400 });
    }
    // --- SLUT PÅ NY LOGIK ---

    const pushoverResponse = await fetch("https://api.pushover.net/1/messages.json", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            token: PUSHOVER_API_TOKEN,
            user: userKey,
            title: title,
            message: message,
            timestamp: notifyTimestamp // Använd vår nyss beräknade, korrekta timestamp
        })
    });

    if (pushoverResponse.ok) {
        return json({ success: true });
    } else {
        const errorData = await pushoverResponse.json();
        console.error('Pushover API Error:', errorData);
        return json({ success: false, error: 'Pushover API misslyckades' }, { status: 500 });
    }
}
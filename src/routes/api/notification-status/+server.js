// src/routes/api/notification-status/+server.js
import { createClient } from '@vercel/kv'; // Ändrad import
import { env } from '$env/dynamic/private'; // Ändrad import
import { json } from '@sveltejs/kit';

export async function GET() {
    // Manuell anslutning till databasen
    const kv = createClient({
        url: env.REDIS_URL
    });

	try {
		const keys = await kv.keys('notis:*');
		const ids = keys.map((key) => key.replace('notis:', ''));
		return json({ success: true, scheduledIds: ids });
	} catch (error) {
		console.error('KV GET Error:', error);
		return json({ success: false, error: 'Kunde inte hämta status' }, { status: 500 });
	}
}

export async function POST({ request }) {
    // Manuell anslutning till databasen
    const kv = createClient({
        url: env.REDIS_URL
    });

	const { drawNumber } = await request.json();
	if (!drawNumber) {
		return json({ success: false, error: 'Inget drawNumber angivet' }, { status: 400 });
	}

	try {
		await kv.set(`notis:${drawNumber}`, 1);
		return json({ success: true });
	} catch (error) {
		console.error('KV SET Error:', error);
		return json({ success: false, error: 'Kunde inte spara status' }, { status: 500 });
	}
}
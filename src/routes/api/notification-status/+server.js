// src/routes/api/notification-status/+server.js
import { kv } from '@vercel/kv';
import { json } from '@sveltejs/kit';

// Denna funktion körs när appen frågar "Vilka spel har påminnelser?"
export async function GET() {
	try {
		// Hämta alla nycklar som börjar med "notis:"
		const keys = await kv.keys('notis:*');
		// Plocka ut bara själva ID:t från varje nyckel
		const ids = keys.map((key) => key.replace('notis:', ''));
		return json({ success: true, scheduledIds: ids });
	} catch (error) {
		console.error('KV GET Error:', error);
		return json({ success: false, error: 'Kunde inte hämta status' }, { status: 500 });
	}
}

// Denna funktion körs när en användare klickar på "Påminn mig"-knappen
export async function POST({ request }) {
	const { drawNumber } = await request.json();
	if (!drawNumber) {
		return json({ success: false, error: 'Inget drawNumber angivet' }, { status: 400 });
	}

	try {
		// Spara spelets ID i databasen med en "notis:"-prefix.
		// Vi sätter värdet till 1, men det spelar ingen roll vad det är.
		await kv.set(`notis:${drawNumber}`, 1);
		return json({ success: true });
	} catch (error) {
		console.error('KV SET Error:', error);
		return json({ success: false, error: 'Kunde inte spara status' }, { status: 500 });
	}
}
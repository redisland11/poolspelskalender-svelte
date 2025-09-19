import { createClient } from 'redis';
import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';

export async function GET() {
    const client = createClient({ url: env.REDIS_URL });
    await client.connect();

	try {
		const keys = await client.keys('notis:*');
		const ids = keys.map((key) => key.replace('notis:', ''));
        await client.quit();
		return json({ success: true, scheduledIds: ids });
	} catch (error) {
        await client.quit();
		console.error('Redis GET Error:', error);
		return json({ success: false, error: 'Kunde inte hämta status' }, { status: 500 });
	}
}

export async function POST({ request }) {
    const client = createClient({ url: env.REDIS_URL });
    await client.connect();

	const { drawNumber } = await request.json();
	if (!drawNumber) {
        await client.quit();
		return json({ success: false, error: 'Inget drawNumber angivet' }, { status: 400 });
	}

	try {
		await client.set(`notis:${drawNumber}`, '1');
        await client.quit();
		return json({ success: true });
	} catch (error) {
        await client.quit();
		console.error('Redis SET Error:', error);
		return json({ success: false, error: 'Kunde inte spara status' }, { status: 500 });
	}
}
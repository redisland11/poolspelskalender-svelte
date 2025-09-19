// src/routes/api/debug-env/+server.js
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function GET() {
    console.log('--- TILLGÄNGLIGA MILJÖVARIABLER ---');
    console.log(env);
    console.log('--- SLUT PÅ LISTA ---');

    // Av säkerhetsskäl skickar vi bara tillbaka namnen på nycklarna, inte deras värden.
    const availableKeys = Object.keys(env);

    return json({
        message: 'Detta är en lista på namnen på alla tillgängliga privata miljövariabler.',
        keys: availableKeys
    });
}
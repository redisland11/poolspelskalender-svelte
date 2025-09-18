// src/lib/api.js

const spelInfoMap = {
    "bomben": { name: "Bomben", company: "SvS", color: "#bb010c" },
    "challenge": { name: "Challenge", company: "SvS", color: "#cb898d" },
    "europatipset": { name: "Europatipset", company: "SvS", color: "#008733" },
    "fulltraff": { name: "Fullträff", company: "SvS", color: "#660099" },
    "matchen": { name: "Matchen", company: "SvS", color: "#cb898d" },
    "maltipset": { name: "Måltipset", company: "SvS", color: "#afc7e1" },
    "powerplay": { name: "Powerplay", company: "SvS", color: "#bb010c" },
    "stryktipset": { name: "Stryktipset", company: "SvS", color: "#00427a" },
    "topptipsetfamily": { name: "Topptipset", company: "SvS", color: "#f29400" },
    "big9": { name: "Big9", company: "ATG", color: "#014f9f" },
    "DD": { name: "DD", company: "ATG", color: "#62ade0" },
    "V4": { name: "V4", company: "ATG", color: "#62ade0" },
    "V5": { name: "V5", company: "ATG", color: "#62ade0" },
    "V64": { name: "V64", company: "ATG", color: "#ea6111" },
    "V65": { name: "V65", company: "ATG", color: "#c00a26" },
    "V75": { name: "V75", company: "ATG", color: "#17448f" },
    "V86": { name: "V86", company: "ATG", color: "#7b277a" },
};

const sportIdMap = {
    1: 'Fotboll', 2: 'Ishockey', 3: 'Bandy', 0: 'Undefined', 58: 'Trav',
    15: 'Friidrott', 59: 'Galopp', 39: 'Baseboll', 4: 'Handboll', 8: 'Speedway',
    89: 'Amerikansk Fotboll', 7: 'Golf', 5: 'Innebandy', 17: 'Längdskidåkning',
    27: 'Skidskytte', 10: 'Basket'
};

function formatCurrency(num) {
    if (typeof num !== 'number' || isNaN(num)) return "0 kr";
    return new Intl.NumberFormat('sv-SE', {
        style: 'currency',
        currency: 'SEK',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num);
}

function getDayName(date) {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Idag";
    if (date.toDateString() === tomorrow.toDateString()) return "Imorgon";

    const options = { weekday: 'long' };
    let dayName = new Intl.DateTimeFormat('sv-SE', options).format(date);
    return dayName.charAt(0).toUpperCase() + dayName.slice(1);
}

async function fetchSvsGames(gameType) {
    try {
        const url = `https://api.www.svenskaspel.se/external/1/draw/${gameType}/draws?accesskey=edd0a834-7e99-4c15-8603-bb320ff48967`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        if (!data.draws) return [];

        return data.draws.map(draw => {
            let extraAmount = 0;
            if (draw.jackpotItems && draw.jackpotItems.length > 0) {
                extraAmount = draw.jackpotItems.reduce((sum, item) => sum + item.amount, 0);
            } else if (draw.fund) {
                const rollover = parseFloat(draw.fund.rolloverIn?.replace(',', '.') || 0);
                const extra = parseFloat(draw.fund.extraMoney?.replace(',', '.') || 0);
                extraAmount = rollover + extra;
            }

            return {
                spel: draw.productName,
                spelURL: gameType,
                sport: draw.sport || sportIdMap[draw.sportId] || 'Okänd',
                spelstopp: draw.closeTime.replace('T', ' ').substring(0, 16),
                omsattningNum: parseFloat(draw.turnover?.replace(',', '.') || 0),
                extraNum: extraAmount,
                drawNumber: draw.drawNumber,
                source: 'SvS',
                color: spelInfoMap[gameType]?.color || '#ccc'
            };
        });
    } catch (error) {
        console.error(`Kunde inte hämta data för ${gameType}:`, error);
        return [];
    }
}

async function fetchAtgRacingGames() {
    let games = [];
    for (let i = 0; i < 4; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];

        try {
            const url = `https://www.atg.se/services/racinginfo/v1/api/calendar/day/${dateString}`;
            const response = await fetch(url);
            if (!response.ok) continue;
            const data = await response.json();
            
            if (data.games && Array.isArray(data.games)) {
                for (const game of data.games) {
                    const gameType = game.id.split('_')[0];
                    const track = data.tracks.find(t => t.id === game.tracks[0]);
                    
                    games.push({
                        spel: gameType,
                        spelURL: gameType,
                        sport: track?.sport === 'trot' ? 'Trav' : 'Galopp',
                        spelstopp: game.scheduledStartTime.replace('T', ' ').substring(0, 16),
                        omsattningNum: 0,
                        extraNum: game.jackpotAmount || 0,
                        drawNumber: game.id,
                        source: 'ATG',
                        color: spelInfoMap[gameType]?.color || '#ccc'
                    });
                }
            }
        } catch (error) {
            console.error(`Kunde inte hämta ATG travdata för ${dateString}:`, error);
        }
    }
    return games;
}

async function fetchAtgBig9Game() {
    try {
        const url = "https://www.atg.se/services/sports-info-offering/api/v1/offering?status=SELL_OPEN";
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        if (!data || data.gameType !== "Big9") return [];

        const startTime = new Date(data.startTime);

        return [{
            spel: "Big 9",
            spelURL: "big9",
            sport: "Fotboll",
            spelstopp: startTime.toLocaleString('sv-SE').substring(0, 16),
            omsattningNum: (data.pool?.turnover || 0) / 100,
            extraNum: (data.pool?.jackpotAmount || 0) / 100,
            drawNumber: data.serialNumber,
            source: 'ATG',
            color: spelInfoMap.big9.color
        }];
    } catch (error) {
        console.error('Kunde inte hämta Big9-data:', error);
        return [];
    }
}

export async function fetchAllGames(selectedGames) {
    const promises = [];
    const atgRacingGames = ["V75", "V64", "V65", "V86", "V5", "V4", "DD"];

    if (selectedGames.some(g => atgRacingGames.includes(g))) {
        promises.push(fetchAtgRacingGames());
    }
    if (selectedGames.includes("big9")) {
        promises.push(fetchAtgBig9Game());
    }

    const svsGames = selectedGames.filter(g => spelInfoMap[g]?.company === 'SvS');
    for (const game of svsGames) {
        promises.push(fetchSvsGames(game));
    }

    const results = await Promise.all(promises);
    const allGamesRaw = results.flat().filter(game => game);

    const allGamesFormatted = allGamesRaw.map(game => ({
        ...game,
        omsättning: formatCurrency(game.omsattningNum),
        extra: formatCurrency(game.extraNum),
        isJackpot: game.extraNum > 0
    }));

    allGamesFormatted.sort((a, b) => new Date(a.spelstopp) - new Date(b.spelstopp));

    return allGamesFormatted;
}

// === HELA DENNA FUNKTION ÄR UPPDATERAD ===
export async function fetchGameDetails(game) {
    // Plocka ut värden från det inskickade spelobjektet
    let { source, spelURL, drawNumber, spel: productName } = game;
    
    try {
        let couponData = { header: {}, events: [] };

        // === NY LOGIK FÖR TOPPTIPSET ===
        // Om spelet är Topptipset, välj rätt API-slutpunkt baserat på produktnamnet
        if (source === 'SvS' && spelURL === 'topptipsetfamily') {
            if (productName.includes("Extra")) {
                spelURL = 'topptipseteuropa';
            } else if (productName.includes("Stryk")) {
                spelURL = 'topptipsetstryk';
            } else {
                spelURL = 'topptipset';
            }
        }
        // === SLUT PÅ NY LOGIK ===

        if (source === 'SvS') {
            const url = `https://api.www.svenskaspel.se/external/1/draw/${spelURL}/draws/${drawNumber}?accesskey=edd0a834-7e99-4c15-8603-bb320ff48967`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            couponData.header = {
                spel: data.draw.productName,
                spelstopp: data.draw.closeTime.replace('T', ' ').substring(0, 16),
                spelURL,
                drawNumber,
                source
            };
            
            couponData.events = data.draw.events.map(event => {
                const eventDate = new Date(event.sportEventStart);
                const time = eventDate.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
                return {
                    nr: event.eventNumber,
                    match: event.description,
                    tid: `${getDayName(eventDate)} ${time}`
                };
            });
        } else if (source === 'ATG' && spelURL === 'big9') {
            const url = `https://www.atg.se/services/sports-info-offering/api/v1/offering/serial/${drawNumber}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            couponData.header = {
                spel: "Big 9",
                spelstopp: new Date(data.startTime).toLocaleString('sv-SE').substring(0, 16),
                spelURL,
                drawNumber,
                source
            };
            
            couponData.events = data.matches.map(match => {
                const eventDate = new Date(match.startTime);
                const time = eventDate.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
                return {
                    nr: match.number,
                    match: `${match.homeTeam.shortName} - ${match.awayTeam.shortName}`,
                    tid: `${getDayName(eventDate)} ${time}`
                };
            });
        }
        else {
             couponData.header = { spel: productName, spelstopp: '', spelURL, drawNumber, source };
             couponData.events = [{nr: '', match: 'Detaljer för trav/galopp är ej implementerat.', tid: ''}];
        }
        
        return couponData;

    } catch (error) {
        console.error(`Kunde inte hämta detaljer för ${spelURL} (${drawNumber}):`, error);
        return { header: {}, events: [{nr: '', match: 'Kunde inte ladda omgångsinformation.', tid: ''}] };
    }
}
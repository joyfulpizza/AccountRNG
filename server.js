import express from "express";
import fetch from "node-fetch";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;
const CACHE_FILE = "./maxUserCache.json";
const ONE_DAY = 24 * 60 * 60 * 1000;

app.use(express.static("public"));

function loadCache() {
    if (!fs.existsSync(CACHE_FILE)) return null;
    return JSON.parse(fs.readFileSync(CACHE_FILE));
}

function saveCache(data) {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data));
}

async function fetchLatestUserId() {
    // Simple high probe
    const testId = 10000000000;
    try {
        const res = await fetch(`https://users.roblox.com/v1/users/${testId}`);
        if (res.status === 200) return testId;
    } catch {}
    return 6000000000;
}

async function getMaxUserId() {
    const cache = loadCache();
    if (cache && Date.now() - cache.timestamp < ONE_DAY) {
        return cache.maxUserId;
    }

    const maxUserId = await fetchLatestUserId();
    saveCache({
        maxUserId,
        timestamp: Date.now()
    });

    return maxUserId;
}

function isSpecial(id) {
    return /^10+$/.test(id.toString());
}

function getRarity(id) {
    if (isSpecial(id)) {
        return { name: "⭐ SPECIAL", color: "gold" };
    }

    const roll = Math.random();

    if (roll < 0.00001) return { name: "MYTHICAL", color: "purple" };
    if (roll < 0.0001) return { name: "LEGENDARY", color: "orange" };
    if (roll < 0.001) return { name: "UNUSUAL", color: "blue" };
    if (roll < 0.01) return { name: "RARE", color: "green" };
    return { name: "COMMON", color: "gray" };
}

app.get("/roll", async (req, res) => {
    const maxUserId = await getMaxUserId();
    const rolledId = Math.floor(Math.random() * maxUserId) + 1;
    const rarity = getRarity(rolledId);

    res.json({
        id: rolledId,
        rarity: rarity.name,
        color: rarity.color
    });
});

app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});

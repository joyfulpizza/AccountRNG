import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(express.json());

let leaderboard = []; // stored in memory

function isSpecial(id) {
    return /^10+$/.test(id.toString());
}

function getRarity(id) {
    if (isSpecial(id)) {
        return { name: "⭐ SPECIAL", color: "gold", score: 1000 };
    }

    const roll = Math.random();

    if (roll < 0.00001) return { name: "MYTHICAL", color: "purple", score: 500 };
    if (roll < 0.0001) return { name: "LEGENDARY", color: "orange", score: 250 };
    if (roll < 0.001) return { name: "UNUSUAL", color: "blue", score: 100 };
    if (roll < 0.01) return { name: "RARE", color: "green", score: 50 };
    return { name: "COMMON", color: "gray", score: 10 };
}

async function getUserData(userId) {
    try {
        const userRes = await fetch(`https://users.roblox.com/v1/users/${userId}`);
        if (userRes.status !== 200) return null;
        const userData = await userRes.json();

        const avatarRes = await fetch(
            `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`
        );
        const avatarData = await avatarRes.json();
        const avatarUrl = avatarData.data[0].imageUrl;

        return { name: userData.name, avatar: avatarUrl };
    } catch {
        return null;
    }
}

app.post("/roll", async (req, res) => {
    const { nickname } = req.body;
    let userData = null;
    let rolledId;

    while (!userData) {
        rolledId = Math.floor(Math.random() * 6000000000) + 1;
        userData = await getUserData(rolledId);
    }

    const rarity = getRarity(rolledId);

    // Update leaderboard (keep best score per nickname)
    const existing = leaderboard.find(p => p.nickname === nickname);
    if (!existing || rarity.score > existing.score) {
        leaderboard = leaderboard.filter(p => p.nickname !== nickname);
        leaderboard.push({
            nickname,
            score: rarity.score,
            rarity: rarity.name
        });

        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 10);
    }

    res.json({
        id: rolledId,
        name: userData.name,
        avatar: userData.avatar,
        rarity: rarity.name,
        color: rarity.color
    });
});

app.get("/leaderboard", (req, res) => {
    res.json(leaderboard);
});

app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});

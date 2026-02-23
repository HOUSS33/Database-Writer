const express = require('express');
const mqtt = require('mqtt');
const cors = require('cors');

const app = express();
app.use(cors()); // Très important pour autoriser React à appeler le serveur

// On garde les 200 derniers points en mémoire pour le graphique
let vibrationHistory = [];
let currentIndex = 0;

// Connexion au broker MQTT
const client = mqtt.connect("wss://broker.emqx.io:8084/mqtt");

client.on('connect', () => {
    console.log("✅ Backend connecté au MQTT");
    client.subscribe("upride/motor/01/data");
});

client.on('message', (topic, message) => {
    try {
        const parsed = JSON.parse(message.toString());
        const v = Number(parsed.vibration) || 0;

        // On crée le point avec le même format que React {x, y}
        const newPoint = { x: currentIndex, y: v };
        
        vibrationHistory.push(newPoint);
        currentIndex++;

        // On limite l'historique à 200 points pour ne pas saturer
        if (vibrationHistory.length > 200) {
            vibrationHistory.shift();
        }
    } catch (e) {
        console.error("Erreur parsing MQTT:", e);
    }
});

// ROUTE API : C'est ce que ton React appelle au chargement
app.get('/api/vibration/history', (req, res) => {
    console.log("-----------------------------------------");
    console.log("📊 API APPELÉE : Récupération de l'historique");
    console.log(`📈 Nombre de points envoyés : ${vibrationHistory.length}`);
    
    if (vibrationHistory.length > 0) {
        console.log(`📍 Premier point (x) : ${vibrationHistory[0].x}`);
        console.log(`📍 Dernier point (x) : ${vibrationHistory[vibrationHistory.length - 1].x}`);
    } else {
        console.log("⚠️ L'historique est vide pour le moment (en attente de MQTT...)");
    }
    console.log("-----------------------------------------");

    res.json(vibrationHistory);
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur API prêt sur http://localhost:${PORT}`);
});
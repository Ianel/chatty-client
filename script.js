import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

const chatInput = document.querySelector("#chat-input");
const sendBtn = document.querySelector("#send-button");
const chatBox = document.querySelector("#chat-box");
const sessionList = document.querySelector("#session-list");
const newSessionButton = document.querySelector("#new-session-button");

//const API_URL = "https://chatty-server-fy92.onrender.com/content";

const API_URL = "http://localhost:3000/content";

// Stocker le sessionId pour maintenir la mémoire de la conversation
let sessionId = null;

const appendMessage = (message, speaker) => {
    const messageElement = document.createElement("div");
    messageElement.innerHTML = `<div>${marked.parse(message)}</div>`;
    messageElement.classList.add("message");
    speaker == "user"
        ? messageElement.classList.add("sent")
        : messageElement.classList.add("received");
    chatBox.append(messageElement);
    window.scrollTo(0, document.body.scrollHeight);
};

const getResponse = async (prompt) => {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, sessionId }), // Inclure le sessionId dans la requête
    });

    if (!response.ok) {
        throw new Error("Failed to get response");
    }

    const result = await response.json();

    // Mettre à jour le sessionId si ce n'est pas déjà défini
    if (!sessionId) {
        sessionId = result.sessionId;
    }

    return result.response; // Retourner la réponse générée par le bot
};

// Fonction pour démarrer une nouvelle session
const startNewSession = () => {
    sessionId = null; // Réinitialiser l'ID de la session
    chatBox.innerHTML = ""; // Réinitialiser la boîte de chat
    alert("Nouvelle session démarrée !");
    fetchSessions(); // Mettre à jour l'historique des sessions
};

// Fonction pour récupérer l'historique des sessions
const fetchSessions = async () => {
    try {
        const response = await fetch("http://localhost:3000/sessions");
        if (!response.ok) {
            throw new Error("Failed to fetch sessions");
        }
        const result = await response.json();
        if (result.success) {
            updateSessionList(result.sessions);
        }
    } catch (error) {
        console.error("Error fetching sessions:", error);
    }
};

// Fonction pour récupérer les messages d'une session
const fetchMessages = async (sessionId) => {
    try {
        const response = await fetch(
            `http://localhost:3000/sessions/${sessionId}/messages`
        );
        if (!response.ok) {
            throw new Error("Failed to fetch messages");
        }
        const result = await response.json();
        if (result.success) {
            displayMessages(result.messages);
        }
    } catch (error) {
        console.error("Error fetching messages:", error);
    }
};

// Afficher les messages dans la boîte de chat
const displayMessages = (messages) => {
    chatBox.innerHTML = ""; // Réinitialiser la boîte de chat
    messages.forEach((message) => {
        const messageElement = document.createElement("div");
        messageElement.classList.add("message");
        messageElement.classList.add(
            message.sender === "user" ? "sent" : "received"
        );
        messageElement.innerHTML = `<div>${marked.parse(
            message.message
        )}</div>`;
        chatBox.appendChild(messageElement);
    });
};

// Mettre à jour la liste des sessions dans la sidebar
const updateSessionList = (sessions) => {
    sessionList.innerHTML = "";
    sessions.forEach((session) => {
        const listItem = document.createElement("li");
        listItem.textContent = `Session - ${new Date(
            session.created_at
        ).toLocaleString()}`;
        listItem.addEventListener("click", () => {
            sessionId = session.session_id; // Charger cette session
            fetchMessages(session.session_id); // Charger les messages de la session
        });
        sessionList.appendChild(listItem);
    });
};

// Charger les sessions au démarrage
fetchSessions();

// Écouter le clic sur le bouton Nouvelle Session
newSessionButton.addEventListener("click", startNewSession);

sendBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const message = chatInput.value;

    if (!message) {
        alert("Veuillez entrer un message");
        return;
    }

    appendMessage(message, "user");
    chatInput.value = "";
    sendBtn.disabled = true;
    sendBtn.style.cursor = "not-allowed";
    sendBtn.innerHTML = "Envoi en cours...";

    try {
        const prompt = await getResponse(message);
        appendMessage(prompt, "bot");
    } catch (error) {
        console.error("Error:", error);
        alert("Une erreur est survenue lors de l'envoi du message.");
    } finally {
        sendBtn.disabled = false;
        sendBtn.style.cursor = "pointer";
        sendBtn.innerHTML = "Envoyer";
    }
});

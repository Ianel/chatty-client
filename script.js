import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

// Éléments DOM
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-button");
const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const newSessionButton = document.getElementById("new-session-button");
const toggleSidebar = document.getElementById("toggle-sidebar");
const closeSidebar = document.getElementById("close-sidebar");
const sidebar = document.getElementById("sidebar");
const mainContainer = document.getElementById("main-container");

// Configuration de l'API
const BASE_URL = "https://chatty.ophiris.com";

const API_URL = `${BASE_URL}/content`;

// Headers pour les requêtes
let headers = new Headers();

headers.append("Content-Type", "application/json");
headers.append("Accept", "application/json");

headers.append("Access-Control-Allow-Origin", "*");

// État de la session
let sessionId = null;

// ===== Fonctions de gestion du sidebar =====
function handleSidebarToggle() {
    if (window.innerWidth <= 768) {
        // En mode mobile, on ouvre/ferme complètement le sidebar
        sidebar.classList.toggle("open");
    } else {
        // En mode desktop, on collapse/expand le sidebar
        mainContainer.classList.toggle("sidebar-collapsed");
    }
}

function handleCloseSidebar() {
    if (window.innerWidth <= 768) {
        sidebar.classList.remove("open");
    }
}

// ===== Fonctions de chat =====
function appendMessage(message, speaker) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");

    if (speaker === "user") {
        messageElement.classList.add("sent");
        messageElement.innerHTML = `
            <div class="avatar">IT</div>
            <div class="content">${message}</div>
        `;
    } else {
        messageElement.classList.add("received");
        messageElement.innerHTML = `
            <div class="content">${marked.parse(message)}</div>
        `;
    }

    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function getResponse(prompt) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({ prompt, sessionId }),
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP! Statut: ${response.status}`);
        }

        const result = await response.json();

        // Mettre à jour le sessionId si ce n'est pas déjà défini
        if (!sessionId) {
            sessionId = result.sessionId;
        }

        return result.response;
    } catch (error) {
        console.error("Erreur lors de l'obtention de la réponse:", error);
        throw error;
    }
}

// ===== Fonctions de gestion des sessions =====
function startNewSession() {
    sessionId = null;
    chatBox.innerHTML = "";
    fetchSessions();

    // Fermer le sidebar en mode mobile après avoir créé une nouvelle session
    if (window.innerWidth <= 768) {
        handleCloseSidebar();
    }
}

async function fetchSessions() {
    try {
        const url = `${BASE_URL}/sessions`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP! Statut: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
            updateSessionList(result.sessions);
        }
    } catch (error) {
        console.error("Erreur lors de la récupération des sessions:", error);
    }
}

async function fetchMessages(selectedSessionId) {
    try {
        const response = await fetch(
            `${BASE_URL}/sessions/${selectedSessionId}/messages`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Erreur HTTP! Statut: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
            displayMessages(result.messages);
        }
    } catch (error) {
        console.error("Erreur lors de la récupération des messages:", error);
    }
}

function displayMessages(messages) {
    chatBox.innerHTML = "";

    messages.forEach((message) => {
        const messageElement = document.createElement("div");
        messageElement.classList.add("message");

        if (message.sender === "user") {
            messageElement.classList.add("sent");
            messageElement.innerHTML = `
                <div class="avatar">IT</div>
                <div class="content">${message.message}</div>
            `;
        } else {
            messageElement.classList.add("received");
            messageElement.innerHTML = `
                <div class="content">${marked.parse(message.message)}</div>
            `;
        }

        chatBox.appendChild(messageElement);
    });

    // Faire défiler jusqu'au dernier message
    chatBox.scrollTop = chatBox.scrollHeight;
}

function updateSessionList(sessions) {
    const sessionList = document.getElementById("session-list");
    sessionList.innerHTML = "";

    sessions.forEach((session) => {
        const listItem = document.createElement("li");
        listItem.classList.add("session-item");
        listItem.textContent = `Session - ${new Date(
            session.created_at
        ).toLocaleString()}`;

        listItem.addEventListener("click", () => {
            // Enlever la classe active de tous les items
            document.querySelectorAll(".session-item").forEach((item) => {
                item.classList.remove("active");
            });

            // Ajouter la classe active à l'item cliqué
            listItem.classList.add("active");
            sessionId = session.session_id;
            fetchMessages(session.session_id);

            // Fermer le sidebar en mode mobile après sélection d'une session
            if (window.innerWidth <= 768) {
                handleCloseSidebar();
            }
        });

        sessionList.appendChild(listItem);
    });
}

// ===== Initialisation et écouteurs d'événements =====
// Ajuster la hauteur du textarea automatiquement
chatInput.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";

    if (this.scrollHeight > 150) {
        this.style.height = "150px";
    }
});

// Écouteur pour le bouton d'envoi
chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();

    if (!message) {
        return;
    }

    appendMessage(message, "user");
    chatInput.value = "";
    chatInput.style.height = "auto";

    // Afficher l'état de chargement
    sendBtn.disabled = true;
    sendBtn.innerHTML = "<i class='fa-solid fa-spinner fa-spin'></i>";

    try {
        const response = await getResponse(message);
        appendMessage(response, "bot");
    } catch (error) {
        console.error("Erreur:", error);
        alert("Une erreur est survenue lors de l'envoi du message.");
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = "<i class='fa-solid fa-arrow-up'></i>";
    }
});

// Soumettre le formulaire avec Enter, nouvelle ligne avec Shift+Enter
chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
    }
});

// Écouteurs pour le sidebar
toggleSidebar.addEventListener("click", handleSidebarToggle);
closeSidebar.addEventListener("click", handleCloseSidebar);

// Écouteur pour nouvelle session
newSessionButton.addEventListener("click", startNewSession);

// Écouteur pour le redimensionnement de la fenêtre
window.addEventListener("resize", () => {
    // Réinitialiser l'état du sidebar lors du changement de taille
    if (window.innerWidth > 768) {
        sidebar.classList.remove("open");
        // Réinitialiser la position left au cas où
        sidebar.style.left = "";
    }
});

// Initialisation de l'application
window.addEventListener("DOMContentLoaded", () => {
    fetchSessions();
});

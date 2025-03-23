import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

// Get all the elements

const chatContainer = document.querySelector(".chat-container");
const chatInput = document.querySelector("#chat-input");
const sendBtn = document.querySelector("#send-button");
const chatBox = document.querySelector("#chat-box");

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
    const response = await fetch("http://localhost:3000/content", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
        throw new Error("Failed to get response");
    }

    const result = await response.text();

    return result;
};

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
    const prompt = await getResponse(message);
    console.log({ prompt });
    appendMessage(prompt, "bot");
    sendBtn.disabled = false;
    sendBtn.style.cursor = "pointer";
    sendBtn.innerHTML = "Envoyer";
});

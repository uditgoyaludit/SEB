// Fetch the API keys dynamically from a given URL
async function fetchApiKeys(url) {
  try {
      const response = await fetch(url);
      if (!response.ok) {
          throw new Error("Failed to fetch API keys");
      }
      const data = await response.text();
      // Split the response into an array of API keys (one per line)
      return data.split("\n").map(line => line.trim()).filter(key => key !== "");
  } catch (error) {
      console.error("Error fetching API keys:", error);
      return [];
  }
}

// Function to fetch the answer from AI with cycling API keys
window.fetchAnswerFromAI = async function(question) {
  const response = document.getElementById("response") || document.body;
  
  if (!question) {
      response.innerText = "Please enter a question.";
      return;
  }

  response.innerText = "Fetching answer...";

  // URL for fetching API keys (you need to specify your own URL)
  const apiKeysUrl = "https://cdn.jsdelivr.net/gh/uditgoyaludit/SEB/api.txt"; // Replace with actual URL
  const apiKeys = await fetchApiKeys(apiKeysUrl);

  if (apiKeys.length === 0) {
      response.innerText = "No API keys available.";
      return;
  }

  let aiResponse = null;
  let errorMessage = "";

  // Try each API key until we get a valid response
  for (const apiKey of apiKeys) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      try {
          const res = await fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  contents: [{ parts: [{ text: "(give answer only from given options) " + question }] }]
              })
          });

          const data = await res.json();
          aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

          if (aiResponse) {
              response.innerText = aiResponse;
              return; // Exit if we get a valid response
          }
      } catch (error) {
          errorMessage = error.message; // Store error message for later use
      }
  }

  // If all API keys fail
  response.innerText = aiResponse || "Error fetching AI response: " + errorMessage;
};

// DOM-dependent initialization
(function initAIHelper() {
  // Check if DOM is already loaded
  if (document.readyState === "complete" || document.readyState === "interactive") {
      setupUI();
  } else {
      document.addEventListener("DOMContentLoaded", setupUI);
  }

  function setupUI() {
      // Create AI Helper Box
      const aiBox = document.createElement("div");
      aiBox.innerHTML = `
          <div id="ai-helper" style="position: fixed; bottom: 20px; right: 20px; 
              background: white; padding: 10px; border: 1px solid black; 
              z-index: 9999; width: 300px; box-shadow: 0px 0px 10px rgba(0,0,0,0.2);">
              <input type="text" id="question" placeholder="Ask AI..." style="width: 90%;">
              <button id="ask-btn">Get Answer</button>
              <button id="hide-btn">Hide</button>
              <p id="response" style="font-size: 14px; margin-top: 10px;"></p>
              <div id="credit" style="font-size: 10px; text-align: center; margin-top: 10px; color: grey;">
                  Developed by UditGoyal
              </div>
          </div>
          <div id="unhide-helper" style="position: fixed; bottom: 10px; right: 10px; 
              background: transparent; border: none; 
              z-index: 9999; width: 12px; height: 12px; cursor: pointer;">
              <button id="unhide-btn" style="width: 100%; height: 100%; background: transparent; 
                  border: 1px solid black; border-radius: 50%; opacity: 0.3;">
              </button>
          </div>
      `;
      document.body.appendChild(aiBox);

      // Event Listeners
      document.getElementById("ask-btn").addEventListener("click", () => {
          const question = document.getElementById("question").value;
          fetchAnswerFromAI(question);
      });

      document.getElementById("hide-btn").addEventListener("click", () => {
          document.getElementById("ai-helper").style.display = "none";
      });

      document.getElementById("unhide-btn").addEventListener("click", () => {
          document.getElementById("ai-helper").style.display = "block";
      });

      // Context Menu Handler
      document.addEventListener("contextmenu", (event) => {
          const selectedText = window.getSelection().toString().trim();
          if (selectedText) {
              event.preventDefault();
              document.getElementById("question").value = selectedText;
              fetchAnswerFromAI(selectedText);
          }
      });

      // Middle-click Toggle
      document.addEventListener("mousedown", (event) => {
          if (event.button === 1) {
              const aiHelper = document.getElementById("ai-helper");
              aiHelper.style.display = aiHelper.style.display === "none" ? "block" : "none";
          }
      });
  }
})();

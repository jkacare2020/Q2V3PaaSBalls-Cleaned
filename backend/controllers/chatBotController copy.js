// Generate a bot response using GPT (or mock for now)
const { OpenAI } = require("openai");

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in your environment variables
});
console.log("gpt key:", process.env.OPENAI_API_KEY);
exports.sendMessage = async (req, res) => {
  try {
    const { userMessage } = req.body;
    if (!userMessage) {
      return res.status(400).json({ error: "User message is required" });
    }
    // Call GPT API
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Use the appropriate GPT model
      messages: [{ role: "user", content: userMessage }],
      max_tokens: 100,
    });

    const botResponse = response.choices[0].message.content;
    console.log("Bot Response:", botResponse);

    // Return bot's response to the frontend
    res.status(200).json({ botResponse });
  } catch (error) {
    console.error("Error in sendMessage:", error);
    res.status(500).json({ error: "Failed to process the request" });
  }
};

// Post a new chatbot interaction or query
exports.postLogs = async (req, res) => {
  try {
    const { userMessage } = req.body;
    if (!userMessage) {
      return res.status(400).json({ error: "User message is required" });
    }

    // Example GPT-like response logic
    const botResponse = `Echo: ${userMessage}`; // Replace with GPT API call

    const log = {
      id: Date.now().toString(), // Generate a unique ID
      userMessage,
      botResponse,
    };

    // Send back the log as a response
    res.status(201).json(log);
  } catch (error) {
    console.error("Error in postLogs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Retrieve a specific chatbot log by ID
exports.getLogs = (req, res) => {
  const { id } = req.params;
  // Fetch log by ID from database (mock for now)
  const log = { id, userMessage: "Hi", botResponse: "Hello!" }; // Example log
  res.status(200).json(log);
};

// Retrieve all chatbot logs
exports.getAllLogs = (req, res) => {
  // Fetch all logs from database (mock for now)
  const logs = [
    { id: "12345", userMessage: "Hi!", botResponse: "Hello!" },
    { id: "12346", userMessage: "What's up?", botResponse: "Not much, you?" },
  ];
  res.status(200).json(logs);
};

// Delete a chatbot log by ID
exports.deleteLog = (req, res) => {
  const { id } = req.params;
  // Delete log by ID from database (mock for now)
  res.status(200).json({ message: `Log with ID ${id} deleted.` });
};

exports.getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const chatLogs = await ChatbotLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(10);
    res.status(200).json(chatLogs);
  } catch (error) {
    console.error("Error retrieving chat logs:", error);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
};

const axios = require("axios");

exports.chat = async (req, res) => {
  try {
    const { message } = req.body;

    // Forward the request to the Python service
    const response = await axios.post("http://localhost:5000/chat", {
      message,
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error communicating with the chatbot service:", error);
    res.status(500).json({ error: "Failed to process the chatbot message." });
  }
};

//visionController.js----
const { OpenAI } = require("openai");
const admin = require("firebase-admin");
const { uploadImageAndGetUrl } = require("../utils/firebaseUpload");
const ChatbotLog = require("../models/chatBot/chatbotLog");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.compareImagesWithAI = async (req, res) => {
  try {
    const { prompt, uid } = req.body;
    const dirtyImage = req.files["dirty"]?.[0];
    const cleanedImage = req.files["cleaned"]?.[0];

    if (!dirtyImage || !cleanedImage || !uid || !prompt) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Upload images to Firebase Storage
    const [dirtyUrl, cleanedUrl] = await Promise.all([
      uploadImageAndGetUrl(dirtyImage, `vision/dirty-${Date.now()}`),
      uploadImageAndGetUrl(cleanedImage, `vision/cleaned-${Date.now()}`),
    ]);

    // ✅ Send to GPT-4 Turbo with vision
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo", // ✅ MUST use this — gpt-4-vision is deprecated
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dirtyUrl } },
            { type: "image_url", image_url: { url: cleanedUrl } },
          ],
        },
      ],
      max_tokens: 500,
    });

    const text = completion.choices[0].message.content;

    // Save log to MongoDB
    const sessionId = `vision-${uid}-${Date.now()}`;
    const log = new ChatbotLog({
      userId: uid,
      sessionId,
      query: prompt,
      response: { text },
      modelUsed: "gpt-4-turbo",
      imageUrls: [dirtyUrl, cleanedUrl],
      type: "vision",
    });
    await log.save();

    res.status(200).json({ result: { text }, sessionId });
  } catch (err) {
    console.error("compareImagesWithAI error:", err);
    res.status(500).json({ error: "Failed to analyze images." });
  }
};
//-----------------------------------------------------------
exports.detectBrandAndMaterial = async (req, res) => {
  try {
    const { uid, suggestionType = "care" } = req.body;
    const imageFile = req.file;

    if (!uid || !imageFile) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Upload to Firebase
    const imageUrl = await uploadImageAndGetUrl(
      imageFile,
      `vision/brand-${Date.now()}`
    );

    // ✨ Dynamic Prompt Based on suggestionType
    let prompt = `
Please analyze this image of a handbag.
Identify the brand (if visible) and the material type (e.g. leather, suede, canvas, faux leather).
Summarize the visual features like color, texture, and style.
`;

    if (suggestionType === "products") {
      prompt += `
Then recommend 1-3 real-world cleaning products (include product name, brand, and usage instructions) based on the material.
Respond in this JSON format:
{
  "brand": "...",
  "material": "...",
  "summary": "...",
  "suggestion": "...",
  "recommendedProducts": [
    {
      "name": "Lexol Leather Cleaner",
      "brand": "Lexol",
      "usage": "Gently rub with a soft cloth and wipe away residue."
    }
  ]
}
      `.trim();
    } else {
      prompt += `
Then provide care suggestions suitable for the detected material type (steps, precautions).
Respond in this JSON format:
{
  "brand": "...",
  "material": "...",
  "summary": "...",
  "suggestion": "..."
}
      `.trim();
    }

    // 🧠 Call GPT-4 Turbo with Vision
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 700,
    });

    let responseText = completion.choices[0]?.message?.content || "{}";

    // 🧼 Clean markdown wrappers if included
    responseText = responseText.replace(/```json|```/g, "").trim();

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (err) {
      console.error("❌ JSON parse error:", err);
      return res.status(500).json({ error: "AI returned malformed JSON." });
    }

    res.status(200).json(result);
  } catch (err) {
    console.error("detectBrandAndMaterial error:", err);
    res.status(500).json({ error: "Failed to process image." });
  }
};

// visionController.js
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

    const [dirtyUrl, cleanedUrl] = await Promise.all([
      uploadImageAndGetUrl(dirtyImage, `vision/dirty-${Date.now()}`),
      uploadImageAndGetUrl(cleanedImage, `vision/cleaned-${Date.now()}`),
    ]);

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
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

// const { OpenAI } = require("openai");
// const { uploadImageAndGetUrl } = require("../utils/firebaseUpload");

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// const { OpenAI } = require("openai");
// const { uploadImageAndGetUrl } = require("../utils/firebaseUpload");
// const ChatbotLog = require("../models/chatBot/chatbotLog");

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.detectBrandAndMaterial = async (req, res) => {
  try {
    const { uid, suggestionType = "care" } = req.body;
    const imageFile = req.file;

    if (!uid || !imageFile) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const imageUrl = await uploadImageAndGetUrl(
      imageFile,
      `vision/brand-${Date.now()}`
    );

    // Step 1: GPT-4 Turbo with Vision to analyze brand and material
    const prompt = `
You are a fashion and leather care specialist. Analyze this handbag image and respond strictly in this JSON format:
{
  "brand": "...",
  "material": "...",
  "summary": "...",
  "suggestion": "..."
}
    `.trim();

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
    responseText = responseText.replace(/```json|```/g, "").trim();

    let visionResult;
    try {
      visionResult = JSON.parse(responseText);
    } catch (err) {
      console.error("❌ JSON parse error from GPT-4 Vision:", err);
      return res.status(500).json({ error: "AI returned malformed JSON." });
    }

    const { brand, material, summary, suggestion } = visionResult;
    const result = {
      brand,
      material,
      summary,
      suggestion,
      suggestionType, // carry for frontend logic
      recommendedProducts: [],
      source: "gpt",
    };

    // Step 2: GPT-3.5 for product suggestions
    if (suggestionType === "products") {
      const productPrompt = `
List 2–3 of the best commercial cleaning products specifically made for cleaning ${material} handbags. For each product, include:
- name
- brand
- usage instructions
- where it's available (e.g., Amazon, Walmart)

Respond strictly in this JSON format:
{
  "recommendedProducts": [
    {
      "name": "Lexol Leather Cleaner",
      "brand": "Lexol",
      "usage": "Apply with a soft cloth and gently wipe clean.",
      "availability": "Available on Amazon and Walmart"
    }
  ]
}
      `.trim();

      const productCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: productPrompt }],
        max_tokens: 300,
      });

      let productText = productCompletion.choices[0]?.message?.content || "{}";
      productText = productText.replace(/```json|```/g, "").trim();

      try {
        const productJson = JSON.parse(productText);
        result.recommendedProducts = Array.isArray(
          productJson.recommendedProducts
        )
          ? productJson.recommendedProducts
          : [];
      } catch (err) {
        console.warn("⚠️ GPT-3.5 product JSON parse error:", err);
        result.recommendedProducts = [];
      }

      // Fallback if GPT-3.5 failed or returned nothing
      if (result.recommendedProducts.length === 0) {
        result.recommendedProducts = [
          {
            name: "Leather Honey Leather Cleaner",
            brand: "Leather Honey",
            usage:
              "Apply with a soft cloth. Gently rub over leather surface, then wipe off excess.",
            availability: "Available on Amazon and leatherhoney.com",
          },
          {
            name: "Chamberlain’s Leather Milk Cleaner and Conditioner",
            brand: "Chamberlain's",
            usage:
              "Use a soft pad to apply. Let sit for 10 minutes, then buff with a clean cloth.",
            availability: "Available on leathermilk.com and Amazon",
          },
          {
            name: "Cadillac Leather Cleaner",
            brand: "Cadillac",
            usage:
              "Spray directly on leather. Wipe gently with lint-free towel.",
            availability: "Available on Amazon and Walmart",
          },
        ];
        result.source = "fallback";
      }
    }

    // Save the session log
    const sessionId = `vision-${uid}-${Date.now()}`;
    await new ChatbotLog({
      userId: uid,
      sessionId,
      query: prompt,
      response: result,
      modelUsed:
        suggestionType === "products" ? "gpt-4 + gpt-3.5" : "gpt-4 only",
      imageUrls: [imageUrl],
      type: "vision",
    }).save();

    res.status(200).json(result);
  } catch (err) {
    console.error("❌ detectBrandAndMaterial error:", err);
    res.status(500).json({ error: "Failed to process image." });
  }
};

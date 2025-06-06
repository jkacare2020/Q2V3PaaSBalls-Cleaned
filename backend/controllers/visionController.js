// visionController.js
const { OpenAI } = require("openai");
const admin = require("firebase-admin");
const { uploadImageAndGetUrl } = require("../utils/firebaseUpload");
const ChatbotLog = require("../models/chatBot/chatbotLog");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const { priceMap, marketRanges } = require("../utils/priceMap");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// DO NOT put pricing logic here
// It belongs inside mapPriceEstimating()

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
      suggestionType,
      recommendedProducts: [],
      source: "gpt",
    };

    // Step 2: GPT-3.5 for product suggestions
    if (suggestionType === "products") {
      const productPrompt = `
You are a leather care expert. Based on the material "${material}", list 2–3 **real, commercially available** leather cleaning products.

Each must include:
- name
- brand
- usage instructions
- where it's available (e.g., Amazon, Walmart)

Respond strictly in this JSON format:
{
  "recommendedProducts": [
    {
      "name": "Leather Cleaner Name",
      "brand": "Brand Name",
      "usage": "How to apply",
      "availability": "Amazon / Walmart / leatherhoney.com"
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

      // Fallback list if GPT-3.5 fails
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

// visionController.js (continued)

// visionController.js

exports.mapProductsToBag = async (req, res) => {
  try {
    console.log("🛠️ mapProductsToBag triggered with:", req.body);

    const { material, stainType = "general", summary = "" } = req.body;

    if (!material) {
      return res.status(400).json({ error: "Missing material." });
    }

    // 🔍 Normalize material string for matching
    const normalizeMaterial = (raw) => {
      const val = raw.toLowerCase();
      if (val.includes("leather")) return "leather";
      if (val.includes("suede")) return "suede";
      return "unknown";
    };

    const normalizedMaterial = normalizeMaterial(material);
    const normalizedStain = stainType.toLowerCase();

    // 🧴 Define product mapping
    const productMap = {
      leather: {
        general: [
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
        ],
        dirt: [
          {
            name: "Chemical Guys Leather Cleaner",
            brand: "Chemical Guys",
            usage:
              "Spray lightly on dirty leather and wipe with microfiber towel.",
            availability: "Available on Amazon and chemicalguys.com",
          },
          {
            name: "Lexol Leather Deep Cleaner",
            brand: "Lexol",
            usage: "Apply to a cloth, scrub lightly, and wipe clean.",
            availability: "Available on Amazon and lexol.com",
          },
        ],
        mold: [
          {
            name: "Leather Master Mold Cleaner",
            brand: "Leather Master",
            usage: "Spray on leather, wait 10 minutes, then wipe clean.",
            availability: "Available on furnitureclinic.com and Amazon",
          },
          {
            name: "Furniture Clinic Leather Cleaner",
            brand: "Furniture Clinic",
            usage: "Apply using sponge. Work in circular motions. Wipe dry.",
            availability: "Available on furnitureclinic.com and Amazon",
          },
        ],
        oil: [
          {
            name: "Cadillac Leather Cleaner",
            brand: "Cadillac",
            usage: "Spray on leather. Wipe off oil with clean cloth.",
            availability:
              "Available on Amazon and cadillacboot.com,  cadillacshoe.com/",
          },
          {
            name: "Bickmore Bick 1 Leather Cleaner",
            brand: "Bickmore",
            usage: "Apply with soft cloth. Let sit, then wipe thoroughly.",
            availability: "Available on Amazon and bickmore.com",
          },
        ],
        ink: [
          {
            name: "Artman Ink Remover for Leather",
            brand: "Artman",
            usage: "Apply gently over ink mark and wipe with damp cloth.",
            availability: "Available on Amazon",
          },
          {
            name: "Furniture Clinic Leather Ink Remover",
            brand: "Furniture Clinic",
            usage:
              "Rub the stick directly on ink mark, wait 30 seconds, then wipe off.",
            availability: "Available on furnitureclinic.com and Amazon",
          },
          {
            name: "LeatherNova Ink & Stain Remover",
            brand: "LeatherNova",
            usage:
              "Apply a few drops to soft cloth, dab gently. Avoid rubbing.",
            availability: "Available on Amazon and leathernova.com",
          },
          {
            name: "Cadillac Select Leather Cleaner",
            brand: "Cadillac",
            usage:
              "Apply to ink area with soft cloth. Gently rub in circular motion. Wipe dry.",
            availability: "Available on Amazon and cadillacboot.com",
          },
          {
            name: "Weiman Leather Cleaner & Conditioner",
            brand: "Weiman",
            usage:
              "Spray onto leather surface, then wipe with microfiber cloth.",
            availability: "Available on Amazon, Walmart, and weiman.com",
          },
          {
            name: "COLOURLOCK Ballpoint Pen Remover",
            brand: "COLOURLOCK",
            usage:
              "Use sparingly. Dab gently with cotton cloth on ink marks. Do not rub hard.",
            availability: "Available on colourlock.com and Amazon",
          },
        ],
      },

      suede: {
        general: [
          {
            name: "Kiwi Suede and Nubuck Cleaner",
            brand: "Kiwi",
            usage: "Spray lightly on surface. Use suede brush to clean.",
            availability: "Available on Amazon and Target",
          },
        ],
        dirt: [
          {
            name: "Saphir Omni’Nettoyant Suede Cleaner",
            brand: "Saphir",
            usage: "Mix with water, scrub gently using brush. Air dry.",
            availability: "Available on Amazon and theshoemart.com",
          },
        ],
        mold: [
          {
            name: "Moneysworth & Best Suede & Nubuck Cleaner",
            brand: "Moneysworth & Best",
            usage: "Spray and scrub with suede brush. Let air dry.",
            availability: "Available on Amazon and Walmart",
          },
        ],
        oil: [
          {
            name: "Jason Markk Suede Cleaning Kit",
            brand: "Jason Markk",
            usage: "Use cleaner and brush gently to lift oil stains.",
            availability: "Available on jasonmarkk.com and Amazon",
          },
        ],
        ink: [], // add if needed
      },
    };

    const products =
      productMap[normalizedMaterial]?.[normalizedStain] ||
      productMap[normalizedMaterial]?.general ||
      [];

    console.log("🧴 Mapped products for:", {
      normalizedMaterial,
      normalizedStain,
      found: products.length,
    });

    return res.status(200).json({
      material,
      stainType,
      summary,
      recommendedProducts: products,
    });
  } catch (err) {
    console.error("mapProductsToBag error:", err);
    res.status(500).json({ error: "Failed to map products." });
  }
};
//----------------Estimate price--------------------------------------------

exports.mapPriceEstimating = async (req, res) => {
  try {
    const imageFile = req.file;
    if (!imageFile) {
      return res.status(400).json({ error: "Image is required." });
    }

    const imageUrl = await uploadImageAndGetUrl(
      imageFile,
      `vision/price-${Date.now()}`
    );

    const prompt = `
You are an expert in analyzing handbag stain areas. Given the uploaded image of a handbag, your task is to:
1. Identify all major visible stains.
2. For each stain, return:
   - zone (e.g., front, side, handle)
   - x and y coordinates (in pixels)
   - approximate radius (in pixels)
3. Format your response as JSON:
{
  "material": "...",
  "stainType": "...",
  "stainCount": ...,
  "stainLocations": ["..."],
  "stainCoordinates": [
    { "x": ..., "y": ..., "radius": ..., "zone": "..." },
    ...
  ]
}
Only include real stains based on visible evidence.
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
      max_tokens: 500,
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    console.log("📦 GPT raw response:", raw);
    console.log("📦 GPT raw response:", completion.choices[0].message.content);

    const responseText = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(responseText);

    const material = parsed.material?.toLowerCase() || "unknown";
    const stainType = parsed.stainType?.toLowerCase() || "general";
    const stainCount = parseInt(parsed.stainCount) || 1;
    const stainLocations = Array.isArray(parsed.stainLocations)
      ? parsed.stainLocations
      : [];

    const rule = priceMap[material]?.[stainType] || {
      base: 20,
      multiplier: 1.0,
    };
    const consumerPrice = Math.round(
      rule.base + stainCount * rule.multiplier * 5
    );
    const merchantPrice = Math.round(consumerPrice * 0.8);
    const marketRange = marketRanges[material] || { low: 35, high: 70 };

    return res.status(200).json({
      material,
      stainType,
      stainCount,
      stainLocations: parsed.stainLocations || [],
      cleaningInstructions: parsed.cleaningInstructions || [],
      consumerPrice,
      merchantPrice,
      marketRange,
    });
  } catch (err) {
    console.error("❌ mapPriceEstimating error:", err);
    return res.status(500).json({ error: "Failed to estimate price." });
  }
};

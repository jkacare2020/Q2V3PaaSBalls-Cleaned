// const { OpenAI } = require("openai");
// const { uploadFileToStorage } = require("../utils/firebaseUpload");
// const ChatbotLog = require("../models/chatBot/chatbotLog"); // your Mongoose model
// const admin = require("../config/firebaseAdmin");

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// exports.analyzeCleaning = async (req, res) => {
//   try {
//     const file = req.file;
//     const token = req.headers.authorization?.split("Bearer ")[1];

//     if (!token) return res.status(401).json({ error: "Missing token" });

//     const decodedToken = await admin.auth().verifyIdToken(token);
//     const userId = decodedToken.uid;

//     if (!file) return res.status(400).json({ error: "Image file is required" });

//     // ✅ Upload to Firebase Storage
//     const publicUrl = await uploadFileToStorage(file, "vision-uploads");

//     // ✅ GPT-4 Vision call
//     const response = await openai.chat.completions.create({
//       model: "gpt-4-vision-preview",
//       messages: [
//         {
//           role: "user",
//           content: [
//             {
//               type: "text",
//               text: "Analyze this image for cleanliness. Is it clean or dirty? Describe stains or damage.",
//             },
//             { type: "image_url", image_url: { url: publicUrl } },
//           ],
//         },
//       ],
//       max_tokens: 1000,
//     });

//     const botResponse = response.choices[0].message.content;

//     // ✅ Log to MongoDB
//     const logEntry = new ChatbotLog({
//       userId,
//       sessionId: `vision-${userId}-${Date.now()}`,
//       query: "Image uploaded for AI cleaning analysis",
//       response: botResponse,
//       imageUrl: publicUrl,
//       source: "vision", // optional tag for filtering
//       timestamp: new Date(),
//     });

//     await logEntry.save();

//     res.status(200).json({ result: botResponse });
//   } catch (err) {
//     console.error("GPT Vision error:", err);
//     res.status(500).json({ error: "Failed to process GPT-4 Vision request" });
//   }
// };
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

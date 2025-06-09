const admin = require("../config/firebaseAdmin");
const db = admin.firestore(); // if not already exposed

const fetch = require("node-fetch");

exports.logTry = async (req, res) => {
  try {
    const { itemType, score, timestamp, userAgent } = req.body;
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

    // Call IP geolocation API (using ipapi.co)
    let geo = {};
    try {
      const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
      if (geoRes.ok) geo = await geoRes.json();
    } catch (err) {
      console.warn("Geo lookup failed:", err.message);
    }

    const tryData = {
      itemType,
      score,
      timestamp,
      userAgent,
      ip,
      location: {
        city: geo.city || null,
        region: geo.region || null,
        country: geo.country_name || null,
        org: geo.org || null,
      },
      createdAt: new Date(),
    };

    await db.collection("tryLogs").add(tryData);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Try logging failed:", err);
    res.status(500).json({ error: "Failed to log try event" });
  }
};

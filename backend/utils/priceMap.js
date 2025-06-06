// /backend/utils/priceMap.js

module.exports = {
  priceMap: {
    leather: {
      general: { base: 25, multiplier: 1.0 },
      mold: { base: 25, multiplier: 2.0 },
      dirt: { base: 25, multiplier: 1.3 },
      oil: { base: 25, multiplier: 1.8 },
      ink: { base: 25, multiplier: 1.6 },
    },
    suede: {
      general: { base: 30, multiplier: 1.0 },
      mold: { base: 30, multiplier: 2.0 },
      dirt: { base: 30, multiplier: 1.4 },
      oil: { base: 30, multiplier: 1.7 },
      ink: { base: 30, multiplier: 1.5 },
    },
    canvas: {
      general: { base: 20, multiplier: 1.0 },
      dirt: { base: 20, multiplier: 1.3 },
      ink: { base: 20, multiplier: 1.4 },
      oil: { base: 20, multiplier: 1.6 },
    },
  },

  marketRanges: {
    leather: { low: 40, high: 80 },
    suede: { low: 45, high: 90 },
    canvas: { low: 30, high: 60 },
  },
};

// A curated palette of vibrant, complementary colors
const colorPalette = [
  "from-cyan-500",
  "from-blue-600",
  "from-purple-700",
  "from-pink-500",
  "from-red-500",
  "from-orange-500",
  "from-yellow-500",
  "from-green-500",
  "from-teal-500",
];

// A set of "via" colors to ensure smooth transitions
const viaPalette = [
  "via-blue-600",
  "via-purple-600",
  "via-pink-600",
  "via-red-600",
  "via-orange-600",
  "via-yellow-600",
  "via-green-600",
  "via-teal-600",
  "via-cyan-600",
];

// A set of "to" colors for the end of the gradient
const toPalette = [
  "to-purple-700",
  "to-pink-700",
  "to-red-700",
  "to-orange-700",
  "to-yellow-700",
  "to-green-700",
  "to-teal-700",
  "to-cyan-700",
  "to-blue-700",
];

export const generateRandomGradient = () => {
  // Function to get a random item from an array
  const getRandom = (arr: string[]) =>
    arr[Math.floor(Math.random() * arr.length)];

  // Randomize animation duration between 15 and 25 seconds
  const duration = 15 + Math.random() * 10;

  return {
    fromColor: getRandom(colorPalette),
    viaColor: getRandom(viaPalette),
    toColor: getRandom(toPalette),
    duration,
  };
};

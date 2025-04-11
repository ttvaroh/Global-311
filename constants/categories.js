// Preset categories for pin classification
export const PRESET_CATEGORIES = [
  {
    id: "pot",
    name: "Pothole",
    icon: "🕳️",
  },
  {
    id: "const",
    name: "Construction",
    icon: "🚧",
  },
  {
    id: "flood",
    name: "Flooding",
    icon: "💧",
  },
  {
    id: "acc",
    name: "Accident Prone Area",
    icon: "⚠️",
  },
  {
    id: "road",
    name: "Road Closure",
    icon: "🚫",
  },
  {
    id: "light",
    name: "Broken Street Light",
    icon: "💡",
  },
  {
    id: "sign",
    name: "Missing/Damaged Sign",
    icon: "🪧",
  },
  {
    id: "debris",
    name: "Debris/Fallen Tree",
    icon: "🌳",
  },
  {
    id: "park",
    name: "Parking Issue",
    icon: "🅿️",
  },
  {
    id: "other",
    name: "Other",
    icon: "❓",
  },
];

// Function to get category by ID
export const getCategoryById = (id) => {
  return (
    PRESET_CATEGORIES.find((category) => category.id === id) ||
    PRESET_CATEGORIES[PRESET_CATEGORIES.length - 1]
  ); // Default to "Other"
};

// Function to get category icon by ID
export const getCategoryIcon = (id) => {
  const category = getCategoryById(id);
  return category.icon;
};

export const EDITOR_FONTS = [
  "Inter",
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Palatino",
  "Garamond",
  "Bookman",
  "Comic Sans MS",
  "Trebuchet MS",
  "Arial Black",
  "Impact",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Oswald",
  "Source Sans Pro",
  "Slabo 27px",
  "Raleway",
  "PT Sans",
  "Merriweather",
  "Nunito",
  "Concert One",
  "Prompt",
  "Work Sans",
  "Fira Sans",
  "Quicksand",
  "Ubuntu",
  "Rubik",
  "Karla",
  "Lora",
  "Playfair Display",
  "Mukta",
  "Inconsolata",
  "Bitter",
  "Anton",
  "Dosis",
  "Oxygen",
  "Cabin",
  "Hind",
  "Arimo",
  "Space Grotesk",
  "Instrument Serif",
  "JetBrains Mono",
  "Fira Code"
];

export const EDITOR_FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 44, 48, 54, 60, 66, 72, 74];

const WEB_SAFE_FONTS = ["Arial", "Helvetica", "Times New Roman", "Courier New", "Georgia", "Palatino", "Garamond", "Bookman", "Comic Sans MS", "Trebuchet MS", "Arial Black", "Impact"];

// Helper to inject a font if it's a Google Font
export function loadGoogleFont(fontFamily: string) {
  const id = `google-font-${fontFamily.replace(/\s+/g, "-").toLowerCase()}`;
  if (document.getElementById(id)) return;

  if (WEB_SAFE_FONTS.includes(fontFamily)) return;

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, "+")}:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap`;
  document.head.appendChild(link);
}

// Batch load all fonts to ensure dropdown previews work
let allFontsLoaded = false;
export function preloadAllGoogleFonts() {
  if (allFontsLoaded) return;
  allFontsLoaded = true;

  const googleFonts = EDITOR_FONTS.filter(f => !WEB_SAFE_FONTS.includes(f));
  
  // To avoid hitting URL length limits, we chunk them into a few requests if necessary,
  // but ~30 fonts is perfectly fine in one URL.
  const families = googleFonts.map(f => `family=${f.replace(/\s+/g, "+")}:wght@400;500;600;700`).join("&");
  
  const link = document.createElement("link");
  link.id = "google-fonts-batch";
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
  document.head.appendChild(link);
}

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

// Helper to inject a font if it's a Google Font
export function loadGoogleFont(fontFamily: string) {
  const id = `google-font-${fontFamily.replace(/\s+/g, "-").toLowerCase()}`;
  if (document.getElementById(id)) return;

  // We skip loading standard web-safe fonts
  const webSafe = ["Arial", "Helvetica", "Times New Roman", "Courier New", "Georgia", "Palatino", "Garamond", "Bookman", "Comic Sans MS", "Trebuchet MS", "Arial Black", "Impact"];
  if (webSafe.includes(fontFamily)) return;

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, "+")}:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap`;
  document.head.appendChild(link);
}

import type { Dict } from "./types";

export const en: Dict = {
  code: "en",
  langName: "English",
  nav: {
    home: "Home",
    products: "Products",
    flavors: "Flavors",
    about: "About",
    contact: "Contact",
    cta: "Explore Now",
  },
  loader: {
    brand: "NEXO ENERGY",
    sub: "Cinematic 3D Experience",
    loading: "Loading",
    enter: "Enter",
  },
  hero: {
    kicker: "NEXO Energy — 2026 Collection",
    title: "A New Level of Taste and Energy",
    lead: "Five bold flavors. One electric formula. Brewed cold, charged with caffeine, built for people who move fast.",
    scroll: "Scroll to explore",
    stats: [
      { value: "5", label: "Flavors" },
      { value: "0g", label: "Sugar" },
      { value: "160mg", label: "Caffeine" },
    ],
  },
  catalog: {
    kicker: "The Lineup",
    title: "Our Flavors",
    lead: "Five personalities, one unmistakable silhouette. Pick your signature.",
    hint: "Select a flavor",
    view: "View flavor",
  },
  featured: {
    kicker: "Featured — 01 / 05",
    lead: "A bold and refreshing drink with a rich tropical lychee flavor.",
    facts: [
      { label: "Flavor", value: "Tropical Lychee" },
      { label: "Energy", value: "160 mg Caffeine" },
      { label: "Volume", value: "330 ml" },
      { label: "Serve", value: "2 – 4 °C" },
    ],
    note: "Double-extracted lychee · cold-pressed lime · zero sugar",
  },
  features: {
    kicker: "Inside the Can",
    title: "Engineered for Impact",
    items: [
      {
        label: "Flavor",
        value: "Double Lychee",
        note: "Two extractions of sun-ripened lychee for a deeper, rounder finish.",
      },
      {
        label: "Energy",
        value: "160 mg Caffeine",
        note: "Fast, clean lift with L-theanine — no crash, no jitters.",
      },
      {
        label: "Ingredients",
        value: "11 Actives",
        note: "B-vitamins, taurine, electrolytes and ginseng root extract.",
      },
      {
        label: "Format",
        value: "330 ml Slim",
        note: "Recycled aluminium. Infinitely recyclable, endlessly refillable.",
      },
    ],
    footnote: "Every batch is lab-tested. No tartrazine, no aspartame, no shortcuts.",
  },
  transitions: {
    kicker: "The Collection",
    hint: "Keep scrolling",
  },
  story: {
    kicker: "Our Story",
    title: "Built for the Night",
    body: [
      "NEXO started in a small studio in Tashkent with a single obsession: make an energy drink that tastes as good as it looks.",
      "Every can is brewed cold, fined twice and filled within twenty-four hours. No syrup. No compromise.",
    ],
    stats: [
      { value: "2019", label: "Founded" },
      { value: "42", label: "Countries" },
      { value: "100%", label: "Recyclable" },
    ],
  },
  cta: {
    kicker: "Ready When You Are",
    title: "Find Your Flavor",
    lead: "Five cans. One of them is yours.",
    button: "Explore Now",
    secondary: "Where to buy",
    note: "Available in 42 countries — always chilled.",
  },
  products: [
    {
      name: "DOUBLE LITCHI",
      flavor: "Tropical Lychee",
      tagline: "Bold & Refreshing",
      description:
        "A bold and refreshing drink with a rich tropical lychee flavor.",
    },
    {
      name: "CITRUS RUSH",
      flavor: "Citrus Blast",
      tagline: "Sharp & Electric",
      description:
        "An explosive mix of orange, lime and pink grapefruit with a dry, sparkling finish.",
    },
    {
      name: "BERRY SHOCK",
      flavor: "Berry Charge",
      tagline: "Dark & Loud",
      description:
        "An electric charge of blackcurrant, raspberry and wild blackberry.",
    },
    {
      name: "DARK GRAPE",
      flavor: "Dark Grape",
      tagline: "Deep & Cold",
      description:
        "A deep, dark taste of black grape and icy violet with a velvet finish.",
    },
    {
      name: "ICE LIME",
      flavor: "Ice Lime",
      tagline: "Cold & Clean",
      description:
        "A cool, crisp hit of frozen lime and mountain mint. Instantly awake.",
    },
  ],
  fallback: {
    title: "NEXO ENERGY",
    lead: "Five bold flavors. One electric formula. Built for people who move fast.",
    note: "Your browser or device does not support WebGL, so the interactive 3D experience is unavailable.",
    retry: "Retry 3D experience",
  },
  a11y: {
    skip: "Skip to content",
    scene: "Current scene",
    progress: "Scroll progress",
    language: "Language",
  },
};

export interface ProductCopy {
  name: string;
  flavor: string;
  tagline: string;
  description: string;
}

export interface FeatureCopy {
  label: string;
  value: string;
  note: string;
}

export interface StatCopy {
  value: string;
  label: string;
}

export interface Dict {
  code: "uz" | "ru" | "en";
  langName: string;
  nav: {
    home: string;
    products: string;
    flavors: string;
    about: string;
    contact: string;
    cta: string;
  };
  loader: {
    brand: string;
    sub: string;
    loading: string;
    enter: string;
  };
  hero: {
    kicker: string;
    title: string;
    lead: string;
    scroll: string;
    stats: StatCopy[];
  };
  catalog: {
    kicker: string;
    title: string;
    lead: string;
    hint: string;
    view: string;
  };
  featured: {
    kicker: string;
    lead: string;
    facts: { label: string; value: string }[];
    note: string;
  };
  features: {
    kicker: string;
    title: string;
    items: FeatureCopy[];
    footnote: string;
  };
  transitions: {
    kicker: string;
    hint: string;
  };
  story: {
    kicker: string;
    title: string;
    body: string[];
    stats: StatCopy[];
  };
  cta: {
    kicker: string;
    title: string;
    lead: string;
    button: string;
    secondary: string;
    note: string;
  };
  products: ProductCopy[];
  fallback: {
    title: string;
    lead: string;
    note: string;
    retry: string;
  };
  a11y: {
    skip: string;
    scene: string;
    progress: string;
    language: string;
  };
}

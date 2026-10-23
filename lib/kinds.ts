// One "Add a listing" form for every type. This file says what each type asks for.
// Type-specific answers are stored in listings.attributes (jsonb) under the field `key`.

export type Kind = "business" | "event" | "item" | "room" | "property" | "obituary";

export type Field = {
  key: string;
  label: string;
  type?: "text" | "date" | "time" | "number" | "url" | "select" | "textarea";
  options?: string[];
  placeholder?: string;
  cats?: string[];        // only for these category slugs (business). None = every category.
};

export type Price = { label: string; periods?: string[]; cats?: string[] };

export type KindConfig = {
  kind: Kind;
  label: string;          // tile title
  blurb: string;          // tile subtitle
  icon: string;           // Icon name
  titleLabel: string;
  titlePlaceholder: string;
  aboutLabel: string;
  aboutPlaceholder: string;
  categoryKind?: string;  // categories.kind to choose from (none = no category)
  price?: Price;
  prices?: Price[];       // price box that depends on the category (business); one per category group
  hoursCats?: string[];   // opening hours only for these categories (default: all, if hours is true)
  fields: Field[];
  hours?: boolean;        // opening hours
  socials?: boolean;      // social links + video
  expiresDays?: number;   // auto-expire posts (marketplace, rooms)
  listPath: string;       // where published posts appear
};

// Business category groups (categories.slug) — decide which extra boxes the form shows.
const G = {
  venue: ["venue"],
  foodPlaces: ["restaurant", "cafe", "food-dining"],
  shops: ["bakers", "cakes", "caterers", "fish-monger", "gifts-favours", "books-magazine"],
  eventServices: ["bar-services", "beauty-hair-makeup", "choirs", "choreographer", "decorators", "emcee", "event-planner",
    "light-sound", "music-dj", "music-bands", "photographers", "videographer"],
  trades: ["domestic-cleaning", "electrician", "painters", "car-valeting-detailing", "tailor", "it-support", "web-developer",
    "printing-graphic-designing"],
  transport: ["car-rental", "taxi", "courier-cargo-service"],
  professional: ["legal-financial", "mortgages-advisor", "investment", "visa-immigration-citizenship", "travel-agency", "healthcare"],
  other: ["press-and-media", "services", "sports"],
};

export const KINDS: KindConfig[] = [
  {
    kind: "business", label: "Business or service", blurb: "Caterer, restaurant, venue, band, DJ…", icon: "brief",
    titleLabel: "Business name", titlePlaceholder: "e.g. Rosario’s Goan Catering",
    aboutLabel: "About your business", aboutPlaceholder: "What you do, experience, what’s included…",
    categoryKind: "business",
    fields: [
      { key: "capacity", label: "Capacity", type: "number", placeholder: "e.g. 250 guests", cats: G.venue },
      { key: "venue_catering", label: "Catering", type: "select", options: ["In-house catering only", "Outside caterers allowed", "Either"], cats: G.venue },
      { key: "venue_bar", label: "Bar", type: "select", options: ["Licensed bar", "Bring your own drinks", "No alcohol"], cats: G.venue },
      { key: "dining", label: "Eat in or takeaway", type: "select", options: ["Eat in", "Takeaway", "Eat in & takeaway", "Eat in, takeaway & delivery"], cats: G.foodPlaces },
      { key: "min_guests", label: "Minimum guests", type: "number", placeholder: "e.g. 30", cats: ["caterers"] },
      { key: "order_delivery", label: "Orders", type: "select", options: ["Collection only", "Delivery only", "Collection or delivery"], cats: ["bakers", "cakes", "fish-monger", "gifts-favours"] },
      { key: "parking", label: "Parking", type: "select", options: ["Free parking", "Paid parking", "No parking"], cats: [...G.venue, ...G.foodPlaces] },
      { key: "areas_covered", label: "Areas covered", placeholder: "e.g. London & South East, will travel", cats: [...G.eventServices, ...G.trades, ...G.transport, "caterers", "bakers", "cakes"] },
      { key: "consultation", label: "First consultation", type: "select", options: ["Free", "Paid"], cats: G.professional },
    ],
    hours: true, hoursCats: [...G.venue, ...G.foodPlaces, ...G.shops, ...G.trades, ...G.transport, ...G.professional, ...G.other],
    socials: true, listPath: "/directory",
  },
  {
    kind: "event", label: "Event", blurb: "Dance, feast, fundraiser, concert…", icon: "cal",
    titleLabel: "Event name", titlePlaceholder: "e.g. Goan Christmas Dance 2026",
    aboutLabel: "About the event", aboutPlaceholder: "Bands, food, dress code, who it’s for…",
    categoryKind: "event",
    price: { label: "Ticket price (£)" },
    fields: [
      { key: "date", label: "Date", type: "date" },
      { key: "start_time", label: "Starts", type: "time" },
      { key: "end_time", label: "Ends", type: "time" },
      { key: "venue", label: "Venue", placeholder: "e.g. St Mary’s Hall, Hounslow" },
      { key: "tickets_url", label: "Tickets link", type: "url", placeholder: "Eventbrite or website link" },
      { key: "organiser", label: "Organiser", placeholder: "e.g. Goan Association UK" },
    ],
    socials: true, listPath: "/events",
  },
  {
    kind: "item", label: "Marketplace item", blurb: "Sell or give away something", icon: "shop",
    titleLabel: "What are you selling?", titlePlaceholder: "e.g. Silk saree, worn once",
    aboutLabel: "Description", aboutPlaceholder: "Size, colour, age, any marks…",
    categoryKind: "item",
    price: { label: "Price (£)" },
    fields: [
      { key: "condition", label: "Condition", type: "select", options: ["New", "Like new", "Good", "Used"] },
      { key: "delivery", label: "Collection or delivery", type: "select", options: ["Collection only", "Can deliver", "Can post"] },
    ],
    expiresDays: 60, listPath: "/marketplace",
  },
  {
    kind: "room", label: "Room to rent", blurb: "A room in your home or flat", icon: "key",
    titleLabel: "Headline", titlePlaceholder: "e.g. Double room near Hounslow West station",
    aboutLabel: "About the room", aboutPlaceholder: "Furnished?, who lives there, transport, house rules…",
    categoryKind: "room",
    price: { label: "Rent (£ per month)" },
    fields: [
      { key: "bills", label: "Bills", type: "select", options: ["Bills included", "Bills extra"] },
      { key: "available_from", label: "Available from", type: "date" },
      { key: "room_type", label: "Room type", type: "select", options: ["Single", "Double", "En-suite", "Studio"] },
      { key: "suits", label: "Suits", type: "select", options: ["Anyone", "Female only", "Male only", "Couple"] },
    ],
    expiresDays: 60, listPath: "/homes",
  },
  {
    kind: "property", label: "Property", blurb: "House or flat for sale or to let", icon: "home",
    titleLabel: "Headline", titlePlaceholder: "e.g. 3-bed semi in Swindon",
    aboutLabel: "About the property", aboutPlaceholder: "Rooms, garden, schools, transport…",
    categoryKind: "property",
    price: { label: "Price (£)", periods: ["once", "month"] },
    fields: [
      { key: "bedrooms", label: "Bedrooms", type: "number" },
      { key: "property_type", label: "Type", type: "select", options: ["House", "Flat", "Bungalow", "Land", "Other"] },
      { key: "agent_url", label: "Estate agent link", type: "url", placeholder: "Rightmove or agent page" },
    ],
    expiresDays: 120, listPath: "/homes",
  },
  {
    kind: "obituary", label: "Obituary", blurb: "Share news of a loved one’s passing", icon: "heart",
    titleLabel: "Full name", titlePlaceholder: "e.g. Maria Fernandes",
    aboutLabel: "Tribute", aboutPlaceholder: "A few words about their life and family…",
    fields: [
      { key: "born", label: "Date of birth", type: "date" },
      { key: "died", label: "Date of passing", type: "date" },
      { key: "from", label: "From (village / town)", placeholder: "e.g. Saligão, Goa" },
      { key: "funeral", label: "Funeral / mass details", type: "textarea", placeholder: "Church, date, time, reception…" },
      { key: "family", label: "Family contact", placeholder: "Name and phone (optional)" },
    ],
    listPath: "/obituaries",
  },
];

export const kindConfig = (k: string | null | undefined): KindConfig | undefined => KINDS.find((x) => x.kind === k);

/** Every field key the auto-fill may return. */
export const ALL_ATTR_KEYS = Array.from(new Set(KINDS.flatMap((k) => k.fields.map((f) => f.key))));

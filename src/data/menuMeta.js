// Presentation metadata (images, allergens, prep times) for menu items.
// DB schema has no columns for these, so we keep them as a lookup map keyed by dish name.
// Graceful fallback if a dish isn't found here.

export const MENU_META = {
  // Monday A
  "Truffle Arancini with Saffron Aioli": {
    image: "https://images.unsplash.com/photo-1541529086526-db283c563270?q=80&w=400&auto=format&fit=crop",
    allergens: ["Dairy", "Gluten"],
    prep: "10 min"
  },
  "Wagyu Beef Tenderloin & Pomme Purée": {
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400&auto=format&fit=crop",
    allergens: ["Dairy"],
    prep: "25 min"
  },
  "Dark Chocolate Dome with Raspberry": {
    image: "https://images.unsplash.com/photo-1579372786545-d24232daf58c?q=80&w=400&auto=format&fit=crop",
    allergens: ["Dairy", "Nuts"],
    prep: "5 min"
  },
  // Monday B
  "Scallop Carpaccio & Caviar": {
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=400&auto=format&fit=crop",
    allergens: ["Shellfish"],
    prep: "8 min"
  },
  "Pan-Seared Halibut with Beurre Blanc": {
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=400&auto=format&fit=crop",
    allergens: ["Fish", "Dairy"],
    prep: "20 min"
  },
  "Lemon Yuzu Tart with Meringue": {
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=400&auto=format&fit=crop",
    allergens: ["Dairy", "Gluten", "Eggs"],
    prep: "5 min"
  },
  // Tuesday A
  "Foie Gras Terrine": {
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=400&auto=format&fit=crop",
    allergens: ["Dairy", "Gluten"],
    prep: "10 min"
  },
  "Duck Breast with Cherry Glaze": {
    image: "https://images.unsplash.com/photo-1514944288352-fffac99f0bdf?q=80&w=400&auto=format&fit=crop",
    allergens: [],
    prep: "25 min"
  },
  "Pistachio Soufflé": {
    image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=400&auto=format&fit=crop",
    allergens: ["Dairy", "Eggs", "Nuts"],
    prep: "15 min"
  },
  // Tuesday B
  "Lobster Bisque": {
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=400&auto=format&fit=crop",
    allergens: ["Shellfish", "Dairy"],
    prep: "10 min"
  },
  "Herb-Crusted Rack of Lamb": {
    image: "https://images.unsplash.com/photo-1603073163308-9654c3fb70b5?q=80&w=400&auto=format&fit=crop",
    allergens: ["Gluten"],
    prep: "25 min"
  },
  "Vanilla Bean Panna Cotta": {
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=400&auto=format&fit=crop",
    allergens: ["Dairy", "Gelatin"],
    prep: "5 min"
  },
  // Wednesday A
  "Oysters Mignonette": {
    image: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?q=80&w=400&auto=format&fit=crop",
    allergens: ["Shellfish"],
    prep: "8 min"
  },
  "Seared Scallops with Pea Purée": {
    image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?q=80&w=400&auto=format&fit=crop",
    allergens: ["Shellfish"],
    prep: "18 min"
  },
  "Passionfruit Pavlova": {
    image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=400&auto=format&fit=crop",
    allergens: ["Eggs", "Dairy"],
    prep: "5 min"
  },
  // Wednesday B
  "Beef Tartare with Quail Egg": {
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400&auto=format&fit=crop",
    allergens: ["Eggs"],
    prep: "10 min"
  },
  "Roasted Venison Loin": {
    image: "https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=400&auto=format&fit=crop",
    allergens: [],
    prep: "28 min"
  },
  "Classic Tiramisu": {
    image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=400&auto=format&fit=crop",
    allergens: ["Dairy", "Gluten", "Eggs"],
    prep: "5 min"
  },
  // Thursday A
  "Burrata with Heirloom Tomatoes": {
    image: "https://images.unsplash.com/photo-1592417817098-8f3d6ef23a85?q=80&w=400&auto=format&fit=crop",
    allergens: ["Dairy"],
    prep: "8 min"
  },
  "Risotto al Tartufo": {
    image: "https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?q=80&w=400&auto=format&fit=crop",
    allergens: ["Dairy"],
    prep: "22 min"
  },
  "Tarte Tatin": {
    image: "https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?q=80&w=400&auto=format&fit=crop",
    allergens: ["Gluten", "Dairy"],
    prep: "5 min"
  },
  // Thursday B
  "Crispy Pork Belly": {
    image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?q=80&w=400&auto=format&fit=crop",
    allergens: [],
    prep: "12 min"
  },
  "Miso Black Cod": {
    image: "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?q=80&w=400&auto=format&fit=crop",
    allergens: ["Fish", "Soy"],
    prep: "20 min"
  },
  "Matcha Green Tea Mille-Feuille": {
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400&auto=format&fit=crop",
    allergens: ["Gluten", "Dairy"],
    prep: "8 min"
  },
  // Friday A
  "Smoked Salmon Blinis": {
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=400&auto=format&fit=crop",
    allergens: ["Fish", "Gluten", "Dairy"],
    prep: "10 min"
  },
  "Chateaubriand for Two": {
    image: "https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=400&auto=format&fit=crop",
    allergens: [],
    prep: "30 min"
  },
  "Grand Marnier Crêpes Suzette": {
    image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?q=80&w=400&auto=format&fit=crop",
    allergens: ["Gluten", "Dairy", "Eggs"],
    prep: "12 min"
  },
  // Friday B
  "Tuna Tartare": {
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=400&auto=format&fit=crop",
    allergens: ["Fish"],
    prep: "10 min"
  },
  "Lobster Thermidor": {
    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=400&auto=format&fit=crop",
    allergens: ["Shellfish", "Dairy"],
    prep: "25 min"
  },
  "White Chocolate Fondant": {
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=400&auto=format&fit=crop",
    allergens: ["Dairy", "Gluten", "Eggs"],
    prep: "15 min"
  },
  // Saturday A
  "Caviar Tasting": {
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=400&auto=format&fit=crop",
    allergens: ["Fish"],
    prep: "5 min"
  },
  "Tomahawk Steak with Chimichurri": {
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400&auto=format&fit=crop",
    allergens: [],
    prep: "35 min"
  },
  "Gold Leaf Chocolate Truffles": {
    image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?q=80&w=400&auto=format&fit=crop",
    allergens: ["Dairy"],
    prep: "5 min"
  },
  // Saturday B
  "King Crab Legs": {
    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=400&auto=format&fit=crop",
    allergens: ["Shellfish"],
    prep: "15 min"
  },
  "Chilean Sea Bass": {
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=400&auto=format&fit=crop",
    allergens: ["Fish"],
    prep: "22 min"
  },
  "Strawberry Consommé": {
    image: "https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?q=80&w=400&auto=format&fit=crop",
    allergens: [],
    prep: "5 min"
  },
  // Sunday A
  "French Onion Soup": {
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=400&auto=format&fit=crop",
    allergens: ["Dairy", "Gluten"],
    prep: "12 min"
  },
  "Classic Beef Wellington": {
    image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?q=80&w=400&auto=format&fit=crop",
    allergens: ["Gluten"],
    prep: "35 min"
  },
  "Baked Alaska": {
    image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=400&auto=format&fit=crop",
    allergens: ["Dairy", "Eggs"],
    prep: "8 min"
  },
  // Sunday B
  "Escargots de Bourgogne": {
    image: "https://images.unsplash.com/photo-1541529086526-db283c563270?q=80&w=400&auto=format&fit=crop",
    allergens: ["Shellfish", "Dairy"],
    prep: "10 min"
  },
  "Coq au Vin": {
    image: "https://images.unsplash.com/photo-1514944288352-fffac99f0bdf?q=80&w=400&auto=format&fit=crop",
    allergens: [],
    prep: "30 min"
  },
  "Crème Brûlée": {
    image: "https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?q=80&w=400&auto=format&fit=crop",
    allergens: ["Dairy", "Eggs"],
    prep: "5 min"
  }
};

// Fallback for dishes not in the map.
export const DEFAULT_META = {
  image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=400&auto=format&fit=crop",
  allergens: [],
  prep: "15 min"
};

export function getMenuMeta(namaMenu) {
  return MENU_META[namaMenu] || DEFAULT_META;
}

/**
 * Everything Nomi can buy with her coins. She earns one coin for every sum she solves.
 *
 * Shared by the iPad app (the shop) and the server (which checks prices and the balance on every purchase).
 * The drawings live in the client, keyed by id. Ids are stored in the database: never rename one.
 * Prices can change; a purchase keeps the price it was bought for.
 */

export const SLOTS = [
  'hairColor',
  'hat',
  'face',
  'top',
  'bottom',
  'dress',
  'shoes',
  'neck',
  'back',
  'hand',
  'pet',
  'land',
  'house',
  'garden',
] as const;

export type Slot = (typeof SLOTS)[number];

export interface Item {
  id: string;
  /** Shown in the shop, in Dutch. */
  name: string;
  slot: Slot;
  /** In coins. 0 means she has it from the start. */
  price: number;
  /** She picks the colour herself, as often as she likes. */
  colorable?: boolean;
  /** Can be bought more than once (flowers and trees for the garden). */
  stackable?: boolean;
  /** Another item she needs first: everything for the garden needs the land. */
  requires?: string;
}

const LAND = 'land';

export const CATALOG: readonly Item[] = [
  // Hair colour. The natural colours are free, the special ones cost coins.
  { id: 'hair-black', name: 'Zwart', slot: 'hairColor', price: 0 },
  { id: 'hair-darkbrown', name: 'Donkerbruin', slot: 'hairColor', price: 0 },
  { id: 'hair-brown', name: 'Bruin', slot: 'hairColor', price: 0 },
  { id: 'hair-blond', name: 'Blond', slot: 'hairColor', price: 0 },
  { id: 'hair-red', name: 'Rood', slot: 'hairColor', price: 0 },
  { id: 'hair-pink', name: 'Roze haar', slot: 'hairColor', price: 40 },
  { id: 'hair-purple', name: 'Paars haar', slot: 'hairColor', price: 40 },
  { id: 'hair-blue', name: 'Blauw haar', slot: 'hairColor', price: 40 },
  { id: 'hair-mint', name: 'Mint haar', slot: 'hairColor', price: 40 },
  { id: 'hair-rainbow', name: 'Regenbooghaar', slot: 'hairColor', price: 150 },

  { id: 'bow', name: 'Strik', slot: 'hat', price: 10, colorable: true },
  { id: 'cap', name: 'Pet', slot: 'hat', price: 20, colorable: true },
  { id: 'beanie', name: 'Muts', slot: 'hat', price: 25, colorable: true },
  { id: 'flower-crown', name: 'Bloemenkrans', slot: 'hat', price: 35 },
  { id: 'cat-ears', name: 'Kattenoortjes', slot: 'hat', price: 40, colorable: true },
  { id: 'headphones', name: 'Koptelefoon', slot: 'hat', price: 50, colorable: true },
  { id: 'witch-hat', name: 'Heksenhoed', slot: 'hat', price: 70, colorable: true },
  { id: 'tiara', name: 'Tiara', slot: 'hat', price: 90 },
  { id: 'unicorn-horn', name: 'Eenhoornhoorn', slot: 'hat', price: 120 },
  { id: 'crown', name: 'Kroon', slot: 'hat', price: 200 },

  { id: 'glasses', name: 'Bril', slot: 'face', price: 15, colorable: true },
  { id: 'star-stickers', name: 'Sterretjes', slot: 'face', price: 20 },
  { id: 'sunglasses', name: 'Zonnebril', slot: 'face', price: 25, colorable: true },
  { id: 'heart-glasses', name: 'Hartjesbril', slot: 'face', price: 40, colorable: true },

  { id: 'tshirt', name: 'T-shirt', slot: 'top', price: 0, colorable: true },
  { id: 'striped', name: 'Streepjestrui', slot: 'top', price: 30, colorable: true },
  { id: 'heart-shirt', name: 'Hartjesshirt', slot: 'top', price: 35, colorable: true },
  { id: 'hoodie', name: 'Hoodie', slot: 'top', price: 45, colorable: true },
  { id: 'glitter-top', name: 'Glittertop', slot: 'top', price: 60, colorable: true },
  { id: 'rainbow-shirt', name: 'Regenboogshirt', slot: 'top', price: 80 },

  { id: 'trousers', name: 'Broek', slot: 'bottom', price: 0, colorable: true },
  { id: 'shorts', name: 'Korte broek', slot: 'bottom', price: 20, colorable: true },
  { id: 'skirt', name: 'Rokje', slot: 'bottom', price: 25, colorable: true },
  { id: 'jeans', name: 'Spijkerbroek', slot: 'bottom', price: 35 },
  { id: 'tutu', name: 'Tutu', slot: 'bottom', price: 60, colorable: true },

  { id: 'summer-dress', name: 'Zomerjurk', slot: 'dress', price: 70, colorable: true },
  { id: 'party-dress', name: 'Feestjurk', slot: 'dress', price: 140, colorable: true },
  { id: 'princess-dress', name: 'Prinsessenjurk', slot: 'dress', price: 300, colorable: true },
  { id: 'rainbow-dress', name: 'Regenboogjurk', slot: 'dress', price: 350 },

  { id: 'sneakers', name: 'Sneakers', slot: 'shoes', price: 0, colorable: true },
  { id: 'ballet-flats', name: "Ballerina's", slot: 'shoes', price: 20, colorable: true },
  { id: 'boots', name: 'Laarzen', slot: 'shoes', price: 35, colorable: true },
  { id: 'glitter-shoes', name: 'Glitterschoenen', slot: 'shoes', price: 60 },
  { id: 'roller-skates', name: 'Rolschaatsen', slot: 'shoes', price: 100, colorable: true },

  { id: 'scarf', name: 'Sjaal', slot: 'neck', price: 25, colorable: true },
  { id: 'pearls', name: 'Parelketting', slot: 'neck', price: 40 },
  { id: 'heart-necklace', name: 'Hartjesketting', slot: 'neck', price: 50 },

  { id: 'backpack', name: 'Rugzak', slot: 'back', price: 40, colorable: true },
  { id: 'cape', name: 'Cape', slot: 'back', price: 80, colorable: true },
  { id: 'fairy-wings', name: 'Feeënvleugels', slot: 'back', price: 150 },
  { id: 'rainbow-wings', name: 'Regenboogvleugels', slot: 'back', price: 250 },

  { id: 'lollipop', name: 'Lolly', slot: 'hand', price: 10 },
  { id: 'balloon', name: 'Ballon', slot: 'hand', price: 15, colorable: true },
  { id: 'ice-cream', name: 'IJsje', slot: 'hand', price: 20 },
  { id: 'teddy', name: 'Knuffelbeer', slot: 'hand', price: 50 },
  { id: 'wand', name: 'Toverstaf', slot: 'hand', price: 80 },

  { id: 'bunny', name: 'Konijntje', slot: 'pet', price: 120 },
  { id: 'kitten', name: 'Poesje', slot: 'pet', price: 150 },
  { id: 'puppy', name: 'Hondje', slot: 'pet', price: 150 },
  { id: 'dragon', name: 'Draakje', slot: 'pet', price: 350 },
  { id: 'unicorn', name: 'Eenhoorntje', slot: 'pet', price: 500 },

  // Her own place: first the land, then a house on it and things for the garden.
  { id: LAND, name: 'Stukje land', slot: 'land', price: 200 },

  { id: 'tent', name: 'Tent', slot: 'house', price: 100, requires: LAND },
  { id: 'cabin', name: 'Houten huisje', slot: 'house', price: 400, requires: LAND },
  { id: 'cottage', name: 'Huisje', slot: 'house', price: 800, requires: LAND },
  { id: 'castle', name: 'Kasteel', slot: 'house', price: 1500, requires: LAND },

  { id: 'tulip', name: 'Tulp', slot: 'garden', price: 5, stackable: true, colorable: true, requires: LAND },
  { id: 'sunflower', name: 'Zonnebloem', slot: 'garden', price: 8, stackable: true, requires: LAND },
  { id: 'mushroom', name: 'Paddenstoel', slot: 'garden', price: 10, stackable: true, requires: LAND },
  { id: 'bush', name: 'Struik', slot: 'garden', price: 12, stackable: true, requires: LAND },
  { id: 'tree', name: 'Boom', slot: 'garden', price: 25, stackable: true, requires: LAND },
  { id: 'apple-tree', name: 'Appelboom', slot: 'garden', price: 40, stackable: true, requires: LAND },
  { id: 'lantern', name: 'Lantaarn', slot: 'garden', price: 30, stackable: true, requires: LAND },
  { id: 'birdhouse', name: 'Vogelhuisje', slot: 'garden', price: 30, requires: LAND },
  { id: 'mailbox', name: 'Brievenbus', slot: 'garden', price: 30, colorable: true, requires: LAND },
  { id: 'bench', name: 'Bankje', slot: 'garden', price: 50, requires: LAND },
  { id: 'doghouse', name: 'Hondenhok', slot: 'garden', price: 70, colorable: true, requires: LAND },
  { id: 'sandbox', name: 'Zandbak', slot: 'garden', price: 80, requires: LAND },
  { id: 'swing', name: 'Schommel', slot: 'garden', price: 120, requires: LAND },
  { id: 'pond', name: 'Vijver', slot: 'garden', price: 150, requires: LAND },
  { id: 'slide', name: 'Glijbaan', slot: 'garden', price: 150, colorable: true, requires: LAND },
  { id: 'trampoline', name: 'Trampoline', slot: 'garden', price: 180, requires: LAND },
  { id: 'fountain', name: 'Fontein', slot: 'garden', price: 250, requires: LAND },
  { id: 'rainbow-arch', name: 'Regenboog', slot: 'garden', price: 300, requires: LAND },
];

const byId = new Map(CATALOG.map((item) => [item.id, item]));

export function itemById(id: string): Item | undefined {
  return byId.get(id);
}

/** Free items are hers from the start; the rest once bought. */
export function owns(item: Item, ownedIds: ReadonlySet<string>): boolean {
  return item.price === 0 || ownedIds.has(item.id);
}

export type PurchaseDecision = 'ok' | 'owned' | 'unknown' | 'locked' | 'too-expensive';

/**
 * Whether she can buy an item. The server decides with this on every purchase, and the iPad uses
 * the same rules to show the result straight away, before the server has answered.
 */
export function decidePurchase(itemId: string, ownedIds: ReadonlySet<string>, balance: number): PurchaseDecision {
  const item = byId.get(itemId);
  if (!item) return 'unknown';
  if (!item.stackable && owns(item, ownedIds)) return 'owned';
  if (item.requires) {
    const needed = byId.get(item.requires);
    if (!needed || !owns(needed, ownedIds)) return 'locked';
  }
  if (balance < item.price) return 'too-expensive';
  return 'ok';
}

/** What the server keeps per player besides purchases, each replaced as a whole (last write wins). */
export const STATE_KEYS = ['avatar', 'home', 'goal'] as const;
export type StateKey = (typeof STATE_KEYS)[number];

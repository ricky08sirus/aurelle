export type Product = {
  id: string;
  name: string;
  flavour?: string;
  size: string;
  mrp: number;
  price: number;
  image?: string;
};

export const products: Product[] = [
  { id: "whey-choc-1kg", name: "Aurelle Whey Protein", flavour: "Chocolate", size: "1 kg", mrp: 3499, price: 2499 },
  { id: "whey-van-1kg", name: "Aurelle Whey Protein", flavour: "Vanilla", size: "1 kg", mrp: 3499, price: 2499 },
  { id: "whey-straw-1kg", name: "Aurelle Whey Protein", flavour: "Strawberry", size: "1 kg", mrp: 3499, price: 2599 },
  { id: "whey-choc-2kg", name: "Aurelle Whey Protein", flavour: "Chocolate", size: "2 kg", mrp: 6499, price: 4699 },
  { id: "isolate-choc-1kg", name: "Aurelle Whey Isolate", flavour: "Chocolate", size: "1 kg", mrp: 4999, price: 3699 },
  { id: "isolate-van-1kg", name: "Aurelle Whey Isolate", flavour: "Vanilla", size: "1 kg", mrp: 4999, price: 3699 },
  { id: "isolate-coffee-1kg", name: "Aurelle Whey Isolate", flavour: "Cafe Mocha", size: "1 kg", mrp: 4999, price: 3799 },
  { id: "plant-choc-1kg", name: "Aurelle Plant Protein", flavour: "Chocolate", size: "1 kg", mrp: 3299, price: 2399 },
  { id: "plant-van-1kg", name: "Aurelle Plant Protein", flavour: "Vanilla", size: "1 kg", mrp: 3299, price: 2399 },
  { id: "gainer-choc-3kg", name: "Aurelle Mass Gainer", flavour: "Chocolate", size: "3 kg", mrp: 4299, price: 3199 },
  { id: "casein-choc-1kg", name: "Aurelle Casein Protein", flavour: "Chocolate", size: "1 kg", mrp: 4599, price: 3399 },
  { id: "whey-plain-1kg", name: "Aurelle Whey Concentrate", flavour: "Unflavoured", size: "1 kg", mrp: 3199, price: 2299 },
];
if (!String.prototype.trim) {
  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, '');
  };
}
if (!Array.prototype.forEach) {
  Array.prototype.forEach = function(fn, scope) {
    for (var i = 0, len = this.length; i < len; ++i) {
      if (i in this) fn.call(scope, this[i], i, this);
    }
  };
}
if (!Array.prototype.filter) {
  Array.prototype.filter = function(fn, scope) {
    var res = [];
    for (var i = 0, len = this.length; i < len; ++i) {
      if (i in this && fn.call(scope, this[i], i, this)) res.push(this[i]);
    }
    return res;
  };
}
if (!Array.prototype.map) {
  Array.prototype.map = function(fn, scope) {
    var res = [];
    for (var i = 0, len = this.length; i < len; ++i) {
      if (i in this) res.push(fn.call(scope, this[i], i, this));
    }
    return res;
  };
}

window.NKEMMART_TAXONOMY = {
  vehicles: {
    id: "vehicles",
    name: "Vehicles",
    icon: "images/categories/cat_vehicles.jpg?v=3",
    count: "447 910",
    subcategories: [
      { id: "vehicle-parts", name: "Vehicle Parts & Accessories", count: "215 891", icon: "images/subcategories/vehicles_parts.jpg?v=3", keywords: ["part", "tyre", "tire", "battery", "accessory", "rim", "brake", "engine", "wiper", "mirror"] },
      { id: "cars", name: "Cars", count: "108 400", icon: "images/subcategories/vehicles_cars.jpg?v=3", keywords: ["car", "toyota", "honda", "benz", "lexus", "hyundai", "sedan", "suv"] },
      { id: "motorcycles-scooters", name: "Motorcycles & Scooters", count: "3 929", icon: "images/subcategories/vehicles_motorcycles.jpg?v=3", keywords: ["motorcycle", "scooter", "bike", "bajaj", "haojue"] },
      { id: "buses-microbuses", name: "Buses & Microbuses", count: "7 322", icon: "images/subcategories/vehicles_buses.jpg?v=3", keywords: ["bus", "microbus", "hiace", "coaster", "van"] },
      { id: "trucks-trailers", name: "Trucks & Trailers", count: "10 132", icon: "images/subcategories/vehicles_trucks.jpg?v=3", keywords: ["truck", "trailer", "tipper", "tanker", "mack"] }
    ]
  },
  appliances: {
    id: "appliances",
    name: "Appliances",
    icon: "images/categories/cat_appliances.jpg?v=3",
    count: "182 340",
    subcategories: [
      { id: "kitchen-appliances", name: "Small Kitchen Appliances", count: "89 420", icon: "images/subcategories/appliances_kitchen.jpg?v=3", keywords: ["blender", "air fryer", "kettle", "microwave", "toaster", "juicer"] },
      { id: "large-appliances", name: "Large Home Appliances", count: "51 200", icon: "images/subcategories/appliances_large.jpg?v=3", keywords: ["refrigerator", "freezer", "washing machine", "dryer", "cooker"] },
      { id: "climate-control", name: "Heating, Cooling & Air", count: "28 320", icon: "images/subcategories/appliances_climate.jpg?v=3", keywords: ["fan", "air conditioner", "ac", "heater", "purifier"] },
      { id: "garment-care", name: "Irons & Garment Care", count: "13 400", icon: "images/subcategories/appliances_garment.jpg?v=3", keywords: ["iron", "steam iron", "garment steamer", "ironing board"] }
    ]
  },
  phones: {
    id: "phones",
    name: "Phones & Tablets",
    icon: "images/categories/cat_phones.jpg?v=3",
    count: "329 150",
    subcategories: [
      { id: "smartphones", name: "Mobile Phones & Smartphones", count: "198 400", icon: "images/subcategories/phones_smartphones.jpg?v=3", keywords: ["phone", "iphone", "samsung", "infinix", "tecno", "xiaomi", "redmi"] },
      { id: "tablets", name: "Tablets & iPads", count: "42 610", icon: "images/subcategories/phones_tablets.jpg?v=3", keywords: ["tablet", "ipad", "tab", "kindle"] },
      { id: "mobile-accessories", name: "Phone Accessories & Chargers", count: "65 240", icon: "images/subcategories/phones_accessories.jpg?v=3", keywords: ["charger", "power bank", "powerbank", "cable", "case", "screen protector"] },
      { id: "smart-watches", name: "Smart Watches & Trackers", count: "22 900", icon: "images/subcategories/phones_smartwatches.jpg?v=3", keywords: ["smartwatch", "apple watch", "fitness band", "band"] }
    ]
  },
  "health-beauty": {
    id: "health-beauty",
    name: "Health & Beauty",
    icon: "images/categories/cat_health_beauty.jpg?v=3",
    count: "210 580",
    subcategories: [
      { id: "skin-care", name: "Skin Care & Moisturizers", count: "94 300", icon: "images/subcategories/health_skincare.jpg?v=3", keywords: ["cream", "lotion", "serum", "sunscreen", "cleanser", "soap"] },
      { id: "hair-care", name: "Hair Care, Wigs & Styling", count: "54 210", icon: "images/subcategories/health_haircare.jpg?v=3", keywords: ["hair", "wig", "shampoo", "conditioner", "clipper", "dryer"] },
      { id: "fragrances", name: "Perfumes & Deodorants", count: "38 470", icon: "images/subcategories/health_fragrances.jpg?v=3", keywords: ["perfume", "fragrance", "spray", "cologne", "body spray"] },
      { id: "makeup", name: "Makeup & Cosmetics", count: "23 600", icon: "images/subcategories/health_makeup.jpg?v=3", keywords: ["makeup", "lipstick", "powder", "foundation", "eyeliner", "mascara"] }
    ]
  },
  "home-office": {
    id: "home-office",
    name: "Home & Office",
    icon: "images/categories/cat_home_office.jpg?v=3",
    count: "154 900",
    subcategories: [
      { id: "home-furniture", name: "Living Room & Bedroom Furniture", count: "62 100", icon: "images/subcategories/home_furniture.jpg?v=3", keywords: ["chair", "sofa", "bed", "mattress", "table", "wardrobe"] },
      { id: "office-furniture", name: "Office Furniture & Desk Chairs", count: "31 540", icon: "images/subcategories/home_office_furniture.jpg?v=3", keywords: ["office chair", "desk", "filing cabinet", "bookshelf"] },
      { id: "home-decor", name: "Decor, Lighting & Curtains", count: "41 820", icon: "images/subcategories/home_decor.jpg?v=3", keywords: ["curtain", "lamp", "light", "clock", "carpet", "rug", "decor"] },
      { id: "kitchen-dining", name: "Cookware & Dining", count: "19 440", icon: "images/subcategories/home_kitchen_dining.jpg?v=3", keywords: ["pot", "pan", "plate", "cutlery", "dish rack", "flask"] }
    ]
  },
  electronics: {
    id: "electronics",
    name: "Electronics",
    icon: "images/categories/cat_electronics.jpg?v=3",
    count: "278 190",
    subcategories: [
      { id: "televisions", name: "Televisions & Smart TVs", count: "98 400", icon: "images/subcategories/electronics_tv.jpg?v=3", keywords: ["tv", "smart tv", "television", "hisense", "samsung tv", "lg tv"] },
      { id: "audio-sound", name: "Audio, Speakers & Soundbars", count: "81 320", icon: "images/subcategories/electronics_audio.jpg?v=3", keywords: ["speaker", "soundbar", "sound system", "bluetooth speaker", "home theatre", "subwoofer"] },
      { id: "cameras-optics", name: "Cameras & Photography", count: "32 170", icon: "images/subcategories/electronics_cameras.jpg?v=3", keywords: ["camera", "dslr", "lens", "tripod", "canon", "nikon"] },
      { id: "power-solar", name: "Generators, Inverters & Solar", count: "66 300", icon: "images/subcategories/electronics_solar.jpg?v=3", keywords: ["generator", "inverter", "solar panel", "battery", "ups", "stabilizer"] }
    ]
  },
  fashion: {
    id: "fashion",
    name: "Fashion",
    icon: "images/categories/cat_fashion.jpg?v=3",
    count: "389 450",
    subcategories: [
      { id: "mens-clothing", name: "Men's Clothing & Shoes", count: "142 800", icon: "images/subcategories/fashion_mens.jpg?v=3", keywords: ["shirt", "trousers", "men shoe", "sneakers", "suit", "loafers", "polo"] },
      { id: "womens-clothing", name: "Women's Clothing & Dresses", count: "165 300", icon: "images/subcategories/fashion_womens.jpg?v=3", keywords: ["dress", "gown", "skirt", "heels", "blouse", "handbag", "women shoes"] },
      { id: "watches-jewelry", name: "Watches, Bags & Jewelry", count: "53 150", icon: "images/subcategories/fashion_watches_jewelry.jpg?v=3", keywords: ["watch", "wristwatch", "bag", "necklace", "earring", "bracelet", "wallet"] },
      { id: "kids-fashion", name: "Kids & Teens Fashion", count: "28 200", icon: "images/subcategories/fashion_kids.jpg?v=3", keywords: ["kids clothing", "children clothes", "school bag", "kids shoes"] }
    ]
  },
  supermarket: {
    id: "supermarket",
    name: "Supermarket",
    icon: "images/categories/cat_supermarket.jpg?v=3",
    count: "115 800",
    subcategories: [
      { id: "food-cupboard", name: "Food Cupboard & Grains", count: "48 900", icon: "images/subcategories/supermarket_food.jpg?v=3", keywords: ["rice", "beans", "oil", "pasta", "flour", "sugar", "salt"] },
      { id: "drinks-beverages", name: "Beverages, Milk & Drinks", count: "33 450", icon: "images/subcategories/supermarket_drinks.jpg?v=3", keywords: ["milk", "juice", "tea", "coffee", "wine", "water", "milo"] },
      { id: "cleaning-laundry", name: "Household Cleaning & Laundry", count: "21 350", icon: "images/subcategories/supermarket_cleaning.jpg?v=3", keywords: ["detergent", "bleach", "soap", "sponge", "air freshener", "tissue"] },
      { id: "canned-packaged", name: "Canned & Packaged Goods", count: "12 100", icon: "images/subcategories/supermarket_packaged.jpg?v=3", keywords: ["sardine", "corned beef", "canned", "biscuits", "snacks"] }
    ]
  },
  computing: {
    id: "computing",
    name: "Computing",
    icon: "images/categories/cat_computing.jpg?v=3",
    count: "194 600",
    subcategories: [
      { id: "laptops", name: "Laptops & Notebooks", count: "98 420", icon: "images/subcategories/computing_laptops.jpg?v=3", keywords: ["laptop", "hp", "dell", "lenovo", "macbook", "asus", "acer"] },
      { id: "desktops-monitors", name: "Desktops, Monitors & All-in-One", count: "38 200", icon: "images/subcategories/computing_desktops.jpg?v=3", keywords: ["desktop", "monitor", "cpu", "pc", "all-in-one"] },
      { id: "computer-accessories", name: "Computer Accessories & Keyboards", count: "41 180", icon: "images/subcategories/computing_accessories.jpg?v=3", keywords: ["mouse", "keyboard", "hard drive", "ssd", "flash drive", "ram", "charger"] },
      { id: "networking-printers", name: "Printers, Scanners & Networking", count: "16 800", icon: "images/subcategories/computing_printers.jpg?v=3", keywords: ["printer", "router", "wifi", "modem", "scanner", "toner"] }
    ]
  },
  baby: {
    id: "baby",
    name: "Baby Products",
    icon: "images/categories/cat_baby.jpg?v=3",
    count: "87 400",
    subcategories: [
      { id: "diapering-wipes", name: "Diapers, Wipes & Potty", count: "39 100", icon: "images/subcategories/baby_diapers.jpg?v=3", keywords: ["diaper", "pampers", "wipes", "potty"] },
      { id: "baby-feeding", name: "Feeding & Nursing Bottles", count: "24 800", icon: "images/subcategories/baby_feeding.jpg?v=3", keywords: ["feeding bottle", "formula", "breast pump", "high chair", "pacifier"] },
      { id: "baby-gear", name: "Strollers, Walkers & Car Seats", count: "14 200", icon: "images/subcategories/baby_gear.jpg?v=3", keywords: ["stroller", "walker", "car seat", "baby cot", "carrier"] },
      { id: "toys-games", name: "Toys, Puzzles & Educational Games", count: "9 300", icon: "images/subcategories/baby_toys.jpg?v=3", keywords: ["toy", "puzzle", "doll", "playmat", "teddy"] }
    ]
  },
  gaming: {
    id: "gaming",
    name: "Gaming",
    icon: "images/categories/cat_gaming.jpg?v=3",
    count: "93 250",
    subcategories: [
      { id: "consoles", name: "PlayStation, Xbox & Nintendo Consoles", count: "38 400", icon: "images/subcategories/gaming_consoles.jpg?v=3", keywords: ["playstation", "ps5", "ps4", "xbox", "nintendo", "console"] },
      { id: "video-games", name: "Video Game Discs & Digital Titles", count: "29 150", icon: "images/subcategories/gaming_videogames.jpg?v=3", keywords: ["fifa", "fc 24", "gta", "cod", "game disc", "mortal kombat"] },
      { id: "gaming-accessories", name: "Controllers, Headsets & Wheels", count: "25 700", icon: "images/subcategories/gaming_accessories.jpg?v=3", keywords: ["controller", "gamepad", "gaming headset", "racing wheel", "charging dock"] }
    ]
  },
  other: {
    id: "other",
    name: "Other categories",
    icon: "images/categories/cat_other.jpg?v=3",
    count: "142 800",
    subcategories: [
      { id: "services", name: "Commercial & Home Services", count: "52 400", icon: "images/subcategories/other_services.jpg?v=3", keywords: ["service", "repair", "installation", "cleaning service"] },
      { id: "sports-fitness", name: "Sports, Gym & Fitness", count: "39 100", icon: "images/subcategories/other_sports.jpg?v=3", keywords: ["treadmill", "dumbbell", "gym", "football", "fitness"] },
      { id: "books-stationery", name: "Books, Crafts & Stationery", count: "28 300", icon: "images/subcategories/other_books.jpg?v=3", keywords: ["book", "stationery", "pen", "notebook", "art"] },
      { id: "pets-animals", name: "Pets, Pet Food & Accessories", count: "23 000", icon: "images/subcategories/other_pets.jpg?v=3", keywords: ["dog", "cat", "pet food", "cage", "puppy"] }
    ]
  }
};

// ========================================================
// NKEMMART VERIFIED MASTER CATALOG
// Accurate products with authentic prices, brands, keywords
// ========================================================
window.NKEMMART_CATALOG = [
  // --- FLAGSHIP HOMEPAGE PRODUCTS ---
  {
    id: "prod-1",
    title: "Ace Elec 20000 mAh Ultra Slim Portable Power Bank - Type C Dual Input",
    brand: "Ace Elec",
    category: "phones",
    subcategory: "mobile-accessories",
    price: 7650,
    originalPrice: 12000,
    discount: "-36%",
    image: "images/product_powerbank.jpg",
    rating: 5,
    reviews: 163787,
    keywords: ["ace elec", "power bank", "powerbank", "charger", "type c", "battery", "phone charger", "portable charger", "fast charging", "backup battery"]
  },
  {
    id: "prod-2",
    title: "SILVER CREST 2L Industrial 8500W Food Crusher Blender With 2 Jar",
    brand: "Silver Crest",
    category: "appliances",
    subcategory: "kitchen-appliances",
    price: 20954,
    originalPrice: 26386,
    discount: "-21%",
    image: "images/product_blender.webp",
    rating: 5,
    reviews: 21418,
    keywords: ["silver crest", "blender", "food crusher", "grinder", "kitchen", "appliance", "smoothie maker", "heavy duty blender", "crusher"]
  },
  {
    id: "prod-3",
    title: "HANSEN Electric Iron Pressing Clothes 1000W",
    brand: "Hansen",
    category: "appliances",
    subcategory: "garment-care",
    price: 5959,
    originalPrice: 7117,
    discount: "-16%",
    image: "images/product_iron.jpg",
    rating: 5,
    reviews: 11501,
    keywords: ["hansen", "iron", "pressing iron", "electric iron", "dry iron", "garment care", "clothes iron", "laundry iron"]
  },
  {
    id: "prod-4",
    title: "HANSEN 18 inches industrial level standing fan",
    brand: "Hansen",
    category: "appliances",
    subcategory: "climate-control",
    price: 16998,
    originalPrice: 20060,
    discount: "-15%",
    image: "images/product_fan.webp",
    rating: 5,
    reviews: 11928,
    keywords: ["hansen", "fan", "standing fan", "industrial fan", "cooling", "18 inch fan", "electric fan", "metal fan"]
  },
  {
    id: "prod-5",
    title: "Syinix 2.2L Electric Kettle - Food Grade Stainless Steel SKE22U1",
    brand: "Syinix",
    category: "appliances",
    subcategory: "kitchen-appliances",
    price: 6399,
    originalPrice: 7229,
    discount: "-12%",
    image: "images/product_kettle.webp",
    rating: 5,
    reviews: 15262,
    keywords: ["syinix", "kettle", "electric kettle", "water heater", "stainless steel", "hot water", "boiling kettle"]
  },
  {
    id: "prod-6",
    title: "SILVER CREST 8L Extra Large Digital Air Fryer 2400W",
    brand: "Silver Crest",
    category: "appliances",
    subcategory: "kitchen-appliances",
    price: 30999,
    originalPrice: 44000,
    discount: "-30%",
    image: "images/product_airfryer.jpg",
    rating: 5,
    reviews: 7523,
    keywords: ["silver crest", "air fryer", "airfryer", "digital air fryer", "fryer", "oil free cooker", "healthy cooking", "8l airfryer"]
  },
  {
    id: "prod-7",
    title: "Maxi 20 Litres Manual Microwave Oven (MAXIMWO2021W) - 12 Months Warranty",
    brand: "Maxi",
    category: "appliances",
    subcategory: "kitchen-appliances",
    price: 55999,
    originalPrice: 71550,
    discount: "-22%",
    image: "images/product_microwave.jpg",
    rating: 5,
    reviews: 1496,
    keywords: ["maxi", "microwave", "microwave oven", "oven", "kitchen appliance", "food warmer", "reheat", "grill"]
  },
  {
    id: "prod-8",
    title: "Hikers 32 Smart HD Frameless Panel Digital LED TV with Android",
    brand: "Hikers",
    category: "electronics",
    subcategory: "televisions",
    price: 102246,
    originalPrice: 171000,
    discount: "-40%",
    image: "images/product_tv.jpg",
    rating: 5,
    reviews: 1565,
    keywords: ["hikers", "tv", "smart tv", "television", "led tv", "android tv", "32 inch tv", "frameless tv"]
  },

  // --- VEHICLES ---
  {
    id: "prod-veh-1",
    title: "Toyota / Lexus Genuine Front & Rear Ceramic Brake Pads Kit",
    brand: "Toyota",
    category: "vehicles",
    subcategory: "vehicle-parts",
    price: 18500,
    originalPrice: 25000,
    discount: "-26%",
    image: "images/subcategories/vehicles_parts.jpg?v=3",
    rating: 5,
    reviews: 432,
    keywords: ["brake pad", "toyota", "lexus", "brake", "ceramic brake", "car parts", "accessories", "auto parts"]
  },
  {
    id: "prod-veh-2",
    title: "Incoe Heavy Duty Maintenance Free 12V 75Ah Automotive Battery",
    brand: "Incoe",
    category: "vehicles",
    subcategory: "vehicle-parts",
    price: 68000,
    originalPrice: 85000,
    discount: "-20%",
    image: "images/subcategories/vehicles_parts.jpg?v=3",
    rating: 5,
    reviews: 819,
    keywords: ["battery", "car battery", "12v battery", "75ah", "incoe", "automotive battery", "vehicle parts"]
  },
  {
    id: "prod-veh-3",
    title: "Toyota Corolla 1.8L LE Sedan - Automatic Transmission Clean Condition",
    brand: "Toyota",
    category: "vehicles",
    subcategory: "cars",
    price: 4850000,
    originalPrice: 5500000,
    discount: "-12%",
    image: "images/subcategories/vehicles_cars.jpg?v=3",
    rating: 5,
    reviews: 128,
    keywords: ["toyota", "corolla", "car", "sedan", "vehicle", "tokunbo", "automatic", "toyota car"]
  },
  {
    id: "prod-veh-4",
    title: "Lexus RX 350 Luxury All-Wheel Drive SUV - Full Option Leather Interior",
    brand: "Lexus",
    category: "vehicles",
    subcategory: "cars",
    price: 11500000,
    originalPrice: 13000000,
    discount: "-11%",
    image: "images/subcategories/vehicles_cars.jpg?v=3",
    rating: 5,
    reviews: 64,
    keywords: ["lexus", "rx350", "rx 350", "suv", "car", "luxury car", "toyota", "jeep"]
  },
  {
    id: "prod-veh-5",
    title: "Bajaj Boxer BM 150 Heavy Duty Commercial Motorcycle",
    brand: "Bajaj",
    category: "vehicles",
    subcategory: "motorcycles-scooters",
    price: 1150000,
    originalPrice: 1300000,
    discount: "-11%",
    image: "images/subcategories/vehicles_motorcycles.jpg?v=3",
    rating: 5,
    reviews: 312,
    keywords: ["bajaj", "boxer", "motorcycle", "bike", "okada", "two wheeler", "150cc"]
  },
  {
    id: "prod-veh-6",
    title: "Toyota HiAce High Roof 15-Seater Commercial Passenger Bus",
    brand: "Toyota",
    category: "vehicles",
    subcategory: "buses-microbuses",
    price: 8200000,
    originalPrice: 9500000,
    discount: "-14%",
    image: "images/subcategories/vehicles_buses.jpg?v=3",
    rating: 5,
    reviews: 78,
    keywords: ["hiace", "toyota", "bus", "microbus", "hummer bus", "15 seater", "commercial bus"]
  },
  {
    id: "prod-veh-7",
    title: "Mack Heavy Duty 30-Tonne Tipper Dump Truck 10-Tyre",
    brand: "Mack",
    category: "vehicles",
    subcategory: "trucks-trailers",
    price: 22000000,
    originalPrice: 25000000,
    discount: "-12%",
    image: "images/subcategories/vehicles_trucks.jpg?v=3",
    rating: 5,
    reviews: 42,
    keywords: ["mack", "truck", "tipper", "trailer", "dump truck", "heavy duty", "30 tonne"]
  },

  // --- APPLIANCES ---
  {
    id: "prod-app-1",
    title: "Saisho 2-in-1 Electric Blender With Grinder Jar (S-742)",
    brand: "Saisho",
    category: "appliances",
    subcategory: "kitchen-appliances",
    price: 14500,
    originalPrice: 19000,
    discount: "-24%",
    image: "images/subcategories/appliances_kitchen.jpg?v=3",
    rating: 5,
    reviews: 2840,
    keywords: ["saisho", "blender", "grinder", "kitchen", "juicer", "food processor", "blending"]
  },
  {
    id: "prod-app-2",
    title: "Hisense 205L Double Door Defrost Top-Mount Refrigerator",
    brand: "Hisense",
    category: "appliances",
    subcategory: "large-appliances",
    price: 245000,
    originalPrice: 295000,
    discount: "-17%",
    image: "images/subcategories/appliances_large.jpg?v=3",
    rating: 5,
    reviews: 954,
    keywords: ["hisense", "refrigerator", "fridge", "freezer", "double door", "cooling", "large appliance"]
  },
  {
    id: "prod-app-3",
    title: "Haier Thermocool 8kg Front Load Automatic Washing Machine",
    brand: "Haier Thermocool",
    category: "appliances",
    subcategory: "large-appliances",
    price: 385000,
    originalPrice: 440000,
    discount: "-12%",
    image: "images/subcategories/appliances_large.jpg?v=3",
    rating: 5,
    reviews: 620,
    keywords: ["haier thermocool", "washing machine", "washer", "dryer", "laundry", "front load", "automatic"]
  },
  {
    id: "prod-app-4",
    title: "Gree 1.5HP Copper Inverter Split Air Conditioner with R32 Gas",
    brand: "Gree",
    category: "appliances",
    subcategory: "climate-control",
    price: 345000,
    originalPrice: 410000,
    discount: "-16%",
    image: "images/subcategories/appliances_climate.jpg?v=3",
    rating: 5,
    reviews: 730,
    keywords: ["gree", "air conditioner", "ac", "split ac", "inverter ac", "cooling", "climate control"]
  },
  {
    id: "prod-app-5",
    title: "OX 18-Inch Plus Industrial Standing Fan with Copper Motor",
    brand: "OX",
    category: "appliances",
    subcategory: "climate-control",
    price: 26500,
    originalPrice: 32000,
    discount: "-17%",
    image: "images/subcategories/appliances_climate.jpg?v=3",
    rating: 5,
    reviews: 4520,
    keywords: ["ox", "fan", "ox fan", "standing fan", "industrial fan", "cooling", "metal fan"]
  },
  {
    id: "prod-app-6",
    title: "Binatone Heavy Duty Dry Iron With Non-Stick Teflon Soleplate",
    brand: "Binatone",
    category: "appliances",
    subcategory: "garment-care",
    price: 8500,
    originalPrice: 11500,
    discount: "-26%",
    image: "images/subcategories/appliances_garment.jpg?v=3",
    rating: 5,
    reviews: 1845,
    keywords: ["binatone", "iron", "dry iron", "pressing iron", "garment care", "clothes iron"]
  },

  // --- PHONES & TABLETS ---
  {
    id: "prod-ph-1",
    title: "Apple iPhone 15 Pro Max 256GB - Official Brand New Physical SIM",
    brand: "Apple",
    category: "phones",
    subcategory: "smartphones",
    price: 1650000,
    originalPrice: 1850000,
    discount: "-11%",
    image: "images/subcategories/phones_smartphones.jpg?v=3",
    rating: 5,
    reviews: 3410,
    keywords: ["iphone", "apple", "iphone 15", "pro max", "ios", "smartphone", "phone", "iphone 15 pro max"]
  },
  {
    id: "prod-ph-2",
    title: "Samsung Galaxy S24 Ultra 5G 512GB - Titanium Black with S-Pen",
    brand: "Samsung",
    category: "phones",
    subcategory: "smartphones",
    price: 1520000,
    originalPrice: 1700000,
    discount: "-10%",
    image: "images/subcategories/phones_smartphones.jpg?v=3",
    rating: 5,
    reviews: 2190,
    keywords: ["samsung", "galaxy", "s24 ultra", "samsung phone", "android", "phone", "5g", "smartphone"]
  },
  {
    id: "prod-ph-3",
    title: "Infinix Note 40 Pro 256GB / 8GB RAM 70W All-Round Fast Charge",
    brand: "Infinix",
    category: "phones",
    subcategory: "smartphones",
    price: 295000,
    originalPrice: 340000,
    discount: "-13%",
    image: "images/subcategories/phones_smartphones.jpg?v=3",
    rating: 5,
    reviews: 1840,
    keywords: ["infinix", "note 40", "infinix phone", "smartphone", "android", "phone", "fast charging"]
  },
  {
    id: "prod-ph-4",
    title: "Tecno Camon 30 256GB / 8GB RAM 50MP Ultra Clear Camera Smartphone",
    brand: "Tecno",
    category: "phones",
    subcategory: "smartphones",
    price: 248000,
    originalPrice: 285000,
    discount: "-13%",
    image: "images/subcategories/phones_smartphones.jpg?v=3",
    rating: 5,
    reviews: 1420,
    keywords: ["tecno", "camon 30", "tecno phone", "smartphone", "android", "phone", "camera phone"]
  },
  {
    id: "prod-ph-5",
    title: "Apple iPad 10th Gen 10.9-Inch Wi-Fi 64GB with Liquid Retina Display",
    brand: "Apple",
    category: "phones",
    subcategory: "tablets",
    price: 535000,
    originalPrice: 620000,
    discount: "-14%",
    image: "images/subcategories/phones_tablets.jpg?v=3",
    rating: 5,
    reviews: 890,
    keywords: ["ipad", "apple", "tablet", "ipad 10", "apple tablet", "retina", "ios tablet"]
  },
  {
    id: "prod-ph-6",
    title: "Samsung Galaxy Tab A9+ 11.0-Inch 64GB Wi-Fi Android Tablet",
    brand: "Samsung",
    category: "phones",
    subcategory: "tablets",
    price: 265000,
    originalPrice: 310000,
    discount: "-15%",
    image: "images/subcategories/phones_tablets.jpg?v=3",
    rating: 5,
    reviews: 540,
    keywords: ["samsung", "tab", "galaxy tab", "tablet", "android tablet", "a9", "samsung tablet"]
  },
  {
    id: "prod-ph-7",
    title: "Oraimo 20W Fast Charging Wall Charger with Type-C Cable",
    brand: "Oraimo",
    category: "phones",
    subcategory: "mobile-accessories",
    price: 9500,
    originalPrice: 13500,
    discount: "-30%",
    image: "images/subcategories/phones_accessories.jpg?v=3",
    rating: 5,
    reviews: 8420,
    keywords: ["oraimo", "charger", "fast charger", "type c", "cable", "adapter", "phone charger"]
  },
  {
    id: "prod-ph-8",
    title: "Apple Watch Series 9 GPS 45mm Midnight Aluminum Case",
    brand: "Apple",
    category: "phones",
    subcategory: "smart-watches",
    price: 510000,
    originalPrice: 580000,
    discount: "-12%",
    image: "images/subcategories/phones_smartwatches.jpg?v=3",
    rating: 5,
    reviews: 730,
    keywords: ["apple watch", "smartwatch", "apple", "series 9", "fitness watch", "watch"]
  },
  {
    id: "prod-ph-9",
    title: "Oraimo Watch 4 Plus 2.01 HD BT Calling Smart Watch with Health Monitor",
    brand: "Oraimo",
    category: "phones",
    subcategory: "smart-watches",
    price: 28500,
    originalPrice: 38000,
    discount: "-25%",
    image: "images/subcategories/phones_smartwatches.jpg?v=3",
    rating: 5,
    reviews: 4120,
    keywords: ["oraimo", "smartwatch", "watch 4", "fitness tracker", "calling watch", "oraimo watch"]
  },

  // --- HEALTH & BEAUTY ---
  {
    id: "prod-hb-1",
    title: "NIVEA Radiant & Beauty Advanced Care Body Lotion 400ml",
    brand: "NIVEA",
    category: "health-beauty",
    subcategory: "skin-care",
    price: 5800,
    originalPrice: 7500,
    discount: "-23%",
    image: "images/subcategories/health_skincare.jpg?v=3",
    rating: 5,
    reviews: 5890,
    keywords: ["nivea", "lotion", "body lotion", "cream", "moisturizer", "skincare", "beauty"]
  },
  {
    id: "prod-hb-2",
    title: "CeraVe Moisturizing Cream with 3 Essential Ceramides 454g",
    brand: "CeraVe",
    category: "health-beauty",
    subcategory: "skin-care",
    price: 18500,
    originalPrice: 24000,
    discount: "-23%",
    image: "images/subcategories/health_skincare.jpg?v=3",
    rating: 5,
    reviews: 3210,
    keywords: ["cerave", "cream", "moisturizer", "ceramides", "face cream", "skincare"]
  },
  {
    id: "prod-hb-3",
    title: "Kemei Professional Cordless Hair Clipper & Beard Trimmer KM-1990",
    brand: "Kemei",
    category: "health-beauty",
    subcategory: "hair-care",
    price: 14500,
    originalPrice: 19500,
    discount: "-26%",
    image: "images/subcategories/health_haircare.jpg?v=3",
    rating: 5,
    reviews: 4120,
    keywords: ["clipper", "kemei", "hair trimmer", "barber clipper", "shaver", "hair cut"]
  },
  {
    id: "prod-hb-4",
    title: "Dior Sauvage Eau De Parfum Long-Lasting Men's Spray 100ml",
    brand: "Dior",
    category: "health-beauty",
    subcategory: "fragrances",
    price: 185000,
    originalPrice: 220000,
    discount: "-16%",
    image: "images/subcategories/health_fragrances.jpg?v=3",
    rating: 5,
    reviews: 1890,
    keywords: ["perfume", "dior", "sauvage", "fragrance", "cologne", "men perfume", "body spray"]
  },
  {
    id: "prod-hb-5",
    title: "Lattafa Khamrah Luxury Unisex Eau De Parfum Arabian Spray 100ml",
    brand: "Lattafa",
    category: "health-beauty",
    subcategory: "fragrances",
    price: 34500,
    originalPrice: 45000,
    discount: "-23%",
    image: "images/subcategories/health_fragrances.jpg?v=3",
    rating: 5,
    reviews: 2750,
    keywords: ["lattafa", "khamrah", "perfume", "arabian perfume", "fragrance", "oud", "unisex perfume"]
  },
  {
    id: "prod-hb-6",
    title: "Maybelline Super Stay Matte Ink Longwear Liquid Lipstick",
    brand: "Maybelline",
    category: "health-beauty",
    subcategory: "makeup",
    price: 7500,
    originalPrice: 9800,
    discount: "-23%",
    image: "images/subcategories/health_makeup.jpg?v=3",
    rating: 5,
    reviews: 3480,
    keywords: ["maybelline", "lipstick", "matte lipstick", "makeup", "cosmetics", "lip gloss"]
  },

  // --- HOME & OFFICE ---
  {
    id: "prod-ho-1",
    title: "Royal 7-Seater Luxury Fabric Living Room Sofa Set",
    brand: "Royal Furnishings",
    category: "home-office",
    subcategory: "home-furniture",
    price: 580000,
    originalPrice: 680000,
    discount: "-15%",
    image: "images/subcategories/home_furniture.jpg?v=3",
    rating: 5,
    reviews: 310,
    keywords: ["sofa", "couch", "chair", "living room", "furniture", "settee", "cushion"]
  },
  {
    id: "prod-ho-2",
    title: "Mouka Foam Regal Orthopedic Queen Size Mattress (6x6x10)",
    brand: "Mouka Foam",
    category: "home-office",
    subcategory: "home-furniture",
    price: 195000,
    originalPrice: 235000,
    discount: "-17%",
    image: "images/subcategories/home_furniture.jpg?v=3",
    rating: 5,
    reviews: 840,
    keywords: ["mouka foam", "mattress", "bed", "orthopedic", "foam", "queen size"]
  },
  {
    id: "prod-ho-3",
    title: "Ergonomic High-Back Executive Mesh Swivel Office Chair",
    brand: "OfficePro",
    category: "home-office",
    subcategory: "office-furniture",
    price: 72000,
    originalPrice: 92000,
    discount: "-22%",
    image: "images/subcategories/home_office_furniture.jpg?v=3",
    rating: 5,
    reviews: 1240,
    keywords: ["office chair", "chair", "swivel chair", "executive chair", "desk chair", "mesh chair"]
  },
  {
    id: "prod-ho-4",
    title: "Modern L-Shaped Executive Computer Study Office Desk",
    brand: "SmartSpace",
    category: "home-office",
    subcategory: "office-furniture",
    price: 115000,
    originalPrice: 145000,
    discount: "-21%",
    image: "images/subcategories/home_office_furniture.jpg?v=3",
    rating: 5,
    reviews: 490,
    keywords: ["desk", "office desk", "table", "computer desk", "study desk", "workstation"]
  },
  {
    id: "prod-ho-5",
    title: "Luxury Heavyweight Velvet Eyelet Blackout Window Curtains (Set of 2)",
    brand: "DecoHome",
    category: "home-office",
    subcategory: "home-decor",
    price: 26000,
    originalPrice: 35000,
    discount: "-26%",
    image: "images/subcategories/home_decor.jpg?v=3",
    rating: 5,
    reviews: 1120,
    keywords: ["curtain", "curtains", "window blind", "blackout", "drapery", "decor"]
  },
  {
    id: "prod-ho-6",
    title: "MasterChef 10-Piece Heavy Gauge Non-Stick Cookware Pots Set",
    brand: "MasterChef",
    category: "home-office",
    subcategory: "kitchen-dining",
    price: 48000,
    originalPrice: 65000,
    discount: "-26%",
    image: "images/subcategories/home_kitchen_dining.jpg?v=3",
    rating: 5,
    reviews: 2310,
    keywords: ["pots", "pot", "pan", "cookware", "frying pan", "kitchen pots", "cooking pots"]
  },

  // --- ELECTRONICS ---
  {
    id: "prod-el-1",
    title: "Hisense 55-Inch 4K UHD Smart Frameless LED TV with HDR & Dolby",
    brand: "Hisense",
    category: "electronics",
    subcategory: "televisions",
    price: 365000,
    originalPrice: 430000,
    discount: "-15%",
    image: "images/subcategories/electronics_tv.jpg?v=3",
    rating: 5,
    reviews: 1840,
    keywords: ["hisense", "tv", "55 inch", "smart tv", "4k tv", "television", "hisense tv"]
  },
  {
    id: "prod-el-2",
    title: "Samsung 65-Inch Crystal UHD 4K Smart Television with Tizen OS",
    brand: "Samsung",
    category: "electronics",
    subcategory: "televisions",
    price: 720000,
    originalPrice: 850000,
    discount: "-15%",
    image: "images/subcategories/electronics_tv.jpg?v=3",
    rating: 5,
    reviews: 940,
    keywords: ["samsung", "samsung tv", "tv", "65 inch", "smart tv", "4k", "crystal uhd"]
  },
  {
    id: "prod-el-3",
    title: "JBL Boombox 3 Portable Bluetooth Waterproof Speaker - Massive Bass",
    brand: "JBL",
    category: "electronics",
    subcategory: "audio-sound",
    price: 520000,
    originalPrice: 600000,
    discount: "-13%",
    image: "images/subcategories/electronics_audio.jpg?v=3",
    rating: 5,
    reviews: 1320,
    keywords: ["jbl", "speaker", "bluetooth speaker", "boombox", "sound system", "audio", "wireless speaker"]
  },
  {
    id: "prod-el-4",
    title: "Canon EOS 2000D Rebel T7 DSLR Camera with 18-55mm IS II Lens",
    brand: "Canon",
    category: "electronics",
    subcategory: "cameras-optics",
    price: 480000,
    originalPrice: 550000,
    discount: "-13%",
    image: "images/subcategories/electronics_cameras.jpg?v=3",
    rating: 5,
    reviews: 580,
    keywords: ["canon", "camera", "dslr", "canon camera", "photography", "lens", "video camera"]
  },
  {
    id: "prod-el-5",
    title: "Maxmech 3.8kW Electric Start Heavy Duty Petrol Generator",
    brand: "Maxmech",
    category: "electronics",
    subcategory: "power-solar",
    price: 265000,
    originalPrice: 315000,
    discount: "-16%",
    image: "images/subcategories/electronics_solar.jpg?v=3",
    rating: 5,
    reviews: 1980,
    keywords: ["generator", "gen", "maxmech", "petrol generator", "power", "electricity", "electric start"]
  },
  {
    id: "prod-el-6",
    title: "Luminous 3.5kVA / 48V Pure Sine Wave Solar Home Inverter",
    brand: "Luminous",
    category: "electronics",
    subcategory: "power-solar",
    price: 380000,
    originalPrice: 440000,
    discount: "-14%",
    image: "images/subcategories/electronics_solar.jpg?v=3",
    rating: 5,
    reviews: 860,
    keywords: ["inverter", "luminous", "solar inverter", "pure sine wave", "ups", "solar", "battery inverter"]
  },
  {
    id: "prod-el-7",
    title: "Felicity 300W Monocrystalline High Efficiency Solar Panel Module",
    brand: "Felicity",
    category: "electronics",
    subcategory: "power-solar",
    price: 68000,
    originalPrice: 85000,
    discount: "-20%",
    image: "images/subcategories/electronics_solar.jpg?v=3",
    rating: 5,
    reviews: 1420,
    keywords: ["solar panel", "solar", "panel", "felicity", "green energy", "monocrystalline"]
  },

  // --- FASHION ---
  {
    id: "prod-fas-1",
    title: "Men's Classic Slim Fit Formal Long Sleeve Dress Shirt & Trousers",
    brand: "TM Lewin",
    category: "fashion",
    subcategory: "mens-clothing",
    price: 28500,
    originalPrice: 38000,
    discount: "-25%",
    image: "images/subcategories/fashion_mens.jpg?v=3",
    rating: 5,
    reviews: 2410,
    keywords: ["shirt", "trousers", "men clothes", "formal shirt", "mens fashion", "suit", "clothing"]
  },
  {
    id: "prod-fas-2",
    title: "Men's Breathable Air Cushion Athletic Running Sneakers Shoes",
    brand: "Nike Style",
    category: "fashion",
    subcategory: "mens-clothing",
    price: 22000,
    originalPrice: 30000,
    discount: "-27%",
    image: "images/subcategories/fashion_mens.jpg?v=3",
    rating: 5,
    reviews: 4890,
    keywords: ["sneakers", "shoes", "men shoes", "running shoes", "footwear", "athletic shoes", "trainers"]
  },
  {
    id: "prod-fas-3",
    title: "Elegant High-Waist Pleated Evening Dinner Gown Dress",
    brand: "Zara Inspired",
    category: "fashion",
    subcategory: "womens-clothing",
    price: 32000,
    originalPrice: 42000,
    discount: "-24%",
    image: "images/subcategories/fashion_womens.jpg?v=3",
    rating: 5,
    reviews: 1670,
    keywords: ["dress", "gown", "dinner gown", "women clothes", "female dress", "skirt", "fashion"]
  },
  {
    id: "prod-fas-4",
    title: "Curren Men's Luxury Chronograph Waterproof Quartz Wristwatch",
    brand: "Curren",
    category: "fashion",
    subcategory: "watches-jewelry",
    price: 16500,
    originalPrice: 24000,
    discount: "-31%",
    image: "images/subcategories/fashion_watches_jewelry.jpg?v=3",
    rating: 5,
    reviews: 3240,
    keywords: ["watch", "wristwatch", "curren", "mens watch", "chronograph", "leather watch"]
  },
  {
    id: "prod-fas-5",
    title: "Orthopedic Primary School Backpack with Matching Lunch Bag",
    brand: "SchoolPro",
    category: "fashion",
    subcategory: "kids-fashion",
    price: 14500,
    originalPrice: 20000,
    discount: "-28%",
    image: "images/subcategories/fashion_kids.jpg?v=3",
    rating: 5,
    reviews: 2890,
    keywords: ["school bag", "backpack", "kids bag", "children bag", "lunch bag", "kids fashion"]
  },

  // --- SUPERMARKET ---
  {
    id: "prod-sup-1",
    title: "Mama Gold Premium Long Grain Parboiled Nigerian Rice 50kg Bag",
    brand: "Mama Gold",
    category: "supermarket",
    subcategory: "food-cupboard",
    price: 82000,
    originalPrice: 95000,
    discount: "-14%",
    image: "images/subcategories/supermarket_food.jpg?v=3",
    rating: 5,
    reviews: 6420,
    keywords: ["rice", "bag of rice", "mama gold", "food", "grains", "parboiled rice", "supermarket"]
  },
  {
    id: "prod-sup-2",
    title: "Golden Penny Pure Soya Vegetable Cooking Oil 5 Litres",
    brand: "Golden Penny",
    category: "supermarket",
    subcategory: "food-cupboard",
    price: 14800,
    originalPrice: 18500,
    discount: "-20%",
    image: "images/subcategories/supermarket_food.jpg?v=3",
    rating: 5,
    reviews: 4510,
    keywords: ["oil", "cooking oil", "vegetable oil", "golden penny", "groundnut oil", "food"]
  },
  {
    id: "prod-sup-3",
    title: "Peak Instant Full Cream Evaporated Milk Powder 400g Tin",
    brand: "Peak Milk",
    category: "supermarket",
    subcategory: "drinks-beverages",
    price: 4200,
    originalPrice: 5200,
    discount: "-19%",
    image: "images/subcategories/supermarket_drinks.jpg?v=3",
    rating: 5,
    reviews: 8940,
    keywords: ["milk", "peak", "peak milk", "powdered milk", "dairy", "beverage", "tea"]
  },
  {
    id: "prod-sup-4",
    title: "Nestle Milo Rich Chocolate Malt Food Drink 800g Refill Pack",
    brand: "Milo",
    category: "supermarket",
    subcategory: "drinks-beverages",
    price: 4600,
    originalPrice: 5800,
    discount: "-21%",
    image: "images/subcategories/supermarket_drinks.jpg?v=3",
    rating: 5,
    reviews: 7810,
    keywords: ["milo", "chocolate", "beverage", "tea", "drink", "nestle", "malt drink"]
  },
  {
    id: "prod-sup-5",
    title: "Ariel Automatic Machine & Hand Wash Laundry Powder Detergent 2kg",
    brand: "Ariel",
    category: "supermarket",
    subcategory: "cleaning-laundry",
    price: 4900,
    originalPrice: 6200,
    discount: "-21%",
    image: "images/subcategories/supermarket_cleaning.jpg?v=3",
    rating: 5,
    reviews: 5240,
    keywords: ["detergent", "ariel", "washing powder", "soap", "laundry", "cleaning"]
  },
  {
    id: "prod-sup-6",
    title: "Titus Sardines in Pure Vegetable Oil 125g (Carton of 50 Cans)",
    brand: "Titus",
    category: "supermarket",
    subcategory: "canned-packaged",
    price: 42000,
    originalPrice: 50000,
    discount: "-16%",
    image: "images/subcategories/supermarket_packaged.jpg?v=3",
    rating: 5,
    reviews: 3820,
    keywords: ["sardine", "titus", "titus sardine", "canned fish", "canned food", "canned"]
  },

  // --- COMPUTING ---
  {
    id: "prod-comp-1",
    title: "HP 15 Intel Core i5 16GB RAM 512GB SSD 15.6 FHD Windows 11 Laptop",
    brand: "HP",
    category: "computing",
    subcategory: "laptops",
    price: 520000,
    originalPrice: 610000,
    discount: "-15%",
    image: "images/subcategories/computing_laptops.jpg?v=3",
    rating: 5,
    reviews: 2190,
    keywords: ["hp", "laptop", "hp laptop", "core i5", "computer", "notebook", "windows 11"]
  },
  {
    id: "prod-comp-2",
    title: "Apple MacBook Air 13.6-Inch M2 Chip 8GB RAM 256GB SSD - Space Gray",
    brand: "Apple",
    category: "computing",
    subcategory: "laptops",
    price: 1350000,
    originalPrice: 1550000,
    discount: "-13%",
    image: "images/subcategories/computing_laptops.jpg?v=3",
    rating: 5,
    reviews: 1420,
    keywords: ["macbook", "apple", "macbook air", "laptop", "m2", "apple laptop", "notebook"]
  },
  {
    id: "prod-comp-3",
    title: "Dell Latitude 5420 Business Ultrabook Intel Core i7 16GB 512GB SSD",
    brand: "Dell",
    category: "computing",
    subcategory: "laptops",
    price: 580000,
    originalPrice: 690000,
    discount: "-16%",
    image: "images/subcategories/computing_laptops.jpg?v=3",
    rating: 5,
    reviews: 1180,
    keywords: ["dell", "dell laptop", "latitude", "core i7", "laptop", "ultrabook", "computer"]
  },
  {
    id: "prod-comp-4",
    title: "Samsung 27-Inch Curved Full HD 75Hz Eye Saver LED Monitor",
    brand: "Samsung",
    category: "computing",
    subcategory: "desktops-monitors",
    price: 165000,
    originalPrice: 198000,
    discount: "-17%",
    image: "images/subcategories/computing_desktops.jpg?v=3",
    rating: 5,
    reviews: 840,
    keywords: ["monitor", "samsung monitor", "screen", "computer screen", "curved monitor", "pc monitor"]
  },
  {
    id: "prod-comp-5",
    title: "Logitech MX Master 3S Advanced Wireless Ergonomic Bluetooth Mouse",
    brand: "Logitech",
    category: "computing",
    subcategory: "computer-accessories",
    price: 110000,
    originalPrice: 135000,
    discount: "-19%",
    image: "images/subcategories/computing_accessories.jpg?v=3",
    rating: 5,
    reviews: 2140,
    keywords: ["logitech", "mouse", "wireless mouse", "bluetooth mouse", "mx master", "accessories"]
  },
  {
    id: "prod-comp-6",
    title: "HP LaserJet Pro MFP M130a All-in-One Monochrome Laser Printer",
    brand: "HP",
    category: "computing",
    subcategory: "networking-printers",
    price: 185000,
    originalPrice: 225000,
    discount: "-18%",
    image: "images/subcategories/computing_printers.jpg?v=3",
    rating: 5,
    reviews: 950,
    keywords: ["printer", "hp printer", "laser printer", "scanner", "photocopy", "all in one printer"]
  },

  // --- BABY PRODUCTS ---
  {
    id: "prod-baby-1",
    title: "Pampers Premium Protection Baby Diapers Jumbo Pack Size 3 (76 Pcs)",
    brand: "Pampers",
    category: "baby",
    subcategory: "diapering-wipes",
    price: 16800,
    originalPrice: 21500,
    discount: "-22%",
    image: "images/subcategories/baby_diapers.jpg?v=3",
    rating: 5,
    reviews: 7420,
    keywords: ["pampers", "diaper", "diapers", "baby diaper", "baby", "pampers diaper", "infant"]
  },
  {
    id: "prod-baby-2",
    title: "Huggies Natural Care Sensitive Aloe Baby Wipes (4 Packs x 56 Wipes)",
    brand: "Huggies",
    category: "baby",
    subcategory: "diapering-wipes",
    price: 7200,
    originalPrice: 9500,
    discount: "-24%",
    image: "images/subcategories/baby_diapers.jpg?v=3",
    rating: 5,
    reviews: 5120,
    keywords: ["wipes", "baby wipes", "huggies", "sensitive wipes", "baby cleaning"]
  },
  {
    id: "prod-baby-3",
    title: "Philips Avent Natural Baby Feeding Bottles 260ml (Twin Pack)",
    brand: "Philips Avent",
    category: "baby",
    subcategory: "baby-feeding",
    price: 18500,
    originalPrice: 24000,
    discount: "-23%",
    image: "images/subcategories/baby_feeding.jpg?v=3",
    rating: 5,
    reviews: 3210,
    keywords: ["feeding bottle", "avent", "baby bottle", "bottle", "nursing", "philips"]
  },
  {
    id: "prod-baby-4",
    title: "Chicco Lightweight One-Hand Compact Fold Baby Stroller Buggy",
    brand: "Chicco",
    category: "baby",
    subcategory: "baby-gear",
    price: 115000,
    originalPrice: 145000,
    discount: "-21%",
    image: "images/subcategories/baby_gear.jpg?v=3",
    rating: 5,
    reviews: 890,
    keywords: ["stroller", "baby stroller", "pram", "baby carriage", "chicco", "baby gear"]
  },

  // --- GAMING ---
  {
    id: "prod-gam-1",
    title: "Sony PlayStation 5 PS5 Slim Console Digital Edition 1TB",
    brand: "Sony",
    category: "gaming",
    subcategory: "consoles",
    price: 780000,
    originalPrice: 890000,
    discount: "-12%",
    image: "images/subcategories/gaming_consoles.jpg?v=3",
    rating: 5,
    reviews: 2410,
    keywords: ["ps5", "playstation", "playstation 5", "sony", "console", "gaming console", "ps5 slim"]
  },
  {
    id: "prod-gam-2",
    title: "Microsoft Xbox Series X 1TB High Performance Gaming Console",
    brand: "Microsoft",
    category: "gaming",
    subcategory: "consoles",
    price: 740000,
    originalPrice: 850000,
    discount: "-13%",
    image: "images/subcategories/gaming_consoles.jpg?v=3",
    rating: 5,
    reviews: 1340,
    keywords: ["xbox", "xbox series x", "microsoft", "console", "gaming", "series x"]
  },
  {
    id: "prod-gam-3",
    title: "EA SPORTS FC 24 (FIFA 24) PlayStation 5 Standard Disc Edition",
    brand: "EA Sports",
    category: "gaming",
    subcategory: "video-games",
    price: 52000,
    originalPrice: 65000,
    discount: "-20%",
    image: "images/subcategories/gaming_videogames.jpg?v=3",
    rating: 5,
    reviews: 4890,
    keywords: ["fifa", "fc 24", "fifa 24", "football game", "ps5 game", "disc", "ea sports"]
  },
  {
    id: "prod-gam-4",
    title: "Grand Theft Auto V (GTA 5) PS5 Next-Gen Enhanced Edition",
    brand: "Rockstar Games",
    category: "gaming",
    subcategory: "video-games",
    price: 38000,
    originalPrice: 48000,
    discount: "-21%",
    image: "images/subcategories/gaming_videogames.jpg?v=3",
    rating: 5,
    reviews: 5820,
    keywords: ["gta", "gta 5", "grand theft auto", "ps5 game", "rockstar", "video game"]
  },
  {
    id: "prod-gam-5",
    title: "Sony PlayStation 5 DualSense Wireless Controller - Pure White",
    brand: "Sony",
    category: "gaming",
    subcategory: "gaming-accessories",
    price: 75000,
    originalPrice: 90000,
    discount: "-17%",
    image: "images/subcategories/gaming_accessories.jpg?v=3",
    rating: 5,
    reviews: 3120,
    keywords: ["ps5 controller", "controller", "dualsense", "gamepad", "wireless controller", "pad"]
  },

  // --- OTHER CATEGORIES ---
  {
    id: "prod-oth-1",
    title: "Professional Split Air Conditioner Installation & Gas Top-Up Service",
    brand: "NKEM Services",
    category: "other",
    subcategory: "services",
    price: 25000,
    originalPrice: 35000,
    discount: "-29%",
    image: "images/subcategories/other_services.jpg?v=3",
    rating: 5,
    reviews: 940,
    keywords: ["ac installation", "repair", "service", "air conditioner service", "gas filling", "technician"]
  },
  {
    id: "prod-oth-2",
    title: "PowerMax Fitness 2.5HP Motorized Folding Treadmill with LCD Display",
    brand: "PowerMax",
    category: "other",
    subcategory: "sports-fitness",
    price: 450000,
    originalPrice: 530000,
    discount: "-15%",
    image: "images/subcategories/other_sports.jpg?v=3",
    rating: 5,
    reviews: 620,
    keywords: ["treadmill", "gym", "fitness", "running machine", "exercise", "workout"]
  },
  {
    id: "prod-oth-3",
    title: "Atomic Habits by James Clear - Original Best-Selling Paperback",
    brand: "Penguin",
    category: "other",
    subcategory: "books-stationery",
    price: 6500,
    originalPrice: 9000,
    discount: "-28%",
    image: "images/subcategories/other_books.jpg?v=3",
    rating: 5,
    reviews: 3890,
    keywords: ["book", "atomic habits", "novel", "stationery", "reading", "james clear"]
  },
  {
    id: "prod-oth-4",
    title: "Pedigree Complete Adult Nutrition Dry Dog Food Real Chicken 15kg",
    brand: "Pedigree",
    category: "other",
    subcategory: "pets-animals",
    price: 36000,
    originalPrice: 44000,
    discount: "-18%",
    image: "images/subcategories/other_pets.jpg?v=3",
    rating: 5,
    reviews: 1450,
    keywords: ["dog food", "pedigree", "pet food", "dog", "pets", "pet supply"]
  }
];

// ========================================================
// SMART ACCURATE SEARCH & RELEVANCE ENGINE
// Multi-term token matching, brand scoring, zero hallucination
// ========================================================
window.NKEMMART_SEARCH = function(rawQuery, catFilter, subFilter) {
  var catalog = window.NKEMMART_CATALOG || [];
  var q = (rawQuery || '').trim().toLowerCase();

  // If filtered by category / subcategory
  var pool = catalog;
  if (catFilter) {
    pool = pool.filter(function(p) { return p.category === catFilter; });
  }
  if (subFilter) {
    pool = pool.filter(function(p) { return p.subcategory === subFilter; });
  }

  // If no search query, return the pool as is
  if (!q) {
    return pool.slice();
  }

  // Clean and tokenize query (strip punctuation, extract non-empty words)
  var cleanQ = q.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  var tokens = cleanQ.split(' ').filter(function(t) { return t.length > 0; });

  if (tokens.length === 0) {
    return pool.slice();
  }

  // Joined alias lookup for compound words (e.g., "powerbank" -> "power bank", "smarttv" -> "smart tv")
  var aliases = {
    'airfryer': 'air fryer',
    'powerbank': 'power bank',
    'smarttv': 'smart tv',
    'smartwatch': 'smart watch',
    'homeappliance': 'appliances',
    'smartphone': 'smartphones'
  };
  var expandedQuery = aliases[cleanQ] ? aliases[cleanQ] : cleanQ;

  var scored = [];

  pool.forEach(function(item) {
    var titleLower = (item.title || '').toLowerCase();
    var brandLower = (item.brand || '').toLowerCase();
    var catLower = (item.category || '').toLowerCase();
    var subLower = (item.subcategory || '').toLowerCase();
    var kwCombined = (item.keywords || []).join(' ').toLowerCase();

    var score = 0;

    // 1. Exact phrase matches (highest priority)
    if (titleLower.indexOf(cleanQ) !== -1 || titleLower.indexOf(expandedQuery) !== -1) {
      score += 150;
    }
    if (brandLower === cleanQ || brandLower.indexOf(cleanQ) !== -1) {
      score += 120;
    }
    if (kwCombined.indexOf(cleanQ) !== -1 || kwCombined.indexOf(expandedQuery) !== -1) {
      score += 90;
    }
    if (catLower === cleanQ || subLower === cleanQ) {
      score += 80;
    }

    // 2. Tokenized multi-word matching
    var allTokensMatch = true;
    var tokenMatchCount = 0;

    tokens.forEach(function(tok) {
      var inTitle = titleLower.indexOf(tok) !== -1;
      var inBrand = brandLower.indexOf(tok) !== -1;
      var inKw = kwCombined.indexOf(tok) !== -1;
      var inCat = catLower.indexOf(tok) !== -1 || subLower.indexOf(tok) !== -1;

      if (inTitle || inBrand || inKw || inCat) {
        tokenMatchCount++;
        if (inTitle) score += 35;
        if (inBrand) score += 30;
        if (inKw) score += 25;
        if (inCat) score += 15;
      } else {
        allTokensMatch = false;
      }
    });

    // Bonus if all words in query match this product
    if (allTokensMatch && tokens.length > 1) {
      score += 60;
    }

    // Only include if at least one meaningful token matched and score is positive
    if (tokenMatchCount > 0 && score > 0) {
      scored.push({ item: item, score: score });
    }
  });

  // Sort descending by relevance score
  scored.sort(function(a, b) {
    return b.score - a.score;
  });

  return scored.map(function(s) { return s.item; });
};

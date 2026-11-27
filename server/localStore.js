const fs = require('fs');
const path = require('path');

const isServerless = Boolean(
  process.env.LAMBDA_TASK_ROOT ||
  process.env.NETLIFY ||
  process.env.AWS_EXECUTION_ENV ||
  process.env.VERCEL
);

const DB_FILE = isServerless
  ? path.join('/tmp', 'local-db.json')
  : path.join(__dirname, '../data/local-db.json');

// Initial seed snacks for instant hostel POS demo
const DEFAULT_PRODUCTS = [
  {
    _id: 'prod_1',
    name: 'Lays Magic Masala',
    colour: '#3B82F6',
    price: 20,
    quantity: 18,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'prod_2',
    name: 'Lays American Style Cream & Onion',
    colour: '#10B981',
    price: 20,
    quantity: 12,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'prod_3',
    name: 'Kurkure Masala Munch',
    colour: '#F97316',
    price: 10,
    quantity: 25,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'prod_4',
    name: 'Bingo Mad Angles Achaari Masti',
    colour: '#EF4444',
    price: 20,
    quantity: 3, // Low stock demo!
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'prod_5',
    name: 'Doritos Cheese Supreme',
    colour: '#F59E0B',
    price: 30,
    quantity: 0, // Out of stock demo!
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'prod_6',
    name: 'Uncle Chipps Spicy Treat',
    colour: '#8B5CF6',
    price: 20,
    quantity: 15,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'prod_7',
    name: "Haldiram's Aloo Bhujia",
    colour: '#EC4899',
    price: 10,
    quantity: 20,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_SETTINGS = {
  businessName: 'ChipStock',
  lowStockThreshold: 5,
  currency: 'INR',
  timezone: 'Asia/Kolkata',
};

class LocalStore {
  constructor() {
    this.data = {
      products: [],
      bills: [],
      stockMovements: [],
      settings: DEFAULT_SETTINGS,
    };
    this.init();
  }

  init() {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.products || this.data.products.length === 0) {
          this.data.products = DEFAULT_PRODUCTS;
          this.save();
        }
      } else {
        this.data = {
          products: DEFAULT_PRODUCTS,
          bills: [],
          stockMovements: [],
          settings: DEFAULT_SETTINGS,
        };
        this.save();
      }
    } catch (err) {
      console.warn('Failed to load local DB file, initializing in-memory store:', err.message);
      this.data = {
        products: DEFAULT_PRODUCTS,
        bills: [],
        stockMovements: [],
        settings: DEFAULT_SETTINGS,
      };
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Failed to write local DB file:', err.message);
    }
  }

  // Generate unique IDs
  generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
}

const localStore = new LocalStore();
module.exports = localStore;

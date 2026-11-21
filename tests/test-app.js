const test = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

test('Admin Password Hashing & Verification', async () => {
  const plain = 'chipstock123';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(plain, salt);

  assert.ok(hash.startsWith('$2a$') || hash.startsWith('$2b$'), 'Hash should be valid bcrypt');
  const isMatch = await bcrypt.compare(plain, hash);
  assert.strictEqual(isMatch, true, 'Password comparison should succeed');

  const wrongMatch = await bcrypt.compare('wrongpassword', hash);
  assert.strictEqual(wrongMatch, false, 'Wrong password comparison should fail');
});

test('JWT Signing and Verification', () => {
  const secret = 'test_secret_key';
  const token = jwt.sign({ role: 'admin' }, secret, { expiresIn: '1d' });
  assert.ok(token && typeof token === 'string', 'Token should be a string');

  const decoded = jwt.verify(token, secret);
  assert.strictEqual(decoded.role, 'admin');

  assert.throws(() => {
    jwt.verify(token, 'wrong_secret');
  });
});

test('Bill Calculation Logic & Price Snapshots', () => {
  const products = [
    { _id: '1', name: 'Lays Magic Masala', price: 20, quantity: 15, colour: '#3B82F6' },
    { _id: '2', name: 'Kurkure Masala Munch', price: 10, quantity: 8, colour: '#F97316' },
    { _id: '3', name: 'Bingo Mad Angles', price: 20, quantity: 4, colour: '#EF4444' },
  ];

  const cart = [
    { productId: '1', quantity: 2 }, // 2 * 20 = 40
    { productId: '2', quantity: 3 }, // 3 * 10 = 30
  ];

  let calculatedTotal = 0;
  const itemsSnapshot = [];

  for (const item of cart) {
    const product = products.find((p) => p._id === item.productId);
    assert.ok(product, 'Product should exist');
    assert.ok(product.quantity >= item.quantity, 'Stock should be sufficient');

    const lineTotal = product.price * item.quantity;
    calculatedTotal += lineTotal;

    itemsSnapshot.push({
      productId: product._id,
      productName: product.name,
      colour: product.colour,
      unitPrice: product.price,
      quantity: item.quantity,
      lineTotal,
    });
  }

  assert.strictEqual(calculatedTotal, 70, 'Calculated total should be exactly 70');
  assert.strictEqual(itemsSnapshot.length, 2);
  assert.strictEqual(itemsSnapshot[0].unitPrice, 20);
  assert.strictEqual(itemsSnapshot[1].unitPrice, 10);
});

test('Stock Over-Selling Prevention Logic', () => {
  const product = { name: 'Uncle Chipps', quantity: 3 };
  const requestedQuantity = 5;

  const isAllowed = requestedQuantity <= product.quantity;
  assert.strictEqual(isAllowed, false, 'Should deny selling 5 when only 3 in stock');
});

test('Stock Addition vs Correction distinction', () => {
  let stock = 10;
  
  // Addition (+5)
  const addAmount = 5;
  stock = stock + addAmount;
  assert.strictEqual(stock, 15, 'Stock after addition should be 15');

  // Correction (Manual replacement to 12 with reason)
  const correctedCount = 12;
  const previous = stock;
  const diff = correctedCount - previous;
  stock = correctedCount;

  assert.strictEqual(stock, 12, 'Stock after correction should be 12');
  assert.strictEqual(diff, -3, 'Difference logged in movement history should be -3');
});

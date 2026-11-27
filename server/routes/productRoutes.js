const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authMiddleware } = require('../middleware/auth');

// Public route for View Stock mode (no admin authentication needed)
router.get('/public', productController.getPublicProducts);

router.use(authMiddleware);

router.get('/', productController.getProducts);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
router.post('/:id/add-stock', productController.addStock);
router.post('/:id/adjust-stock', productController.adjustStock);
router.get('/:id/movements', productController.getProductMovements);

module.exports = router;

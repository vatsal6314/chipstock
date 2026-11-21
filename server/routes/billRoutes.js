const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', billController.createBill);
router.get('/', billController.getBills);
router.get('/:id', billController.getBillById);
router.patch('/:id/payment', billController.updatePaymentStatus);

module.exports = router;

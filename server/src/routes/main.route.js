const express = require('express');
const mainController = require('../controllers/main.controller');
const router = express.Router();

router.get('/getTraffic', mainController.getTraffic);
router.get('/getContracts', mainController.getContracts);
router.post('/addContract', mainController.addContract);
router.post('/removeContract', mainController.removeContract);

module.exports = router;
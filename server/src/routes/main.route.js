const express = require('express');
const mainController = require('../controllers/main.controller');
const router = express.Router();

router.get('/list', mainController.list);
router.post('/addContract', mainController.addContract);

module.exports = router;
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
	res.send('This is the user route get function.');
});

module.exports = router;

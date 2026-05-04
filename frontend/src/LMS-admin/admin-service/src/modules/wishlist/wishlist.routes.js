const router = require('express').Router();
const c = require('./wishlist.controller');

/**
 * User wishlist add/remove
 * Laravel source: WishlistController
 *
 * TODO: port Laravel route definitions from routes/web.php / routes/api.php.
 * Mount under /api/wishlist from src/modules/index.js.
 */
router.get('/', c.index);
router.get('/:id', c.show);

module.exports = router;

const { Hono } = require("hono");
const homeController = require("../controllers/homecontroller");

const router = new Hono();
router.get("/", homeController.home);

module.exports = router;

const router = require("express").Router();
const path = require("path");
const authController = require("../controllers/authController")
const { authenticateCookie } = require("../middleware/authMiddleware");

router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../views/index.html"))
})

router.get("/login", authController.getLoginForm);
router.post("/login", authController.login);
router.get('/dashboard', authenticateCookie, authController.dashboard);

module.exports = router;
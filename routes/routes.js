const router = require("express").Router();
const authController = require("../controllers/authController")
const { authenticateCookie } = require("../middleware/authMiddleware");

router.get("/", (req, res) => {
    res.send("Welcome to the chat home page!!")
})

router.get("/login", authController.getLoginForm);
router.post("/login", authController.login);
router.get('/dashboard', authenticateCookie, authController.dashboard);

module.exports = router;
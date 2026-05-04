const authService = require('../services/AuthService');
const { asyncHandler } = require('../middlewares/error');

exports.login = asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    res.json(result);
});

exports.me = asyncHandler(async (req, res) => {
    const user = await authService.me(req.user.id);
    res.json({ user });
});

exports.logout = asyncHandler(async (_req, res) => {
    res.json({ message: 'Logged out' });
});

const service = require('./blog.service');
const asyncHandler = require('../../shared/utils/asyncHandler');

/**
 * Blog posts, categories, comments, likes
 * TODO: mirror the CRUD/custom actions from BlogController, BlogCategoryController, BlogComment.
 */
exports.index = asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
});

exports.show = asyncHandler(async (req, res) => {
  res.json(await service.findById(req.params.id));
});

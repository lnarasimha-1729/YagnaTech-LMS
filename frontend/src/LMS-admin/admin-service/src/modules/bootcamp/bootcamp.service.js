const AppError = require('../../shared/errors/AppError');
// const models = require('../../models');
// Pull in the specific models this domain owns, e.g. { Course } = models.

/**
 * Bootcamp programs, modules, live classes, resources, purchases
 * TODO: implement business logic ported from Frontend/BootcampController, Admin/BootcampController, BootcampModule, BootcampLiveClass, BootcampResource.
 */

async function list(/* query */) {
  // TODO: paginate + filter. Use shared/utils/pagination.js.
  return { data: [], meta: { total: 0 } };
}

async function findById(id) {
  // TODO: findByPk + 404
  throw new AppError(`bootcamp #${id} not found`, 404);
}

module.exports = { list, findById };

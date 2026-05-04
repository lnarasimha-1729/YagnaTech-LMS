/**
 * Turns ?page=1&perPage=10 query into Sequelize limit/offset.
 * Mirrors the shape of Laravel's LengthAwarePaginator response.
 */
function parsePagination(query, defaults = { page: 1, perPage: 10, max: 100 }) {
  const page = Math.max(1, parseInt(query.page || defaults.page, 10) || 1);
  const perPage = Math.min(
    defaults.max,
    Math.max(1, parseInt(query.perPage || defaults.perPage, 10) || defaults.perPage)
  );
  return { page, perPage, limit: perPage, offset: (page - 1) * perPage };
}

function paginated(rows, count, { page, perPage }) {
  return {
    data: rows,
    meta: {
      total: count,
      per_page: perPage,
      current_page: page,
      last_page: Math.max(1, Math.ceil(count / perPage)),
      has_more: page * perPage < count,
    },
  };
}

module.exports = { parsePagination, paginated };

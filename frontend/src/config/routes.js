// Proxy-based API/ROUTES stubs. Any uppercase key like `API.ADMIN_DASHBOARD_STATS`
// resolves to `/admin/dashboard/stats` (prefix stripped when not ADMIN, lowercased,
// underscores → slashes). Function-style calls like `API.ADMIN_COURSE(id)` append the arg.
function toPath(key) {
  return '/' + key.toLowerCase().replace(/_/g, '/');
}

const ID_SUFFIX_KEYS = /_(EDIT|SHOW|DETAIL|VIEW|DELETE|DUPLICATE|STATUS|REVOKE|APPROVE|REJECT)$/;

function makeProxy(prefix) {
  return new Proxy({}, {
    get(_t, key) {
      if (typeof key !== 'string') return undefined;
      const needsId = ID_SUFFIX_KEYS.test(key);
      const base = prefix + toPath(key) + (needsId ? '/:id' : '');
      const fn = (...args) => args.length ? `${base.replace('/:id', '')}/${args.join('/')}` : base;
      fn.toString = () => base;
      fn[Symbol.toPrimitive] = () => base;
      return fn;
    },
  });
}

export const API = makeProxy('');
export const ROUTES = makeProxy('');

export function buildRoute(template, params = {}) {
  let s = typeof template === 'function' ? template() : String(template);
  for (const [k, v] of Object.entries(params)) {
    s = s.replace(new RegExp(`:${k}|\\{${k}\\}`, 'g'), encodeURIComponent(String(v)));
  }
  return s;
}

/**
 * Mirror of Laravel's removeScripts() helper — strips <script> tags and inline event handlers.
 * Used before rendering admin-saved HTML.
 */
function removeScripts(html) {
  if (!html) return '';
  return String(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '');
}

function htmlspecialcharsDecode(html) {
  if (!html) return '';
  return String(html)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'");
}

module.exports = { removeScripts, htmlspecialcharsDecode };

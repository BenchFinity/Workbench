# Security response headers, shared via include so they apply in every context.
#
# nginx add_header is NOT inherited into a location block once that block sets
# any add_header of its own (see the /assets/ Cache-Control header). Including
# this snippet in both the server block and that location keeps the headers on
# every response.
#
# The CSP is intentionally conservative but allows what the Three.js SPA needs:
# blob: workers/images and inline styles.
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'" always;

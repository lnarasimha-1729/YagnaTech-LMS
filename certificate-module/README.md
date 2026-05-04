# certificate-module

Standalone MERN-style port of the **Certificate** feature from the Laravel LMS.

```
certificate-module/
├── backend/                                    # Express + Sequelize
│   ├── src/
│   │   ├── config/database.js
│   │   ├── controllers/CertificateController.js
│   │   ├── models/index.js                     # Certificate, Setting, User, Course
│   │   ├── helpers/mockStore.js                # In-memory fallback (USE_MOCK=true)
│   │   ├── middleware/upload.js                # multer storage for templates
│   │   ├── routes/index.js
│   │   └── server.js
│   ├── uploads/certificate-template/           # uploaded images go here
│   ├── .env / .env.example
│   └── package.json
└── frontend/                                   # React + Tailwind + React Router
    ├── src/
    │   ├── api/{client.js, certificate.js}
    │   ├── pages/
    │   │   ├── AdminCertificate.jsx            # /admin/certificate (settings + template upload)
    │   │   ├── CertificateBuilder.jsx          # /admin/certificate/builder
    │   │   ├── CertificateList.jsx             # /admin/certificates
    │   │   └── CertificateDownload.jsx         # /certificate/:identifier (public)
    │   ├── App.jsx, main.jsx, index.css
    ├── tailwind.config.js, postcss.config.js, vite.config.js, index.html
    ├── .env
    └── package.json
```

## What was ported

| Laravel source | MERN equivalent |
|---|---|
| `app/Models/Certificate.php` + migration `2026_02_21_000050_create_certificates_table` | [`models/index.js`](backend/src/models/index.js) — Sequelize `Certificate` (`user_id`, `course_id`, `identifier` unique) |
| `SettingController@certificate` | `GET /api/admin/certificate/settings` |
| `SettingController@certificate_update_template` | `POST /api/admin/certificate/template` (multipart, image-only). Removes the previous file and rewrites `<img src>` references in the saved builder HTML — same as the Laravel `preg_replace`. |
| `SettingController@certificate_builder_update` | `POST /api/admin/certificate/builder` |
| `PlayerController@track_lesson_progress` (the certificate-issuance branch when progress >= 100) | `POST /api/certificates/issue` `{ user_id, course_id, progress }` — 12-char identifier via the same `random()` helper logic, only inserts when no row exists for the pair. |
| `HomeController@download_certificate` (route `/certificate/{identifier}`) | `GET /api/certificate/:identifier` — runs the same `{student_name}`, `{course_title}`, `{course_duration}`, `{number_of_lesson}`, `{qr_code}`, `{course_completion_date}`, `{certificate_download_date}`, `{course_level}`, `{course_language}`, `{instructor_name}` token replacements, generates the QR data-URI, returns the rendered HTML. |
| `resources/views/admin/certificate/index.blade.php` | [`pages/AdminCertificate.jsx`](frontend/src/pages/AdminCertificate.jsx) |
| `resources/views/admin/certificate/builder.blade.php` | [`pages/CertificateBuilder.jsx`](frontend/src/pages/CertificateBuilder.jsx) — HTML-source editor + token panel + live preview (functionally equivalent; the original uses jQuery UI drag-and-drop, this one keeps the same data contract) |
| `resources/views/curriculum/certificate/download.blade.php` | [`pages/CertificateDownload.jsx`](frontend/src/pages/CertificateDownload.jsx) — same dual-canvas approach (hidden capture target + scaled preview), download via html2canvas → PNG. |
| `resources/views/course_player/certificate/index.blade.php` | Not included here (this module is admin/builder/issue/download only). The course-player tab can call `POST /certificates/issue` and link to the download page. |

## API

| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | Liveness check |
| GET | `/api/admin/certificate/settings` | Returns `{ certificate_template, certificate_builder_content }` |
| POST | `/api/admin/certificate/template` | multipart/form-data, field `certificate_template` (image). 422 on missing file. |
| POST | `/api/admin/certificate/builder` | JSON `{ certificate_builder_content }`. 422 on missing field. |
| GET | `/api/certificates` | Admin list with joined user + course |
| POST | `/api/certificates/issue` | JSON `{ user_id, course_id, progress }`. Refuses unless `progress >= 100`. Idempotent per `(user_id, course_id)` pair. |
| DELETE | `/api/certificates/:id` | Admin delete |
| GET | `/api/certificate/:identifier` | Public render. Returns `{ certificate, html, student_name, course_title, verify_url, qr_code }` |

## Run

```bash
# Terminal 1 — backend
cd certificate-module/backend
npm install
cp .env.example .env       # if you don't already have one
npm start                  # http://localhost:5070

# Terminal 2 — frontend
cd certificate-module/frontend
npm install
npm run dev                # http://localhost:5174
```

`USE_MOCK=true` in [`backend/.env`](backend/.env) keeps everything in memory so the module runs without MySQL. Flip to `false` and fill in DB creds to use the real `lms` database — the same `certificates` and `settings` tables are reused.

## Screens

- **`/admin/certificate`** — current builder preview + template upload form (mirrors `admin/certificate/index.blade.php`)
- **`/admin/certificate/builder`** — HTML editor for the builder content + token panel + live preview
- **`/admin/certificates`** — issued certificates list, manual issue (for testing), delete
- **`/certificate/:identifier`** — public certificate page with the **Download** button (html2canvas → PNG)

## Smoke-tested

The following sequence was verified end-to-end against the running backend:

1. `GET /api/health` → `{ ok: true, module: 'certificate' }`
2. `GET /api/admin/certificate/settings` → returns the default builder content seed
3. `POST /api/certificates/issue { user_id: 99, course_id: 101, progress: 100 }` → creates row with `identifier`
4. Same call again → returns `{ created: false }` (idempotent)
5. `POST /api/certificates/issue { progress: 50 }` → `400 "Course progress must be 100% before a certificate can be issued."`
6. `GET /api/certificate/<identifier>` → token-replaced HTML containing `Demo Student` and `Mastering React 18` plus a QR data-URI
7. `GET /api/certificate/nope-12345` → `404 "Certificate not found at this url"`
8. `POST /api/admin/certificate/builder` → `200 "Certificate builder template has been updated"`

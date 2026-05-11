# Traveloop – Odoo 17 Backend Module

A complete **Odoo 17** REST API backend that fully replaces Supabase for the **Traveloop** React travel planning app.

---

## 📁 Module Structure

```
traveloop/
├── __init__.py
├── __manifest__.py
├── controllers/
│   ├── __init__.py
│   ├── utils.py          # Shared helpers (CORS, auth decorator, json_response)
│   ├── auth.py           # POST /api/auth/login|signup|logout|forgot-password
│   ├── profile.py        # GET|PUT|DELETE /api/profile
│   ├── cities.py         # GET /api/cities, /api/cities/:id, /api/activities
│   ├── trips.py          # GET|POST /api/trips, /api/dashboard, clone, share
│   ├── itinerary.py      # Stops & trip activities CRUD
│   ├── budget.py         # Expenses CRUD + budget summary
│   ├── checklist.py      # Packing checklist + smart-packing generator
│   ├── notes.py          # Trip journal notes CRUD
│   ├── public.py         # GET /api/public/trip/:token (no auth)
│   └── admin.py          # GET /api/admin/stats (admin only)
├── models/
│   ├── __init__.py
│   ├── res_users.py           # Extends res.users (avatar_url, language_pref)
│   ├── traveloop_city.py      # traveloop.city
│   ├── traveloop_activity.py  # traveloop.activity (catalog)
│   ├── traveloop_trip.py      # traveloop.trip
│   ├── traveloop_stop.py      # traveloop.stop
│   ├── traveloop_trip_activity.py  # traveloop.trip.activity
│   ├── traveloop_expense.py   # traveloop.expense
│   ├── traveloop_checklist.py # traveloop.checklist.item
│   └── traveloop_note.py      # traveloop.note
├── security/
│   ├── ir.model.access.csv    # Model-level access rights
│   └── record_rules.xml       # Row-level security (users see only their own data)
└── data/
    ├── city_data.xml           # 10 demo cities seeded
    └── activity_data.xml       # 20 demo activities seeded
```

---

## 🚀 Installation

### Prerequisites
- Odoo 17 Community or Enterprise
- Python 3.10+
- PostgreSQL 14+

### Steps

**1. Copy the module into your Odoo addons path:**
```bash
cp -r traveloop /path/to/odoo/custom_addons/
```

**2. Update your `odoo.conf` to include the addons path:**
```ini
[options]
addons_path = /path/to/odoo/addons,/path/to/odoo/custom_addons
```

**3. Restart Odoo and update the module list:**
```bash
./odoo-bin -c odoo.conf -u all --stop-after-init
```

**4. Install the module via Odoo UI:**
- Go to **Settings → Apps**
- Search for **Traveloop**
- Click **Install**

Or install via CLI:
```bash
./odoo-bin -c odoo.conf -i traveloop --stop-after-init
```

---

## 🌐 CORS Setup

CORS is handled inside `controllers/utils.py`. The allowed origin is:
```
http://localhost:8080
```

To change it for production, edit `cors_headers()` in `controllers/utils.py`:
```python
'Access-Control-Allow-Origin': 'https://your-production-domain.com',
```

---

## 🔐 Authentication

This module uses **Odoo native session-based authentication**.

### Login
```http
POST /api/auth/login
Content-Type: application/json

{ "email": "user@example.com", "password": "secret" }
```
Response includes `session_id`. The browser stores this as a cookie automatically.

### Signup
```http
POST /api/auth/signup
Content-Type: application/json

{ "email": "user@example.com", "password": "secret", "full_name": "Jane Doe" }
```

### Logout
```http
POST /api/auth/logout
```

### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{ "email": "user@example.com" }
```
Triggers Odoo's built-in password reset email.

---

## 📡 Full API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Login |
| POST | `/api/auth/signup` | No | Register |
| POST | `/api/auth/logout` | No | Logout |
| POST | `/api/auth/forgot-password` | No | Send reset email |

### Profile
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/profile` | ✅ | Get current user profile |
| PUT | `/api/profile` | ✅ | Update name, avatar, language |
| DELETE | `/api/profile` | ✅ | Delete account + all data |

### Cities & Activities
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cities?q=&limit=` | No | Search cities |
| GET | `/api/cities/:id` | No | City detail + activities |
| GET | `/api/activities?city_id=` | No | Activities for a city |

### Dashboard
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard` | ✅ | Stats, upcoming trips, popular cities |

### Trips
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/trips` | ✅ | List user's trips |
| POST | `/api/trips` | ✅ | Create trip |
| GET | `/api/trips/:id` | ✅ | Full trip detail |
| PUT | `/api/trips/:id` | ✅ | Update trip |
| DELETE | `/api/trips/:id` | ✅ | Delete trip |
| POST | `/api/trips/:id/clone` | ✅ | Clone trip |
| PUT | `/api/trips/:id/share` | ✅ | Toggle public sharing |

### Itinerary
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/trips/:id/stops` | ✅ | Add stop to trip |
| PUT | `/api/stops/:id` | ✅ | Update stop |
| DELETE | `/api/stops/:id` | ✅ | Remove stop |
| POST | `/api/stops/:id/activities` | ✅ | Add activity to stop |
| DELETE | `/api/trip-activities/:id` | ✅ | Remove activity |

### Budget
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/trips/:id/expenses` | ✅ | List expenses + budget summary |
| POST | `/api/expenses` | ✅ | Add expense |
| DELETE | `/api/expenses/:id` | ✅ | Delete expense |

### Packing Checklist
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/trips/:id/checklist` | ✅ | Get checklist grouped by category |
| POST | `/api/checklist-items` | ✅ | Add item |
| PUT | `/api/checklist-items/:id` | ✅ | Toggle packed / update |
| DELETE | `/api/checklist-items/:id` | ✅ | Delete item |
| POST | `/api/trips/:id/smart-packing` | ✅ | Auto-generate packing list |

### Notes / Journal
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/trips/:id/notes` | ✅ | List notes (newest first) |
| POST | `/api/notes` | ✅ | Add note |
| DELETE | `/api/notes/:id` | ✅ | Delete note |

### Public Sharing
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/public/trip/:token` | No | Read-only public trip view |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/stats` | ✅ Admin | KPIs, top cities, predictive insights |

---

## 🗄️ Database Models

| Model | Description |
|-------|-------------|
| `res.users` (extended) | + `avatar_url`, `language_pref` |
| `traveloop.city` | City catalog with cost_index, popularity |
| `traveloop.activity` | Activity catalog linked to cities |
| `traveloop.trip` | Core trip record with budget, sharing |
| `traveloop.stop` | City stop within a trip |
| `traveloop.trip.activity` | Activity instance on a stop |
| `traveloop.expense` | Manual expense entry |
| `traveloop.checklist.item` | Packing list item |
| `traveloop.note` | Journal note |

---

## 🔒 Row-Level Security

Implemented via Odoo **record rules** (`security/record_rules.xml`):

- Users can only **read/write/delete their own trips**
- Stops, activities, expenses, checklist, notes all cascade from trip ownership
- Admin users (`base.group_system`) can see **all trips**
- Public trips are accessible via `/api/public/trip/:token` **without auth**

---

## 🌱 Demo Data

On install, the following is seeded automatically:

**10 Cities:** Paris, Tokyo, Bali, New York, Rome, Barcelona, Marrakech, Reykjavik, Cape Town, Bangkok

**20 Activities:** 2 per city covering culture, food, nature, adventure, nightlife, leisure

---

## 🔧 Connecting the React Frontend

Replace the Supabase client in `src/integrations/supabase/client.ts` with calls to the Odoo API:

```typescript
// Base URL for all API calls
const ODOO_BASE = 'http://localhost:8069';

// Example: login
const res = await fetch(`${ODOO_BASE}/api/auth/login`, {
  method: 'POST',
  credentials: 'include',   // sends session cookie
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
const data = await res.json();
```

All endpoints use `credentials: 'include'` for session cookie auth.

---

## 📝 License

LGPL-3.0

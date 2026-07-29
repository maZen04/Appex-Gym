# Appex Gym Management System — Django Edition

The exact same product as the Node.js version — same features, same React frontend, same API
behavior — but with the backend rebuilt in **Django + Django REST Framework** instead of
Node/Express.

Dashboard, Members, Memberships & Plans (with integrated, guarded payments), Attendance (QR
check-in), Payments, Reports (deep analytics + Excel/PDF export), automatic QR generation,
WhatsApp welcome/reminder messages, Employees, and Settings — with Owner and Reception roles.

## 1. Requirements

- Python 3.10+
- Node.js 18+ (for the frontend only)

## 2. Run the backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py seed_gym       # creates default logins + sample plans
python manage.py runserver 0.0.0.0:8000
```

The API runs on **http://localhost:8000**. First-run seed creates:

- Owner login → phone `01000000000` / password `owner123`
- Reception login → phone `01000000001` / password `reception123`
- Three sample membership plans (Monthly / Quarterly / Yearly)

The SQLite database is created automatically at `backend/db.sqlite3`. Uploaded member photos are
stored under `backend/media/`.

## 3. Run the frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** and log in with one of the seeded accounts above.
`frontend/.env` points the app at `http://localhost:8000/api` — change `VITE_API_URL` if you run
the backend elsewhere.

## 4. What's different from the Node version (implementation only — behavior is identical)

| | Node version | Django version |
|---|---|---|
| Web framework | Express | Django + Django REST Framework |
| Database access | Node's built-in `node:sqlite` | Django ORM (SQLite by default) |
| Auth | Hand-rolled JWT (`jsonwebtoken`) | `djangorestframework-simplejwt` |
| QR generation | `qrcode` (npm) | `qrcode` (PyPI) |
| PDF export | `pdfkit` | `reportlab` |
| Scheduled reminders | `node-cron` | `APScheduler`, started in `gym/apps.py` |
| File uploads | `multer` | Django's built-in `ImageField` + `MEDIA_ROOT` |

The **API contract is intentionally identical** (same routes under `/api/...`, same request/response
field names), so the React frontend needed zero code changes — only `VITE_API_URL` was repointed
from port 4000 to port 8000.

## 5. Payments (recap — same rules as the Node version)

Payments are recorded as part of creating/renewing a membership (full, partial/installment, or
none), and the server rejects any payment that would push the total paid past a membership's
price — so a member can't be double-charged or overpaid. This is enforced in
`gym/views/payments.py` and `gym/views/memberships.py`.

## 6. WhatsApp integration

Same Twilio-shaped integration as the Node version — see `gym/services/whatsapp.py`. Out of the
box, every WhatsApp trigger (welcome message, renewal reminders, expiry reminders) is logged to
the database with status `simulated` instead of sending a real message. To go live:

1. Create a [Twilio](https://www.twilio.com/whatsapp) account and set up a WhatsApp sender.
2. Add credentials to `backend/.env`:
   ```
   TWILIO_ACCOUNT_SID=...
   TWILIO_AUTH_TOKEN=...
   TWILIO_WHATSAPP_FROM=+1415XXXXXXX
   ```
3. In the app, go to **Settings → WhatsApp Integration** and enable live sending.

The reminder job runs automatically every day at 9:00 AM (via APScheduler, started when
`manage.py runserver` boots), or trigger it manually anytime with:

```bash
python manage.py run_reminders
```

(also exposed as a button in the app under **WhatsApp Log**).

## 7. Django admin

A full Django admin panel is available at **http://localhost:8000/admin/** for direct
database inspection/editing. Create a superuser to access it:

```bash
python manage.py createsuperuser
```

(You'll be asked for phone, full name, and password — the custom user model logs in by phone.)

## 8. Project structure

```
backend/
  config/            Django project settings, URLs
  gym/
    models.py          All models (Employee, GymSettings, MembershipPlan, Member,
                        Membership, Payment, Attendance, WhatsAppMessage)
    serializers.py      DRF serializers
    permissions.py      IsOwner permission class
    urls.py              All /api/ routes
    views/               One file per module (members, memberships, plans, attendance,
                          payments, reports, employees, settings_view, dashboard, whatsapp, auth)
    services/
      qr.py               QR generation
      whatsapp.py         Twilio-shaped WhatsApp sender (simulated by default)
      reminders.py        Reminder-check logic (called by APScheduler + management command)
    management/commands/
      seed_gym.py         Default logins + sample plans
      run_reminders.py    Manual reminder trigger
frontend/            Identical React app to the Node version (see its own README notes)
```

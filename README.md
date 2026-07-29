# Appex Gym Management System

A full-stack gym management system built with Django REST Framework and React, designed to help gyms manage members, memberships, attendance, payments, employees, and business reports from a single dashboard.

The system replaces spreadsheets and paper-based workflows with a modern web application featuring role-based access control, QR code attendance, automated WhatsApp notifications, and detailed business analytics.

## 1. Requirements

- Python 3.10+
- Node.js 18+ (for the frontend only)

## 2. Features

### Authentication & Authorization

- JWT Authentication
- Role-based access (Owner / Reception)
- Secure protected API endpoints

### Dashboard

- Total Members
- Active Members
- Expired Memberships
- Monthly Revenue
- Today's Renewals
- Daily Check-ins
- Revenue & Attendance Charts

### Members

- Add and manage members
- Member profile with complete history
- Photo upload
- Search by name or phone

### Memberships

- Create memberships
- Renew memberships
- Freeze memberships
- Cancel memberships
- Membership history

### Membership Plans

- Monthly
- Quarterly
- Yearly
- Custom pricing and duration

### Attendance

- QR Code Check-in
- Barcode support (optional)
- Search check-in

### Payments

- Cash
- Visa
- Instapay
- Payment history

### Reports

- Revenue Reports
- Attendance Reports
- Membership Reports
- Member Reports
- Export to Excel
- Export to PDF

### Employees

- Employee Management
- Owner permissions
- Reception permissions

### Smart Automation

- Automatic QR generation
- WhatsApp welcome messages
- Membership renewal reminders
- Expired membership reminders

### Settings

- Gym information
- Membership settings
- Reminder configuration
- WhatsApp integration

## 3. Run the backend

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

## 4. Run the frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** and log in with one of the seeded accounts above.
`frontend/.env` points the app at `http://localhost:8000/api` — change `VITE_API_URL` if you run
the backend elsewhere.

## 5. WhatsApp integration

Same Twilio-shaped integration see `gym/services/whatsapp.py`. Out of the
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

## 6. Django admin

A full Django admin panel is available at **http://localhost:8000/admin/** for direct
database inspection/editing. Create a superuser to access it:

```bash
python manage.py createsuperuser
```

(You'll be asked for phone, full name, and password — the custom user model logs in by phone.)

## 7. Project structure

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

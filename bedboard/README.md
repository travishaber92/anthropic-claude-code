# BedBoard

A simple, phone-friendly website where sober living homes show **how many beds are open today**, and families can send an inquiry.

- **Public pages**: list of all homes (`/`), and a page per home (`/homes/<name>`) with beds open, city, who it serves, price, a tap-to-call button, and an inquiry form.
- **Owner page** (`/owner`): log in, tap **+** / **−** to change open beds, update price, turn online inquiries on or off, and see recent inquiries.
- **Admin page** (`/admin`): every home and total open beds.
- **Inquiries** go to the owner's email (and are saved on the owner page as a backup).

> BedBoard is a listing site only. It gives no medical advice and does not collect patient records or HIPAA data. The form asks only for name, phone, who the bed is for, insurance vs. cash pay, move-in date, and optional notes.

## Run it on your computer

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
cd bedboard
npm install
cp .env.example .env.local     # then open .env.local and set ADMIN_PASSWORD
npm run seed                   # adds 3 demo homes in Orange County
npm run dev                    # open http://localhost:3000
```

Demo owner logins (password `demo1234` for all three):

| Home | City | Owner email |
| --- | --- | --- |
| Harbor Light Men's House | Costa Mesa | harborlight@example.com |
| Seabreeze Women's Sober Living | Huntington Beach | seabreeze@example.com |
| Mission Trail Recovery Residence | San Juan Capistrano | missiontrail@example.com |

## Add a real home

```bash
npm run add-home
```

Answer the questions (name, city, phone, price, owner email, password). The owner can then log in at `/owner`.

## Put it online with Vercel

1. **Database:** in Vercel, open **Storage → Marketplace → Turso** and create a free database (or sign up at turso.tech). Copy its **database URL** (`libsql://...`) and **auth token**.
2. **Email:** create a free account at [resend.com](https://resend.com), verify your domain, and create an API key.
3. **Import the project:** in Vercel, choose **Add New → Project**, pick this GitHub repo, and set **Root Directory** to `bedboard`.
4. **Environment variables:** add these in the Vercel project settings:

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | your Turso URL (`libsql://...`) |
   | `DATABASE_AUTH_TOKEN` | your Turso token |
   | `SESSION_SECRET` | a long random string (`openssl rand -base64 32`) |
   | `ADMIN_PASSWORD` | a strong password for `/admin` |
   | `RESEND_API_KEY` | your Resend key |
   | `EMAIL_FROM` | e.g. `BedBoard <inquiries@yourdomain.com>` |
   | `SITE_URL` | your site's address |

5. Deploy. The database tables are created automatically on the first visit.
6. To add the demo homes or real homes to the live database, put the same `DATABASE_URL` and `DATABASE_AUTH_TOKEN` in your `.env.local`, then run `npm run seed` or `npm run add-home` on your computer.

**About email:** until `RESEND_API_KEY` is set, inquiries are still saved and shown on the owner page, and the email text is printed in the server log. Resend's test sender (`onboarding@resend.dev`) only delivers to your own Resend account email, so verify a domain before going live.

## Where things are

| File | What it does |
| --- | --- |
| `app/page.js` | List of all homes |
| `app/homes/[slug]/page.js` | Public page for one home |
| `app/homes/[slug]/InquiryForm.js` | The inquiry form |
| `app/owner/` | Owner login and dashboard (bed counter, price, inquiry switch) |
| `app/admin/` | Admin overview |
| `app/actions.js` | Everything that saves data: inquiries, logins, bed and price updates |
| `lib/db.js` | Database tables and queries |
| `lib/email.js` | Sends the inquiry email |
| `lib/options.js` | Form choices (who it's for, payment) and price formatting |
| `scripts/seed.mjs` | The 3 demo homes |

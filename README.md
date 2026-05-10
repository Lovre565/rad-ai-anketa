# Mijenja li umjetna inteligencija način na koji potrošači donose financijske odluke na financijskim tržištima?

Next.js aplikacija za anonimno provođenje ankete i eksperimenta iz rada o utjecaju umjetne inteligencije na financijsko odlučivanje.

## Što aplikacija radi

- Prikuplja anonimne demografske podatke bez imena, prezimena, e-maila ili studentskog broja.
- Provodi OECD/INFE test financijske pismenosti i računa rezultat do 21 boda.
- Provodi 4 financijska zadatka, uključujući uvjete bez pomoći, uz internet i uz AI.
- Mjeri vrijeme rješavanja svakog zadatka.
- Automatski boduje zadatke prema pravilima iz dokumenta.
- Sprema podatke u Supabase Postgres.
- Ima admin ekran na `/admin` s agregatima i CSV izvozom.
- Admin pristup koristi HttpOnly sesijski cookie; lozinka se ne šalje kroz URL.

## Lokalno pokretanje

U ovom Codex okruženju `npm` nije bio dostupan na PATH-u, pa instalaciju treba pokrenuti u normalnom terminalu gdje je instaliran Node.js s npm-om.

```bash
npm install
npm run dev
```

Zatim otvoriti:

```text
http://localhost:3000
```

## Supabase setup

1. Napraviti novi Supabase projekt.
2. U Supabase SQL editoru pokrenuti sadržaj datoteke `supabase/schema.sql`.
3. Iz Project Settings > API uzeti:
   - Project URL
   - service_role key
4. Napraviti `.env.local` prema `.env.example`:

```env
NEXT_PUBLIC_APP_NAME="Mijenja li umjetna inteligencija način na koji potrošači donose financijske odluke na financijskim tržištima?"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
ADMIN_PASSWORD="jaka-admin-lozinka"
```

`SUPABASE_SERVICE_ROLE_KEY` smije biti samo server-side environment varijabla. Ne dodavati `NEXT_PUBLIC_` prefiks.

## Deploy na Vercel

1. Projekt staviti na GitHub ili pokrenuti `vercel` CLI iz ovog foldera.
2. U Vercelu napraviti novi projekt.
3. U Vercel Project Settings > Environment Variables dodati za Production, Preview i Development:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD`
   - opcionalno `NEXT_PUBLIC_APP_NAME`
4. Pokrenuti deploy.

Nakon deploya studenti koriste javni URL aplikacije, a admin statistika je na:

```text
https://tvoj-url.vercel.app/admin
```

## Sigurnost

- Ne commitati `.env.local` i ne dijeliti `SUPABASE_SERVICE_ROLE_KEY`.
- Za javni deploy koristiti jaku `ADMIN_PASSWORD` vrijednost.
- `/api/submit` ima osnovni in-memory rate limit. Za veći javni promet preporučuje se Vercel firewall, Cloudflare Turnstile ili Supabase Edge/API rate limit.
- CSV export neutralizira vrijednosti koje Excel/Sheets mogu interpretirati kao formule.

## Važna napomena o bodovanju otvorenih odgovora

Otvorena obrazloženja boduju se automatski po ključnim pojmovima. To je praktično za brzu statistiku, ali za završnu znanstvenu obradu preporučuje se ručna provjera ili barem kontrolni uzorak odgovora, posebno kod Zadatka 4 gdje nema jedne strogo zadane opcije.

# Promptland

Promptland, AI üretim araçları (Midjourney / DALL·E / Stable Diffusion vb.) için **prompt** paylaşmayı, keşfetmeyi ve topluluk etkileşimiyle (beğeni, yorum, takip) büyütmeyi amaçlayan bir web uygulamasıdır. Kullanıcılar prompt’ları medya (görsel/video) ile birlikte yayınlayabilir, arayabilir, kaydedebilir ve diğer kullanıcılarla mesajlaşabilir.

---

## About The Project

AI ile içerik üretenler için iyi prompt’ları bulmak, düzenlemek ve tekrar kullanmak çoğu zaman dağınık bir süreçtir. Promptland bu ihtiyacı tek bir yerde çözer:

- Prompt’ları **paylaşma ve arşivleme**
- Etiket/model bilgisiyle **keşfetme ve arama**
- Topluluk etkileşimiyle (beğeni/yorum/takip) **kaliteli içerikleri öne çıkarma**

---

## Key Features

- **Kimlik doğrulama**: Supabase Auth ile giriş/kayıt
- **Feed & keşfet**: En yeni prompt’lar, keşfet sayfası ve arama
- **Prompt detay sayfası**:
  - Prompt metnini **tek tıkla kopyalama**
  - Görsel/video medya gösterimi
  - **Görüntülenme sayacı**
  - Yorumlar ve yorum beğenileri
- **Etkileşim**:
  - Prompt **beğenme**
  - Prompt **kaydetme (saved)**
  - Kullanıcı **takip etme / takipçi listeleri**
- **Bildirimler**: beğeni/yorum/takip gibi olaylar için bildirim akışı
- **Mesajlaşma**: konuşmalar ve mesaj gönderimi (ek dosya desteği için upload endpoint’i mevcut)
- **Moderasyon / raporlama altyapısı**: rapor modeli ve durum yönetimi (Prisma şemasında)
- **Tema desteği**: açık/koyu tema (class tabanlı)

> Not: Özellikler proje kodundaki sayfa, action ve Prisma modellerinden türetilmiştir; UI akışları zamanla değişebilir.

---

## Tech Stack

Bu bölüm, proje dosyalarından otomatik tespit edilen ana teknolojileri içerir (alt/dolaylı paketler listelenmez).

### Frontend

- **Next.js 14** (App Router, Route Handlers)
- **React 18**
- **TypeScript**
- **Tailwind CSS** (+ PostCSS, Autoprefixer)
- **Radix UI** (headless/accessible UI primitives)
- **next-themes** (tema yönetimi)
- **lucide-react** (ikonlar)

### Backend & API

- **Next.js Route Handlers** (`app/api/**/route.ts`)
- **Next.js Server Actions** (`app/actions/**`)
- **Supabase**:
  - `@supabase/ssr` (server/browser client yardımcıları)
  - `@supabase/supabase-js` (Supabase client)

### Database & ORM

- **PostgreSQL** (Supabase üzerinde)
- **Prisma** (`prisma/schema.prisma`, `@prisma/client`)

### Tooling

- **ESLint** (`next lint`)
- **Prisma CLI** (`db:push`, `db:generate`, `db:studio`)
- **npm scripts**: `dev`, `build`, `start`, `lint`

---

## Getting Started

### Prerequisites

- **Node.js** (LTS önerilir)
- **npm** (Node ile gelir)
- Bir **Supabase projesi** (Auth + PostgreSQL)

### Installation

1) Bağımlılıkları kurun:

```bash
npm install
```

2) Ortam değişkenlerini ayarlayın.

Proje şu environment değişkenlerini bekler:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (yalnızca server-side; RLS bypass için)
- `DATABASE_URL` (Prisma için)
- `DIRECT_DATABASE_URL` (Prisma direct bağlantı için)

`.env.local` dosyanızı oluşturup bu değerleri ekleyin.

> Güvenlik: `.env.local` dosyanızı **asla GitHub’a commit etmeyin**. Eğer yanlışlıkla paylaştıysanız Supabase anahtarlarınızı ve DB şifrenizi **hemen rotate** edin.

3) Prisma client üretin:

```bash
npm run db:generate
```

4) Veritabanı şemasını uygulayın:

```bash
npm run db:push
```

5) Uygulamayı çalıştırın:

```bash
npm run dev
```

Ardından tarayıcıdan `http://localhost:3000` adresine gidin.

### Useful Commands

```bash
# Lint
npm run lint

# Production build
npm run build

# Start production server
npm run start

# Prisma Studio
npm run db:studio
```

---

## License

Bu repo için lisans bilgisi henüz eklenmemiş görünüyor. İsterseniz bir lisans seçip (`MIT`, `Apache-2.0` vb.) buraya ekleyebiliriz.


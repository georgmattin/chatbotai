# AI Chat Rakendus

Modernne chat rakendus Azure OpenAI API-ga ja Google Vertex AI Veo video genereerimisega, ehitatud Next.js ja Tailwind CSS-ga.

## 🚀 Kiire alustamine

### 1. Sõltuvuste installimine

```bash
npm install
# või
pnpm install
```

### 2. API seadistamine

1. **Kopeeri keskkonnamuutujate fail:**
   ```bash
   cp .env.example .env.local
   ```

2. **Seadista API andmed `.env.local` failis:**
   ```env
   # Azure OpenAI (chat ja pildi genereerimine)
   AZURE_OPENAI_KEY=teie_api_võti
   AZURE_OPENAI_ENDPOINT=https://teie-ressurss.openai.azure.com
   AZURE_OPENAI_DEPLOYMENT=gpt-35-turbo
   DALL_E_DEPLOYMENT=dall-e-3
   
   # Google Cloud (video genereerimine)
   GOOGLE_CLOUD_PROJECT_ID=teie_google_cloud_projekt_id
   GOOGLE_CLOUD_LOCATION=us-central1
   GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY=base64_encoded_service_account_json_key
   ```

### 3. Rakenduse käivitamine

```bash
npm run dev
# või
pnpm dev
```

Avage [http://localhost:3000](http://localhost:3000) brauseris.

## ⚙️ API seadistamine

### Azure OpenAI seadistamine (chat ja pildi genereerimine)

**Azure portaalis:**

1. **Azure OpenAI ressursi loomine:**
   - Minge Azure portaali
   - Looge uus "Azure OpenAI" ressurss
   - Valige sobiv regioon ja hindamisplaan

2. **Deployment loomine:**
   - Minge ressursi "Model deployments" lehele
   - Looge uus deployment (nt. gpt-35-turbo või gpt-4)
   - Looge DALL-E 3 deployment pildi genereerimiseks
   - Märkige üles deployment nimed

3. **API andmete kopeerimine:**
   - Minge "Keys and Endpoint" lehele
   - Kopeerige API võti
   - Kopeerige Endpoint URL

### Google Cloud seadistamine (video genereerimine)

**Google Cloud Console'is:**

1. **Projekti loomine:**
   - Minge [Google Cloud Console](https://console.cloud.google.com)
   - Looge uus projekt või valige olemasolev

2. **Vertex AI API lubamine:**
   - Otsige "Vertex AI API"
   - Klõpsake "Enable"

3. **Service Account loomine:**
   - Minge "IAM & Admin" > "Service Accounts"
   - Looge uus service account
   - Andke rolliks "Vertex AI Service Agent"
   - Laadige alla JSON võtmefail

4. **Service Account võtme kodeerimine:**
   ```bash
   # Linux/Mac:
   base64 -i path/to/your/service-account-key.json
   
   # Windows PowerShell:
   [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((Get-Content "path\to\your\service-account-key.json" -Raw)))
   ```

5. **Keskkonnamuutujate seadistamine:**
   - Kopeerige base64 kodeeritud võti
   - Seadistage `.env.local` failis (vt ülalpool)

## 🎯 Funktsioonid

### Chat funktsioonid
- ✅ Azure OpenAI API integratsioon  
- ✅ Reaalajas chat
- ✅ Markdown ja koodiblokid
- ✅ Mitmik vestlused
- ✅ Koodi kopeerimine
- ✅ Kirjutamise indikaator

### Pildi genereerimine
- ✅ DALL-E 3 integratsioon
- ✅ Erinevad suurused (1024x1024, 1792x1024, 1024x1792)
- ✅ Stiilivalikud (vivid, natural)
- ✅ Kvaliteedivalikud (standard, HD)
- ✅ Batch genereerimine CSV failist

### Video genereerimine (UUS!)
- ✅ Google Vertex AI Veo integratsioon
- ✅ Veo 2.0 ja Veo 3.0 mudelid
- ✅ Tekstist video genereerimine
- ✅ Erinevad kuvasuhtmed (16:9, 9:16)
- ✅ Reguleeritav kestus (5-8 sekundit)
- ✅ Loovuse seadistamine (temperature)
- ✅ Audio tugi (Veo 3.0)

### Üldised funktsioonid
- ✅ Mobiili sõbralik disain
- ✅ Tumedad toonid
- ✅ Automaatne salvestamine
- ✅ Allalaadimise võimalus

## 🔧 Arendus

### Projekt struktuur

```
ai-chat-app/
├── app/                    # Next.js App Router
│   ├── api/
│   │   ├── chat/          # Azure OpenAI chat endpoint
│   │   ├── generate-image/ # DALL-E pildi genereerimine
│   │   ├── generate-video/ # Google Veo video genereerimine
│   │   └── batch-generate/ # Batch pildi genereerimine
│   ├── page.tsx           # Peamine chat leht
│   └── layout.tsx         # Rakenduse layout
├── components/            # React komponendid
│   ├── chat-area.tsx      # Chat sõnumite ala
│   ├── chat-input.tsx     # Sõnumi sisestamise ala
│   ├── chat-sidebar.tsx   # Külgpaneel vestlustega
│   ├── image-generator.tsx # Pildi genereerimine
│   ├── video-generator.tsx # Video genereerimine
│   ├── batch-image-generator.tsx # Batch genereerimine
│   └── ui/               # UI komponendid (shadcn/ui)
├── public/
│   ├── generated-images/  # Genereeritud pildid
│   └── generated-videos/  # Genereeritud videod
└── lib/                  # Utiliidid
```

### Kasutatavad tehnoloogiad

- **Next.js 15** - React raamistik
- **TypeScript** - Tüüpide tugi
- **Tailwind CSS** - Stiilide raamistik
- **Radix UI** - UI komponendid
- **React Markdown** - Markdown renderdamine
- **React Syntax Highlighter** - Koodiblokide esiletõstmine
- **Google Cloud AI Platform** - Vertex AI Veo video genereerimine
- **Google Auth Library** - Google Cloud autentimine

## 🐛 Tüüpilised probleemid

### Azure OpenAI probleemid

**"API seaded puuduvad" viga**
- Kontrollige, et Azure OpenAI API võti ja endpoint on seadistatud
- Veenduge, et endpoint URL sisaldab deployment nime ja API versiooni

**"API Error: 401" - Volitamise viga**
- Kontrollige API võtit Azure portaalis
- Veenduge, et ressurss on aktiivne

**"API Error: 404" - Ei leita**
- Kontrollige endpoint URL-i
- Veenduge, et deployment nimi on õige

**"API Error: 429" - Liiga palju päringuid**
- Azure OpenAI teenus on üle koormatud
- Oodake hetk ja proovige uuesti

### Google Cloud Vertex AI probleemid

**"Google Cloud seaded puuduvad" viga**
- Kontrollige, et kõik Google Cloud keskkonnamuutujad on seadistatud
- Veenduge, et service account võti on õigesti base64 kodeeritud

**"Google Cloud autentimine ebaõnnestus"**
- Kontrollige service account võtit
- Veenduge, et service account'il on "Vertex AI Service Agent" roll

**"Video genereerimine võttis liiga kaua aega"**
- Video genereerimine võib võtta 2-5 minutit
- Proovige hiljem uuesti
- Kontrollige Vertex AI API piire

**"Vertex AI API Error"**
- Veenduge, et Vertex AI API on lubatud projektis
- Kontrollige projekti ID-d
- Veenduge, et valitud regioon toetab Veo mudeleid

## 📝 Litsents

See projekt on avatud lähtekoodiga ja vabalt kasutatav. 
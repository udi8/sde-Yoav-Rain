# מד-גשם שדה יואב

אתר מד-גשם ציבורי לקיבוץ שדה יואב, במקום קבוצת הוואטסאפ למעקב אחר משקעים.

- **עמוד ציבורי** (`/`) — ללא התחברות: גשם היום, מצטבר לעונה, גרף היסטורי עם קו ממוצע רב-שנתי, והשוואה בין עונות.
- **עמוד ניהול** (`/admin`) — מוגן בכניסת Google, מוגבל לרשימת אימיילים. טופס הזנה יומית (מצטבר מחושב אוטומטית) וטופס נפרד להזנת נתונים היסטוריים (תאריך חופשי, לנתוני העבר שטרם הוזנו).

סטאק: React + Vite, Firebase Firestore + Authentication + Hosting (טיר חינמי Spark).

## הקמה ראשונית

### 1. פרויקט Firebase

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project** → תן שם (למשל `sdy-rainfall`). לא נדרש Google Analytics.
2. **Build → Authentication → Get started → Sign-in method** → הפעל **Google**.
3. **Build → Firestore Database → Create database** → מצב **production**, מיקום קרוב (למשל `europe-west1` / `me-west1`).
4. **Project settings (⚙️) → Your apps → Web (`</>`)** → תן שם לאפליקציה, **לא** צריך Firebase Hosting בשלב הזה → העתק את אובייקט ה-config.

### 2. קוד מקומי

```bash
git clone https://github.com/udi8/sde-yoav-rain
cd sde-yoav-rain
npm install
cp .env.example .env
```

מלא ב-`.env` את הערכים מה-config שהעתקת בשלב הקודם (`VITE_FIREBASE_*`).

### 3. הרשאות מנהלים

רשימת המנהלים חיה ב-Firestore, בקולקציה `admins` (מסמך אחד לכל מנהל, ה-id הוא כתובת האימייל באותיות קטנות) — לא רשימה קשיחה בקוד. `firestore.rules` אוכף לפיה מי שיש לו מסמך שם יכול לכתוב ל-DB; עמוד הניהול (`/admin`, טאב "ניהול מנהלים") נותן לכל מנהל קיים להוסיף או להסיר מנהלים אחרים לפי כתובת Gmail.

**המנהל הראשון** חייב להיזרע ידנית דרך service account, כי אף אחד עוד לא עומד בתנאי ה-`isAdmin()` כדי להוסיף את עצמו דרך האפליקציה:

```bash
node scripts/bootstrapAdmin.js ./serviceAccountKey.json you@gmail.com
```

(ראה סעיף "ייבוא היסטוריית הוואטסאפ" למטה לגבי יצירת `serviceAccountKey.json`.) מרגע שיש מנהל אחד, כל השאר מתווספים דרך עמוד הניהול עצמו — אין צורך לגעת בקוד.

### 4. Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # בחר את הפרויקט שיצרת, תן לו alias "default"
```

זה יוצר `.firebaserc` מקומי (לא ב-git, כי מכיל את ה-project ID).

פריסת חוקי Firestore ואינדקסים:

```bash
firebase deploy --only firestore
```

### 5. פיתוח מקומי

```bash
npm run dev
```

## ייבוא היסטוריית הוואטסאפ

`scripts/parseWhatsapp.js` מפרסר קובץ `_chat.txt` (ייצוא צ'אט וואטסאפ) להודעות המשקעים, ומדלג על כל שאר ההודעות. הוא סלחני לגבי הפורמט (עם/בלי מקף, "ממ" מול "מ\"מ", רווחים מיותרים וכו') ומדפיס לקונסול כל מקרה גבולי שהוא לא הצליח לפרסר, כדי שתוכל לבדוק אותו ידנית.

```bash
node scripts/parseWhatsapp.js /path/to/_chat.txt
```

התוצאה נשמרת ל-`scripts/data/readings-import.json` (כבר כלול ב-repo, מהריצה על הצ'אט המקורי — 221 רשומות, עונות 2021/22 עד 2025/26). קובץ `_chat.txt` המקורי **לא** נכנס ל-git (מכיל שיחה אישית שלא קשורה למשקעים) — הוא ב-`.gitignore`.

לייבוא בפועל ל-Firestore צריך service account key (ה-import כותב ישירות ל-DB, לא דרך ה-security rules):

1. **Project settings → Service accounts → Generate new private key** → שמור בתור `serviceAccountKey.json` (כבר ב-`.gitignore`, אל תעלה ל-git).
2. `node scripts/importToFirestore.js ./serviceAccountKey.json`

הרצה חוזרת בטוחה — כל רשומה נכתבת לפי תאריך (`readings/{YYYY-MM-DD}`), אז ריצה נוספת רק דורסת את אותן רשומות.

### נתוני 1991-2021

הטבלה הכתובה מ-1991 עדיין לא דיגיטלית. עד שהיא תיסרק/תוקלד, יש בעמוד הניהול טופס נפרד **"הזנת נתון היסטורי"** עם תאריך חופשי, להזנה ידנית בהדרגה.

## קו הממוצע הרב-שנתי בגרף

בקובץ הוואטסאפ אין טבלת ממוצע יומית/חודשית מלאה — רק כמה ציטוטים בודדים לאורך השנים (מ"מ מצטבר בסוף דצמבר/ינואר/פברואר/אפריל ביחס לממוצע, וכן "ממוצע רב שנתי: 489 מ\"מ"). `src/utils/historicalAverage.js` בונה מהם עקומה מקורבת (אינטרפולציה ליניארית בין הנקודות הידועות) — זה מספיק להתחלה אבל לא מדויק, במיוחד בספטמבר-נובמבר ומרץ שאין לגביהם נתון ישיר. ברגע שתהיה טבלת ממוצע רב-שנתי מדויקת יותר (מהטבלה הכתובה או ממקור אחר), עדכן את קבוע `FULL_SEASON_AVERAGE_MM` ואת מערך `ANCHORS` בקובץ הזה.

## פריסה (Hosting)

```bash
npm run build
firebase deploy --only hosting
```

זה טיר Spark (חינמי) — Hosting, Firestore ו-Authentication עם Google Sign-In כלולים ללא עלות במגבלות השימוש הסבירות של אתר קהילתי קטן.

## מבנה הפרויקט

```
src/
  firebase.js               # אתחול Firebase (Auth, Firestore)
  contexts/AuthContext.jsx  # מצב התחברות Google + בדיקת admin מול Firestore
  hooks/useReadings.js      # subscription לכל רשומות המשקעים
  hooks/useAdmins.js        # subscription לרשימת המנהלים (admins collection)
  utils/season.js           # לוגיקת עונה (ספטמבר–אוגוסט)
  utils/historicalAverage.js# עקומת ממוצע רב-שנתי מקורבת
  components/                # StatCard, SeasonChart, SeasonCompareChart, טפסי ניהול, AdminManagement
  pages/                      # PublicPage, AdminLoginPage, AdminPage
scripts/
  parseWhatsapp.js           # פרסור _chat.txt -> JSON
  importToFirestore.js       # ייבוא JSON -> Firestore
  bootstrapAdmin.js          # זריעת המנהל הראשון בקולקציית admins
  data/readings-import.json  # תוצאת הפרסור (221 רשומות)
firestore.rules              # public read, admin-only write; admins collection דינמית
```

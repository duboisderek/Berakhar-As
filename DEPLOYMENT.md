# מדריך פריסה - ברכה והצלחה

## 🚀 פריסה ל-Netlify

### דרישות מוקדמות:
1. חשבון Netlify
2. חשבון Supabase מוגדר
3. משתני סביבה מוכנים

### שלבי הפריסה:

#### 1. הכנת הפרויקט
```bash
# בניית הפרויקט
npm run build

# בדיקת הבנייה
npm run preview
```

#### 2. הגדרת משתני סביבה ב-Netlify
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 3. הגדרות Build ב-Netlify
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: 18.x

### 🔧 הגדרות Supabase

#### 1. יצירת פרויקט חדש
1. היכנס ל-[Supabase Dashboard](https://supabase.com/dashboard)
2. צור פרויקט חדש
3. העתק את ה-URL וה-anon key

#### 2. הרצת Migrations
```sql
-- הרץ את כל קבצי ה-migration בתיקיית supabase/migrations
-- לפי סדר התאריכים
```

#### 3. הגדרת RLS Policies
כל הטבלאות כוללות Row Level Security מוגדר מראש.

### 🌐 הגדרות DNS (אופציונלי)

#### עבור דומיין מותאם אישית:
1. רכוש דומיין (למשל: brachavehatzlacha.co.il)
2. הגדר CNAME record שמצביע ל-Netlify
3. הוסף את הדומיין ב-Netlify Dashboard

### 📊 ניטור ולוגים

#### Netlify Analytics:
- מעקב אחר ביקורים
- ניתוח ביצועים
- דוחות שגיאות

#### Supabase Monitoring:
- מעקב אחר שאילתות DB
- ניטור אבטחה
- לוגי אימות

### 🔒 אבטחה בפרודקשן

#### SSL/TLS:
- Netlify מספק HTTPS אוטומטי
- Force HTTPS redirect מופעל

#### Headers אבטחה:
```
# _headers file
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 🚨 Troubleshooting

#### בעיות נפוצות:

1. **Build fails**:
   - בדוק שכל ה-dependencies מותקנים
   - ודא שמשתני הסביבה מוגדרים

2. **Supabase connection error**:
   - בדוק את ה-URL וה-keys
   - ודא ש-RLS policies מוגדרים נכון

3. **RTL issues**:
   - ודא ש-`dir="rtl"` מוגדר ב-HTML
   - בדוק את הגדרות Tailwind CSS

### 📈 אופטימיזציה

#### ביצועים:
- Code splitting אוטומטי עם Vite
- Tree shaking לקבצי JS
- Image optimization עם Netlify

#### SEO:
- Meta tags בעברית
- Structured data
- Sitemap אוטומטי

### 🔄 CI/CD Pipeline

#### Auto-deployment:
1. Push ל-main branch
2. Netlify מזהה שינויים
3. Build אוטומטי
4. Deploy לפרודקשן

#### Preview deployments:
- כל PR מקבל preview URL
- בדיקות אוטומטיות
- אישור ידני לפני merge

### 📞 תמיכה טכנית

במקרה של בעיות:
1. בדוק את Netlify build logs
2. בדוק את Supabase logs
3. פנה לתמיכה טכנית

---

**הערה**: מדריך זה מתעדכן באופן שוטף. לגרסה העדכנית ביותר, בדוק את הדוקומנטציה הרשמית.
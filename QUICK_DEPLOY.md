# ⚡ PASOS RÁPIDOS PARA DEPLOYMENT EN RENDER.COM

## Resumen de lo que ya está hecho:
✅ Configuración de backend (Procfile)
✅ Frontend actualizado para producción  
✅ Archivos pusheados a GitHub

---

## 🚀 LO QUE TIENES QUE HACER (5 minutos):

### 1. Registrate en Render.com
- Ve a https://render.com/register
- Usa Gmail, GitHub o email
- O inicia sesión si ya tienes cuenta

### 2. Conecta tu repositorio de GitHub
- Dashboard de Render → Connect GitHub account
- Sigue las instrucciones

### 3. Crea un Web Service para el Backend
1. Haz clic en **New +** → **Web Service**
2. Selecciona el repositorio: `UDEP_Salud_AplicacionMovil_ProyectoSemilla`
3. **Nombre**: `piura-health-api`
4. **Environment**: Python 3
5. **Build Command**: `cd backend && pip install -r requirements.txt`
6. **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
7. **Instance Type**: Free
8. Haz clic en **Create Web Service**
9. ⏳ Espera 3-5 minutos a que se compile

### 4. Obtener tu URL pública
Una vez desplegado, Render te dará una URL como:
```
https://piura-health-api.onrender.com
```

Verifica que funciona yendo a:
```
https://piura-health-api.onrender.com/health
```

### 5. Actualizar el Frontend con tu URL

Edita el archivo `frontend/App.js` localmente y reemplaza:

**De:**
```javascript
const PRODUCTION_API_URL = 'https://TU-BACKEND-URL.onrender.com';
```

**A (con tu URL real):**
```javascript
const PRODUCTION_API_URL = 'https://piura-health-api.onrender.com';
```

Luego haz push:
```bash
cd UDEP_Salud_AplicacionMovil_ProyectoSemilla
git add frontend/App.js
git commit -m "Update production API URL to Render"
git push
```

### 6. Ejecutar la app (local o en dispositivo)
```bash
cd frontend
npm install
npm start
```

Escanea el código QR con **Expo Go** app.

---

## 📱 Para que otros accedan a la app:

### Opción A: Con Expo Go (Más fácil, sin instalar)
1. Otros descargan **Expo Go** (Google Play / App Store)
2. Tu ejecutas: `cd frontend && npm start`
3. Ellos escanean el código QR con Expo Go
4. ¡Listo! Acceden a tu app

### Opción B: APK Compilado (Sin Expo Go)
```bash
cd frontend
npx eas-cli build --platform android --profile production
```

Necesitarás cuenta en Expo (gratuita).

---

## 💡 Tips Importantes

| ¿Qué? | Detalles |
|------|---------|
| **Tier Gratuito de Render** | Se pausa si no se usa por 15 min (se reactiva en ~30 seg) |
| **Datos persistentes** | Se pierden al redeploy (para persistencia, agrega PostgreSQL gratis en Render) |
| **CORS** | Ya está configurado para públicamente |
| **URL pública** | Cualquiera puede acceder a tu backend en `https://piura-health-api.onrender.com` |

---

## ❓ Si algo no funciona

1. **Backend no responde**: Espera a que se reactive (15 min sin uso)
2. **App dice "No se pudo conectar"**: Verifica que `PRODUCTION_API_URL` sea correcta
3. **Ver logs**: Render dashboard → tu servicio → Logs

---

**¿Necesitas ayuda? Revisa [DEPLOYMENT.md](DEPLOYMENT.md) para guía completa**

¡Tu app estará pública en < 10 minutos! 🎉

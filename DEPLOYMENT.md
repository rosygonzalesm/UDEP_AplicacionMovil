# Guía de Deployment - PIURA Health Application

Esta guía te ayudará a deployar tu aplicación de forma gratuita en Render.com

## 1. Preparación del Repositorio (Ya Hecho ✓)

Los siguientes archivos ya están configurados:
- `backend/Procfile` - Configuración para Render
- `render.yaml` - Especificación de servicios
- `frontend/App.js` - Actualizado para producción

## 2. Acceder a Render.com

1. Ve a https://render.com
2. Haz clic en "Get started" o "Sign up"
3. Crea una cuenta con GitHub (recomendado) o email

## 3. Deployar el Backend

### Paso 1: Crear nuevo Web Service
- En el dashboard de Render, haz clic en "New +" → "Web Service"
- Selecciona "Deploy an existing repository"
- Si no ves tu repositorio, haz clic en "Configure account" para conectar GitHub

### Paso 2: Seleccionar el repositorio
- Selecciona: `edcisa/UDEP_Salud_AplicacionMovil_ProyectoSemilla`
- Branch: `main` (o el que uses)

### Paso 3: Configurar el servicio
- **Name**: `piura-health-api` (o el nombre que prefieras)
- **Environment**: `Python 3`
- **Build Command**: 
  ```
  cd backend && pip install -r requirements.txt
  ```
- **Start Command**:
  ```
  cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
  ```
- **Instance Type**: `Free` (para tier gratuito)

### Paso 4: Crear el servicio
- Haz clic en "Create Web Service"
- Espera a que se compile y depliegue (3-5 minutos)
- Verás una URL como: `https://piura-health-api.onrender.com`

### Paso 5: Verificar que funciona
- Ve a `https://tu-url.onrender.com/health` en tu navegador
- Debes ver una respuesta JSON

## 4. Actualizar la URL del Frontend

Una vez que tengas la URL de Render, edita `frontend/App.js`:

**Busca esta línea:**
```javascript
const PRODUCTION_API_URL = 'https://TU-BACKEND-URL.onrender.com';
```

**Reemplázala con tu URL real:**
```javascript
const PRODUCTION_API_URL = 'https://piura-health-api.onrender.com';
```

Luego haz push del cambio:
```bash
git add frontend/App.js
git commit -m "Update production API URL"
git push
```

## 5. Ejecutar la Aplicación Móvil

### Local (desarrollo):
```bash
cd frontend
npm install
npm start
```

### En dispositivo/emulador:
1. Instala la app "Expo Go" desde tu tienda de apps
2. Escanea el código QR que aparece en la terminal
3. ¡Listo! La app accederá a tu backend deployado

### Distribución pública (sin Expo Go):
Para que cualquiera pueda usar la app sin Expo Go:

```bash
# Compilar APK (Android)
cd frontend
eas build --platform android --profile production

# O compilar IPA (iOS)
eas build --platform ios --profile production
```

Necesitarás crear una cuenta en Expo y configurar EAS:
https://docs.expo.dev/build/setup/

## 6. Consideraciones Importantes

### ⚠️ Tier Gratuito de Render.com:
- El servicio se pausa después de 15 minutos sin actividad
- Tarda ~30 segundos en reactivarse en la primera solicitud
- Perfecto para prototipo y desarrollo

### 💾 Datos:
- Los registros se guardan en `backend/data/training_log.jsonl`
- En Render, estos datos son **temporales** (se pierden tras redeploy)
- Para persistencia, necesitarías una base de datos (PostgreSQL de Render es gratuito)

### 🔐 CORS:
- Ya está configurado para aceptar solicitudes desde cualquier origen
- Perfecto para aplicaciones públicas

## 7. Próximos Pasos Opcionales

### Mejora 1: Agregar Base de Datos Persistente
```
Render → Create New → PostgreSQL (Free tier)
Conectar desde el backend en main.py
```

### Mejora 2: Setup personalizado de dominio
```
Render dashboard → Settings → Custom Domain
```

### Mejora 3: Variables de entorno
```
Render dashboard → Environment → Add Environment Variable
```

## ¿Problemas?

### Backend no se conecta:
1. Verifica que la URL sea correcta sin `localhost`
2. Tu backend sigue pausado → realiza una petición para activarlo
3. Revisa los logs: Render dashboard → Logs

### App dice "No se pudo conectar con la API":
1. Verifica que `PRODUCTION_API_URL` esté correcta en App.js
2. Prueba visitando esa URL en el navegador (`/health` endpoint)
3. Usa Android Studio Debugger si usas emulador

### Datos se pierden tras redeploy:
- Esto es normal en tier gratuito
- Para producción, agregar base de datos persistente

## Recursos

- Render Docs: https://render.com/docs
- Expo Docs: https://docs.expo.dev
- FastAPI Docs: https://fastapi.tiangolo.com

¡Tu aplicación está lista para ser accedida públicamente! 🚀

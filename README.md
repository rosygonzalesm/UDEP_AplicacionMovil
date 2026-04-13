# PIURA Health Application (Prototipo)

Prototipo de sistema con:
- App movil Android (React Native con Expo) para captura y visualizacion.
- API Python (FastAPI) para procesamiento simulado y semaforo de riesgo de anemia.

## Flujo implementado

1. Al iniciar, la app solicita: sexo, edad y procedencia.
2. Se abre camara con guia visual para capturar el ojo.
3. La imagen + datos se envian al backend.
4. Backend calcula:
   - Luminosidad de la imagen.
   - Probabilidad simulada (prototipo sin modelo real).
   - Nivel de semaforo (VERDE, AMARILLO, ROJO).
5. App muestra resultado y aviso si hay baja luz.
6. Backend guarda cada registro en `backend/data/training_log.jsonl` para uso futuro en entrenamiento.

## Estructura

- `frontend/`: aplicacion Expo (Android).
- `backend/`: API FastAPI.

## Requisitos

- Node.js 20+
- npm 10+
- Python 3.10+

## Ejecutar backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Probar salud:

```bash
curl http://localhost:8000/health
```

## Ejecutar frontend (Android)

```bash
cd frontend
npm install
npm run android
```

## Ejecutar frontend en ordenador (navegador)

```bash
cd frontend
npm run web
```

Luego abre en navegador:

- `http://localhost:8082` (o el puerto que indique Expo)

## QR para abrir en movil

Con Expo en ejecucion (`npm run start` o `npm run web`), el terminal muestra un QR.

- Instala Expo Go en el movil.
- Escanea el QR mostrado por Expo.
- Si no aparece QR, reinicia con: `npm run start`.

### URL del backend en Android

En `frontend/App.js` la variable `API_BASE_URL` esta en:

- `http://10.0.2.2:8000` para emulador Android de Android Studio.

Si usas celular fisico, cambia por tu IP local, por ejemplo:

- `http://192.168.1.20:8000`

## Notas de prototipo

- El riesgo mostrado es orientativo y simulado (no diagnostico medico).
- La logica de probabilidad esta en `backend/main.py` y luego se puede reemplazar por un modelo real.
- Se puede ampliar con autenticacion, almacenamiento seguro y versionado de dataset.

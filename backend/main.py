import json
import random
from datetime import datetime
from io import BytesIO
from pathlib import Path

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageStat

app = FastAPI(title='PIURA Health Prototype API', version='0.1.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

DATA_DIR = Path(__file__).parent / 'data'
DATA_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = DATA_DIR / 'training_log.jsonl'


def estimate_luminosity(image_bytes: bytes) -> int:
    image = Image.open(BytesIO(image_bytes)).convert('L')
    stat = ImageStat.Stat(image)
    mean_l = stat.mean[0]  # 0-255
    return int((mean_l / 255) * 100)


def prototype_probability(age: int, luminosity_score: int) -> int:
    # Simulacion de probabilidad mientras no exista un modelo entrenado real.
    base = random.uniform(0.28, 0.68)
    age_factor = min(max((age - 12) / 100, 0), 0.32)
    light_penalty = 0.08 if luminosity_score < 30 else 0
    probability = min(max(base + age_factor + light_penalty, 0), 0.98)
    return int(probability * 100)


def classify_level(probability: int) -> str:
    if probability < 40:
        return 'VERDE'
    if probability < 70:
        return 'AMARILLO'
    return 'ROJO'


@app.get('/health')
def health() -> dict:
    return {'status': 'ok'}


@app.post('/predict')
async def predict(
    sexo: str = Form(...),
    edad: int = Form(...),
    procedencia: str = Form(...),
    image: UploadFile = File(...),
) -> dict:
    image_bytes = await image.read()
    luminosity_score = estimate_luminosity(image_bytes)
    probability = prototype_probability(edad, luminosity_score)
    level = classify_level(probability)

    lighting_warning = ''
    if luminosity_score < 30:
        lighting_warning = 'La imagen tiene baja luz. Se recomienda repetir la toma con mejor iluminacion.'

    output = {
        'timestamp': datetime.utcnow().isoformat(),
        'sexo': sexo,
        'edad': edad,
        'procedencia': procedencia,
        'probability': probability,
        'level': level,
        'luminosity_score': luminosity_score,
        'lighting_warning': lighting_warning,
        'note': 'Resultado orientativo de prototipo. No reemplaza diagnostico medico.',
    }

    with LOG_FILE.open('a', encoding='utf-8') as f:
        f.write(json.dumps(output, ensure_ascii=True) + '\n')

    return output

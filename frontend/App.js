import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// IMPORTANTE: URL de producción en Render.com
const PRODUCTION_API_URL = 'https://udep-aplicacionmovil.onrender.com';

const API_BASE_URL_CANDIDATES = [
  PRODUCTION_API_URL, // Producción (Render.com)
  'http://10.0.2.2:8000', // Local Android emulator
  'http://localhost:8000', // Local dev
  'http://172.20.28.132:8000', // Local LAN fallback
];

const SEX_OPTIONS = [
  { label: 'Femenino', icon: 'human-female' },
  { label: 'Masculino', icon: 'human-male' },
  { label: 'Otro', icon: 'account-question' },
];

const ORIGIN_OPTIONS = [
  { label: 'Piura', icon: 'map-marker' },
  { label: 'Castilla', icon: 'city' },
  { label: 'Sullana', icon: 'map-marker-path' },
  { label: 'Catacaos', icon: 'map-search' },
  { label: 'Otra', icon: 'form-textbox' },
];

const clampAge = (value) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return 1;
  }
  return Math.max(1, Math.min(120, parsed));
};

const LEVEL_META = {
  VERDE: { color: '#2e7d32', text: 'Riesgo bajo', icon: 'check-circle' },
  AMARILLO: { color: '#b26a00', text: 'Riesgo intermedio', icon: 'alert-circle' },
  ROJO: { color: '#b42318', text: 'Riesgo alto', icon: 'alert-octagon' },
};

const WEB_ICON_EMOJI = {
  'human-female': '👩',
  'human-male': '👨',
  'account-question': '❓',
  'map-marker': '📍',
  city: '🏙️',
  'map-marker-path': '🧭',
  'map-search': '🗺️',
  'form-textbox': '✍️',
  minus: '➖',
  plus: '➕',
  'camera-outline': '📷',
  'chevron-right': '➡️',
  restart: '🔄',
  'check-circle': '✅',
  'alert-circle': '⚠️',
  'alert-octagon': '🛑',
};

function AppIcon({ name, size = 18, color = '#334155' }) {
  if (Platform.OS === 'web') {
    return <Text style={{ fontSize: size, lineHeight: size + 2 }}>{WEB_ICON_EMOJI[name] || '•'}</Text>;
  }
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}

async function predictWithFallback(formData) {
  let lastError = null;

  for (const baseUrl of API_BASE_URL_CANDIDATES) {
    try {
      const response = await fetch(`${baseUrl}/predict`, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        lastError = new Error(`API status ${response.status}`);
        continue;
      }

      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('No se pudo conectar con la API');
}

function TileOption({ icon, label, selected, onPress }) {
  return (
    <Pressable style={[styles.tile, selected && styles.tileSelected]} onPress={onPress}>
      <View style={[styles.iconBadge, selected && styles.iconBadgeSelected]}>
        <AppIcon name={icon} size={20} color={selected ? '#ffffff' : '#334155'} />
      </View>
      <Text style={[styles.tileText, selected && styles.tileTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function StepIndicator({ step }) {
  return (
    <View style={styles.progressWrap}>
      {[1, 2, 3, 4].map((n) => (
        <View key={n} style={[styles.progressDot, n <= step && styles.progressDotActive]} />
      ))}
    </View>
  );
}

export default function App() {
  const [stage, setStage] = useState('wizard');
  const [step, setStep] = useState(1);
  const [sexo, setSexo] = useState('');
  const [edad, setEdad] = useState(25);
  const [procedencia, setProcedencia] = useState('');
  const [procedenciaTexto, setProcedenciaTexto] = useState('');
  const [formError, setFormError] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [step, stage, fadeAnim]);

  const procedenciaFinal = procedencia === 'Otra' ? procedenciaTexto.trim() : procedencia;
  const levelUi = result ? LEVEL_META[result.level] || LEVEL_META.AMARILLO : null;

  const nextStep = async () => {
    if (step === 1 && !sexo) {
      setFormError('Selecciona sexo para continuar.');
      return;
    }

    if (step === 2 && (edad < 1 || edad > 120)) {
      setFormError('Edad invalida.');
      return;
    }

    if (step === 3 && !procedenciaFinal) {
      setFormError('Selecciona procedencia.');
      return;
    }

    if (step === 3) {
      if (!permission?.granted) {
        const response = await requestPermission();
        if (!response.granted) {
          setFormError('Se necesita permiso de camara.');
          return;
        }
      }
    }

    setFormError('');
    setStep((prev) => Math.min(4, prev + 1));
  };

  const prevStep = () => {
    setFormError('');
    setStep((prev) => Math.max(1, prev - 1));
  };

  const updateAge = (nextAge) => {
    setEdad(clampAge(nextAge));
  };

  const handleAgeInput = (value) => {
    const onlyDigits = value.replace(/[^0-9]/g, '');
    if (onlyDigits === '') {
      setEdad(1);
      return;
    }
    updateAge(onlyDigits);
  };

  const captureAndAnalyze = async () => {
    if (!cameraRef.current) {
      return;
    }

    setIsSending(true);
    setFormError('');
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: false });
      const formData = new FormData();
      formData.append('sexo', sexo);
      formData.append('edad', String(edad));
      formData.append('procedencia', procedenciaFinal);
      formData.append('image', {
        uri: photo.uri,
        name: `eye_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });

      const payload = await predictWithFallback(formData);
      setResult(payload);
      setStage('result');
    } catch (error) {
      setFormError('No se pudo analizar la foto. Intenta de nuevo.');
      setStep(4);
      setStage('wizard');
    } finally {
      setIsSending(false);
    }
  };

  const resetFlow = () => {
    setResult(null);
    setFormError('');
    setStep(1);
    setStage('wizard');
  };

  return (
    <SafeAreaView style={styles.safeOuter}>
      <StatusBar barStyle="dark-content" backgroundColor="#f1f5f9" />

      <View style={styles.phoneFrame}>
        <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
          <View style={styles.header}>
            <Text style={styles.title}>Chequeo de anemia</Text>
            {stage === 'wizard' && <Text style={styles.subtitle}>Paso {step} de 4</Text>}
            {stage === 'wizard' && <StepIndicator step={step} />}
          </View>

          {stage === 'wizard' && (
            <View style={styles.content}>
              {step === 1 && (
                <View style={styles.card}>
                  <Text style={styles.stepTitle}>1. Sexo</Text>
                  <Text style={styles.helperText}>Selecciona una opcion</Text>
                  <View style={styles.grid}>
                    {SEX_OPTIONS.map((item) => (
                      <TileOption
                        key={item.label}
                        icon={item.icon}
                        label={item.label}
                        selected={sexo === item.label}
                        onPress={() => setSexo(item.label)}
                      />
                    ))}
                  </View>
                </View>
              )}

              {step === 2 && (
                <View style={styles.card}>
                  <Text style={styles.stepTitle}>2. Edad</Text>
                  <Text style={styles.helperText}>Escribe la edad o usa ajuste rapido</Text>
                  <View style={styles.ageInputWrap}>
                    <TextInput
                      style={styles.ageInput}
                      value={String(edad)}
                      onChangeText={handleAgeInput}
                      keyboardType="number-pad"
                      maxLength={3}
                      placeholder="Edad"
                      placeholderTextColor="#64748b"
                    />
                    <Text style={styles.ageSuffix}>anios</Text>
                  </View>
                  <View style={styles.ageRow}>
                    <Pressable style={styles.ageButton} onPress={() => updateAge(edad - 1)}>
                      <AppIcon name="minus" size={18} color="#ffffff" />
                    </Pressable>
                    <View style={styles.ageCenter}>
                      <Text style={styles.ageValue}>{edad}</Text>
                      <Text style={styles.ageLabel}>edad actual</Text>
                    </View>
                    <Pressable style={styles.ageButton} onPress={() => updateAge(edad + 1)}>
                      <AppIcon name="plus" size={18} color="#ffffff" />
                    </Pressable>
                  </View>
                  <View style={styles.ageQuickRow}>
                    {[-10, -5, 5, 10].map((delta) => (
                      <Pressable key={delta} style={styles.quickAgeButton} onPress={() => updateAge(edad + delta)}>
                        <Text style={styles.quickAgeText}>{delta > 0 ? `+${delta}` : `${delta}`}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {step === 3 && (
                <View style={styles.card}>
                  <Text style={styles.stepTitle}>3. Procedencia</Text>
                  <Text style={styles.helperText}>Elige una opcion</Text>
                  <View style={styles.grid}>
                    {ORIGIN_OPTIONS.map((item) => (
                      <TileOption
                        key={item.label}
                        icon={item.icon}
                        label={item.label}
                        selected={procedencia === item.label}
                        onPress={() => {
                          setProcedencia(item.label);
                          if (item.label !== 'Otra') {
                            setProcedenciaTexto('');
                          }
                        }}
                      />
                    ))}
                  </View>
                  {procedencia === 'Otra' && (
                    <TextInput
                      style={styles.input}
                      value={procedenciaTexto}
                      onChangeText={setProcedenciaTexto}
                      placeholder="Escribe tu procedencia"
                      placeholderTextColor="#64748b"
                    />
                  )}
                </View>
              )}

              {step === 4 && (
                <View style={styles.card}>
                  <Text style={styles.stepTitle}>4. Foto del ojo</Text>
                  <Text style={styles.helperText}>Centra el ojo en el circulo y toca analizar</Text>
                  <View style={styles.cameraWrap}>
                    <CameraView ref={cameraRef} style={styles.camera} facing="front" />
                    <View style={styles.focusCircle} />
                  </View>
                  <Pressable style={styles.primary} onPress={captureAndAnalyze}>
                    <AppIcon name="camera-outline" size={16} color="#ffffff" />
                    <Text style={styles.primaryText}>Tomar foto y analizar</Text>
                  </Pressable>
                </View>
              )}

              {!!formError && <Text style={styles.error}>{formError}</Text>}

              <View style={styles.navRow}>
                <Pressable
                  style={[styles.secondary, step === 1 && styles.disabledBtn]}
                  onPress={prevStep}
                  disabled={step === 1}
                >
                  <Text style={[styles.secondaryText, step === 1 && styles.disabledText]}>Atras</Text>
                </Pressable>
                {step < 4 && (
                  <Pressable style={styles.primary} onPress={nextStep}>
                    <AppIcon name="chevron-right" size={16} color="#ffffff" />
                    <Text style={styles.primaryText}>Siguiente</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {stage === 'result' && result && levelUi && (
            <View style={styles.content}>
              <View style={styles.card}>
                <View style={styles.resultHeader}>
                  <AppIcon name={levelUi.icon} size={22} color={levelUi.color} />
                  <Text style={[styles.resultTitle, { color: levelUi.color }]}>{levelUi.text}</Text>
                </View>
                <View style={styles.metrics}>
                  <Text style={styles.metricText}>Semaforo: {result.level}</Text>
                  <Text style={styles.metricText}>Probabilidad: {result.probability}%</Text>
                  <Text style={styles.metricText}>Luz: {result.luminosity_score}/100</Text>
                </View>
                {!!result.lighting_warning && <Text style={styles.warning}>{result.lighting_warning}</Text>}
                <Text style={styles.note}>{result.note}</Text>
                <Pressable style={styles.primary} onPress={resetFlow}>
                  <AppIcon name="restart" size={16} color="#ffffff" />
                  <Text style={styles.primaryText}>Nuevo chequeo</Text>
                </Pressable>
              </View>
            </View>
          )}

          {isSending && (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator size="large" color="#0f172a" />
              <Text style={styles.loaderText}>Procesando imagen...</Text>
              <Text style={styles.loaderSub}>En breve se mostrara el resultado</Text>
            </View>
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeOuter: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  phoneFrame: {
    width: '100%',
    maxWidth: 430,
    height: '100%',
    maxHeight: Platform.OS === 'web' ? 860 : undefined,
    borderRadius: Platform.OS === 'web' ? 24 : 0,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    borderWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: '#dbe2ea',
    shadowColor: '#0f172a',
    shadowOpacity: Platform.OS === 'web' ? 0.12 : 0,
    shadowRadius: Platform.OS === 'web' ? 16 : 0,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    color: '#0f172a',
    fontWeight: '700',
    fontFamily: 'Georgia',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 15,
    color: '#334155',
    fontFamily: 'Georgia',
  },
  progressWrap: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 20,
    height: 6,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  progressDotActive: {
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  stepTitle: {
    fontSize: 21,
    color: '#0f172a',
    fontWeight: '700',
    fontFamily: 'Georgia',
  },
  helperText: {
    fontSize: 14,
    color: '#475569',
    marginTop: 2,
    marginBottom: 10,
    fontFamily: 'Georgia',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tile: {
    minWidth: '47%',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  tileSelected: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eaf0f7',
  },
  iconBadgeSelected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tileText: {
    marginTop: 4,
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '600',
    fontFamily: 'Georgia',
  },
  tileTextSelected: {
    color: '#ffffff',
  },
  ageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  ageInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#0f172a',
    fontSize: 20,
    fontFamily: 'Georgia',
    backgroundColor: '#ffffff',
  },
  ageSuffix: {
    fontSize: 14,
    color: '#475569',
    fontFamily: 'Georgia',
  },
  ageButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageCenter: {
    alignItems: 'center',
  },
  ageValue: {
    fontSize: 44,
    color: '#0f172a',
    fontWeight: '700',
    fontFamily: 'Georgia',
  },
  ageLabel: {
    fontSize: 14,
    color: '#475569',
    fontFamily: 'Georgia',
  },
  ageQuickRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  quickAgeButton: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  quickAgeText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'Georgia',
  },
  input: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    color: '#0f172a',
    fontSize: 16,
    fontFamily: 'Georgia',
  },
  navRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    gap: 10,
  },
  primary: {
    minHeight: 54,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    flex: 1,
  },
  primaryText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Georgia',
  },
  secondary: {
    minHeight: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    minWidth: 110,
  },
  secondaryText: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Georgia',
  },
  disabledBtn: {
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  disabledText: {
    color: '#94a3b8',
  },
  error: {
    color: '#b42318',
    fontSize: 15,
    fontFamily: 'Georgia',
  },
  cameraWrap: {
    height: 320,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  focusCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.95)',
    backgroundColor: 'transparent',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Georgia',
  },
  metrics: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  metricText: {
    fontSize: 18,
    color: '#0f172a',
    fontFamily: 'Georgia',
  },
  warning: {
    color: '#b42318',
    fontSize: 15,
    marginBottom: 8,
    fontFamily: 'Georgia',
  },
  note: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
    fontFamily: 'Georgia',
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  loaderText: {
    marginTop: 8,
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Georgia',
  },
  loaderSub: {
    marginTop: 2,
    color: '#475569',
    fontSize: 14,
    fontFamily: 'Georgia',
  },
});

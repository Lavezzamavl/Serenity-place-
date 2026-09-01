export function validatePatientForm(form) {
  const errors = {};

  // Name: letters, spaces, hyphens, apostrophes, periods only - no digits
  if (!form.full_name.trim()) {
    errors.full_name = 'Full name is required.';
  } else if (!/^[A-Za-zÀ-ÿ\s.'-]+$/.test(form.full_name)) {
    errors.full_name = 'Name can only contain letters, spaces, hyphens, and apostrophes — no numbers.';
  }

  const age = Number(form.age);
  if (!form.age || age < 0 || age > 120) {
    errors.age = 'Age must be between 0 and 120.';
  }

  if (form.height_cm) {
    const h = Number(form.height_cm);
    if (h < 30 || h > 250) errors.height_cm = 'Height must be between 30 and 250 cm.';
  }

  if (form.weight_kg) {
    const w = Number(form.weight_kg);
    if (w < 2 || w > 300) errors.weight_kg = 'Weight must be between 2 and 300 kg.';
  }

  if (form.temperature_c) {
    const t = Number(form.temperature_c);
    if (t < 30 || t > 43) errors.temperature_c = 'Temperature must be between 30.0 and 43.0 °C.';
  }

  if (form.pulse_bpm) {
    const p = Number(form.pulse_bpm);
    if (p < 30 || p > 220) errors.pulse_bpm = 'Pulse must be between 30 and 220 bpm.';
  }

  if (form.blood_pressure) {
    const match = /^(\d{2,3})\/(\d{2,3})$/.exec(form.blood_pressure);
    if (!match) {
      errors.blood_pressure = 'Format must be systolic/diastolic, e.g. 120/80.';
    } else {
      const systolic = Number(match[1]);
      const diastolic = Number(match[2]);
      if (systolic < 60 || systolic > 250) errors.blood_pressure = 'Systolic must be between 60 and 250 mmHg.';
      else if (diastolic < 30 || diastolic > 150) errors.blood_pressure = 'Diastolic must be between 30 and 150 mmHg.';
      else if (diastolic >= systolic) errors.blood_pressure = 'Diastolic must be lower than systolic.';
    }
  }

  return errors;
}
// Quarter-note beats, with BAR 1 at zero. BAR 0 is [-pickupBeats, 0).
export const barBeats = meter => (meter?.numerator || 4) * 4 / (meter?.denominator || 4);
export function validatePickup(value = 0, meter) {
  if (!Number.isFinite(value) || value < 0 || value >= barBeats(meter))
    throw Error('Pickup must be at least 0 and shorter than one bar.');
  return value;
}
export function pickupFor(notes, meter) {
  const first = Math.min(0, ...notes.map(n => n.start));
  // Round outward to a MIDI tick; never discard an imperfect recorded attack.
  return validatePickup(Math.max(0, Math.ceil(-first * 960 - 1e-7) / 960), meter);
}
export function shiftNotes(notes, delta) {
  return notes.map(n => ({ ...n, start: n.start + delta, end: n.end + delta }));
}
export function pickupTail(notes, totalBeats, pickupBeats) {
  return notes.filter(n => n.start < 0 && n.end > -pickupBeats).map(n => ({
    ...n, start: totalBeats + Math.max(n.start, -pickupBeats),
    end: totalBeats + Math.min(n.end, 0), pickupRepeat: true,
  }));
}
// Conversion to the nonnegative file timeline happens only at the MIDI boundary.
export function pickupExportLayout(pickupBeats = 0, meter, mode = 'padded') {
  validatePickup(pickupBeats, meter);
  if (!pickupBeats) return { shift: 0, firstMeter: meter };
  if (mode === 'padded') return { shift: barBeats(meter), firstMeter: meter };
  if (mode !== 'short') throw Error('Unknown pickup export mode.');
  for (const denominator of [4, 8, 16, 32]) {
    const numerator = pickupBeats * denominator / 4;
    if (numerator >= 1 && numerator <= 255 && Math.abs(numerator - Math.round(numerator)) < 1e-7)
      return { shift: pickupBeats, firstMeter: { numerator: Math.round(numerator), denominator } };
  }
  throw Error('This pickup cannot be represented by a standard MIDI meter. Choose a full rest bar.');
}

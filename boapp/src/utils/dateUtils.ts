import * as momentTZ from "moment-timezone";

export const deUTCaUTCMas3 = (fecha: string, hora: string): {fechaMas3: string, horaMas3: string} => {
  const fechaHoraUtc = momentTZ.utc(`${fecha}T${hora}`);
  const fechaHoraMas3 = fechaHoraUtc.tz('Europe/Istanbul');

  const fechaMas3 = fechaHoraMas3.format('YYYY-MM-DD');
  const horaMas3 = fechaHoraMas3.format('HH:mm');

  return { fechaMas3, horaMas3 }
};

export const deUTCMas3aUTC = (fecha: string, hora: string): { fechaUtc: string; horaUtc: string } => {
  const fechaHoraMas3 = momentTZ.tz(`${fecha}T${hora}`, 'Europe/Istanbul');
  const fechaHoraUtc = fechaHoraMas3.utc();

  const fechaUtc = fechaHoraUtc.format('YYYY-MM-DD');
  const horaUtc = fechaHoraUtc.format('HH:mm');

  return { fechaUtc, horaUtc };
}

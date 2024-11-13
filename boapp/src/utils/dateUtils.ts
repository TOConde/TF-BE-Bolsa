import * as momentTZ from "moment-timezone";

export const deUTCaUTCMas3 = (fecha: string, hora: string): {fechaMas3: string, horaMas3: string} => {
  const fechaHoraUtc = momentTZ.utc(`${fecha}T${hora}`);
  const fechaHoraMas3 = fechaHoraUtc.tz('Europe/Istanbul');

  const fechaMas3 = fechaHoraMas3.format('YYYY-MM-DD');
  const horaMas3 = fechaHoraMas3.format('HH:mm');

  return { fechaMas3, horaMas3 }
};

export const deUTCMas3aUTC = () => {
  //logica inversa, para llevar de utc+3 a utc
}

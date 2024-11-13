export const deUTCaUTCMas3 = (fecha: string, hora: string): Date => {
  const fechaHoraUTC = new Date(`${fecha}T${hora}Z`);
  fechaHoraUTC.setHours(fechaHoraUTC.getHours() + 3);
  return fechaHoraUTC;
};

// Lista de ciudades donde Motomandados ya tiene operación activa
export const MOTOMANDADOS_COVERAGE = [
  'Rosario del Tala',
  'Villaguay',
  'Ingeniero Sajaroff',
  'Villa Dominguez',
  'Villa Clara',
  'Resistencia',
  'Corrientes',
  'Paraná',
  'Concordia'
];

export const isCityCovered = (city) => {
  if (!city) return false;
  return MOTOMANDADOS_COVERAGE.some(c => 
    city.toLowerCase().includes(c.toLowerCase())
  );
};

exports.seed = async function(knex) {
  // Check if table is already populated
  const [{ count }] = await knex('aldi_locations').count('* as count');
  if (parseInt(count) > 0) {
    console.log('aldi_locations table is already populated, skipping seed.');
    return;
  }

  const locations = [];
  
  function pad(num) {
    return num.toString().padStart(2, '0');
  }

  function addLocation(type, build, row, aisle, loc, name, cooling) {
    locations.push({
      barcode: `${type}${pad(build)}${pad(row)}${pad(aisle)}${pad(loc)}`,
      type_code: type,
      building_num: build,
      row_num: row,
      aisle_num: aisle,
      location_num: loc,
      name: name,
      cooling_type: cooling
    });
  }

  // 1. Hűtő (Hideg)
  addLocation('H', 1, 0, 0, 0, '1. Hűtő (Hideg)', 'Hideg');
  // Sor 1: 5 köz, 1 tárhely
  for (let k = 1; k <= 5; k++) {
    addLocation('H', 1, 1, k, 1, `1. Hűtő - 1. sor ${k}. köz 1. tárhely`, 'Hideg');
  }
  // Sor 2: 3 köz, 2 tárhely
  for (let k = 1; k <= 3; k++) {
    for (let t = 1; t <= 2; t++) {
      addLocation('H', 1, 2, k, t, `1. Hűtő - 2. sor ${k}. köz ${t}. tárhely`, 'Hideg');
    }
  }

  // 1. Csarnok (Vegyes)
  addLocation('CS', 1, 0, 0, 0, '1. Csarnok (Vegyes)', 'Vegyes');
  // Sor 1 és 2: 1 köz, 11 tárhely
  for (let s = 1; s <= 2; s++) {
    for (let t = 1; t <= 11; t++) {
      addLocation('CS', 1, s, 1, t, `1. Csarnok - ${s}. sor ${t}. tárhely`, 'Vegyes');
    }
  }

  // 2. Csarnok (Meleg)
  addLocation('CS', 2, 0, 0, 0, '2. Csarnok (Meleg)', 'Meleg');
  // Sor 1: 4 köz, 2 tárhely
  for (let k = 1; k <= 4; k++) {
    for (let t = 1; t <= 2; t++) {
      addLocation('CS', 2, 1, k, t, `2. Csarnok - 1. sor ${k}. köz ${t}. tárhely`, 'Meleg');
    }
  }
  // Sor 2: 3 köz, 3 tárhely
  for (let k = 1; k <= 3; k++) {
    for (let t = 1; t <= 3; t++) {
      addLocation('CS', 2, 2, k, t, `2. Csarnok - 2. sor ${k}. köz ${t}. tárhely`, 'Meleg');
    }
  }

  // Rámpák (Vegyes)
  for (let r = 1; r <= 7; r++) {
    addLocation('R', r, 1, 1, 1, `${r}-es rámpa`, 'Vegyes');
  }

  await knex('aldi_locations').insert(locations);
};

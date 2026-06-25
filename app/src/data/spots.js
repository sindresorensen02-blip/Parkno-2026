// Placeholder Bergen parking spots used by both the map and the search/list view.
// Each spot has map fields (latitude/longitude) and list fields (distance/walk/until/featured).

export const BERGEN_SPOTS = [
  // Sentrum
  { id: 'p01', address: 'Torgallmenningen 8',      area: 'Sentrum',    price: 45, available: true,  latitude: 60.39292, longitude: 5.32464, tags: ['Innendørs', 'Kamera'],                 distanceKm: 0.2, distance: '0,2 km', walk: '3 min',  until: 'Ledig til 18:00', featured: true  },
  { id: 'p02', address: 'Strandgaten 18',          area: 'Sentrum',    price: 40, available: true,  latitude: 60.39439, longitude: 5.32135, tags: ['Tak over'],                            distanceKm: 0.3, distance: '0,3 km', walk: '4 min',  until: 'Ledig til 19:00', featured: false },
  { id: 'p03', address: 'Olav Kyrres gate 22',     area: 'Sentrum',    price: 38, available: true,  latitude: 60.39047, longitude: 5.32339, tags: ['Innendørs', 'Kamera'],                 distanceKm: 0.4, distance: '0,4 km', walk: '5 min',  until: 'Ledig til 16:00', featured: false },
  { id: 'p04', address: 'Christies gate 13',       area: 'Sentrum',    price: 35, available: true,  latitude: 60.38913, longitude: 5.32307, tags: ['Belyst'],                              distanceKm: 0.5, distance: '0,5 km', walk: '6 min',  until: 'Ledig til 20:00', featured: false },
  { id: 'p05', address: 'Kong Oscars gate 54',     area: 'Sentrum',    price: 30, available: true,  latitude: 60.39234, longitude: 5.33272, tags: ['Belyst', 'Kamera'],                    distanceKm: 0.5, distance: '0,5 km', walk: '6 min',  until: 'Ledig til 22:00', featured: false },
  { id: 'p06', address: 'Marken 12',               area: 'Sentrum',    price: 32, available: true,  latitude: 60.39204, longitude: 5.33074, tags: ['Tak over'],                            distanceKm: 0.4, distance: '0,4 km', walk: '5 min',  until: 'Ledig til 21:00', featured: false },
  { id: 'p07', address: 'Vetrlidsallmenningen 7',  area: 'Sentrum',    price: 43, available: true,  latitude: 60.39578, longitude: 5.32754, tags: ['Innendørs', 'Elbil 11kW'],             distanceKm: 0.6, distance: '0,6 km', walk: '7 min',  until: 'Ledig til 23:00', featured: false },
  { id: 'p08', address: 'Bryggen 15',              area: 'Bryggen',    price: 48, available: true,  latitude: 60.39667, longitude: 5.32433, tags: ['Kamera'],                              distanceKm: 0.6, distance: '0,6 km', walk: '7 min',  until: 'Ledig til 17:00', featured: false },
  { id: 'p09', address: 'Domkirkegaten 6',         area: 'Sentrum',    price: 35, available: true,  latitude: 60.39371, longitude: 5.32939, tags: ['Innendørs'],                           distanceKm: 0.3, distance: '0,3 km', walk: '4 min',  until: 'Ledig til 20:30', featured: false },
  { id: 'p10', address: 'Korskirkeallmenningen 4', area: 'Sentrum',    price: 38, available: true,  latitude: 60.39531, longitude: 5.32892, tags: ['Belyst'],                              distanceKm: 0.3, distance: '0,3 km', walk: '4 min',  until: 'Ledig til 22:30', featured: false },

  // Møhlenpris / Nygård
  { id: 'p11', address: 'Nygårdsgaten 90',         area: 'Nygård',     price: 32, available: true,  latitude: 60.38566, longitude: 5.33125, tags: ['Belyst', 'Kamera'],                    distanceKm: 0.7, distance: '0,7 km', walk: '8 min',  until: 'Ledig til 19:30', featured: false },
  { id: 'p12', address: 'Møhlenprisbakken 6',      area: 'Møhlenpris', price: 28, available: true,  latitude: 60.38683, longitude: 5.31967, tags: ['Tak over', 'Elbil 11kW'],              distanceKm: 0.8, distance: '0,8 km', walk: '10 min', until: 'Ledig til 21:00', featured: false },
  { id: 'p13', address: 'Olaf Ryes vei 25',        area: 'Møhlenpris', price: 26, available: true,  latitude: 60.38714, longitude: 5.32265, tags: ['Belyst'],                              distanceKm: 0.8, distance: '0,8 km', walk: '10 min', until: 'Ledig til 22:00', featured: false },
  { id: 'p14', address: 'Ibsens gate 88',          area: 'Møhlenpris', price: 25, available: true,  latitude: 60.37340, longitude: 5.34815, tags: ['Belyst'],                              distanceKm: 0.9, distance: '0,9 km', walk: '11 min', until: 'Ledig til 23:00', featured: false },
  { id: 'p15', address: 'Welhavens gate 70',       area: 'Møhlenpris', price: 27, available: true,  latitude: 60.38485, longitude: 5.32330, tags: ['Tak over'],                            distanceKm: 0.9, distance: '0,9 km', walk: '11 min', until: 'Ledig til 18:30', featured: false },

  // Nordnes
  { id: 'p16', address: 'Haugeveien 22',           area: 'Nordnes',    price: 31, available: true,  latitude: 60.39665, longitude: 5.30840, tags: ['Belyst'],                              distanceKm: 0.9, distance: '0,9 km', walk: '11 min', until: 'Ledig til 20:00', featured: false },
  { id: 'p17', address: 'Klosteret 4',             area: 'Nordnes',    price: 34, available: true,  latitude: 60.39478, longitude: 5.31537, tags: ['Tak over', 'Kamera'],                  distanceKm: 0.9, distance: '0,9 km', walk: '11 min', until: 'Ledig til 21:30', featured: false },
  { id: 'p18', address: 'Strangehagen 15',         area: 'Nordnes',    price: 30, available: true,  latitude: 60.39566, longitude: 5.31164, tags: ['Belyst'],                              distanceKm: 1.0, distance: '1,0 km', walk: '12 min', until: 'Ledig til 22:00', featured: false },
  { id: 'p19', address: 'Nordnesveien 35',         area: 'Nordnes',    price: 28, available: true,  latitude: 60.39853, longitude: 5.30748, tags: ['Kamera'],                              distanceKm: 1.2, distance: '1,2 km', walk: '14 min', until: 'Ledig til 17:00', featured: false },
  { id: 'p20', address: 'Tollbodallmenningen 8',   area: 'Nordnes',    price: 37, available: true,  latitude: 60.39843, longitude: 5.30983, tags: ['Innendørs', 'Elbil 22kW'],             distanceKm: 0.9, distance: '0,9 km', walk: '11 min', until: 'Ledig til 23:59', featured: false },

  // Sandviken / Bergenhus / Kalfaret
  { id: 'p21', address: 'Sandviksveien 47',        area: 'Sandviken',  price: 26, available: true,  latitude: 60.40848, longitude: 5.32367, tags: ['Belyst', 'Kamera'],                    distanceKm: 1.3, distance: '1,3 km', walk: '16 min', until: 'Ledig til 20:30', featured: false },
  { id: 'p22', address: 'Helgesens gate 12',       area: 'Sandviken',  price: 25, available: true,  latitude: 60.40047, longitude: 5.32379, tags: ['Belyst'],                              distanceKm: 1.8, distance: '1,8 km', walk: '22 min', until: 'Ledig til 21:00', featured: false },
  { id: 'p23', address: 'Amalie Skrams vei 9',     area: 'Sandviken',  price: 27, available: true,  latitude: 60.41303, longitude: 5.32266, tags: ['Tak over'],                            distanceKm: 1.6, distance: '1,6 km', walk: '20 min', until: 'Ledig til 22:00', featured: false },
  { id: 'p24', address: 'Kalfarveien 31',          area: 'Kalfaret',   price: 30, available: true,  latitude: 60.38819, longitude: 5.34125, tags: ['Belyst', 'Kamera'],                    distanceKm: 1.1, distance: '1,1 km', walk: '13 min', until: 'Ledig til 23:00', featured: false },
  { id: 'p25', address: 'Skutevikstorget 3',       area: 'Skuteviken', price: 28, available: true,  latitude: 60.40235, longitude: 5.32083, tags: ['Tak over'],                            distanceKm: 1.4, distance: '1,4 km', walk: '17 min', until: 'Ledig til 18:00', featured: false },

  // Laksevåg
  { id: 'p26', address: 'Damsgårdsveien 28',       area: 'Laksevåg',   price: 22, available: true,  latitude: 60.37778, longitude: 5.33007, tags: ['Belyst'],                              distanceKm: 1.6, distance: '1,6 km', walk: '20 min', until: 'Ledig til 22:00', featured: false },
  { id: 'p27', address: 'Carl Konows gate 14',     area: 'Laksevåg',   price: 23, available: true,  latitude: 60.38450, longitude: 5.30707, tags: ['Belyst', 'Kamera'],                    distanceKm: 2.0, distance: '2,0 km', walk: '24 min', until: 'Ledig til 21:00', featured: false },
  { id: 'p28', address: 'Gravdalsveien 35',        area: 'Laksevåg',   price: 21, available: true,  latitude: 60.38725, longitude: 5.26703, tags: ['Belyst'],                              distanceKm: 2.5, distance: '2,5 km', walk: '30 min', until: 'Ledig til 23:00', featured: false },
  { id: 'p29', address: 'Melkeplassen 6',          area: 'Laksevåg',   price: 25, available: true,  latitude: 60.37619, longitude: 5.30643, tags: ['Tak over', 'Elbil 11kW'],              distanceKm: 2.4, distance: '2,4 km', walk: '29 min', until: 'Ledig til 22:30', featured: false },
  { id: 'p30', address: 'Gyldenpris 18',           area: 'Laksevåg',   price: 24, available: true,  latitude: 60.37158, longitude: 5.30423, tags: ['Belyst'],                              distanceKm: 1.5, distance: '1,5 km', walk: '18 min', until: 'Ledig til 17:30', featured: false },

  // Fyllingsdalen
  { id: 'p31', address: 'Folke Bernadottes vei 30', area: 'Fyllingsdalen', price: 20, available: true,  latitude: 60.35478, longitude: 5.29175, tags: ['Innendørs', 'Belyst', 'Kamera'], distanceKm: 5.2, distance: '5,2 km', walk: '62 min', until: 'Ledig til 23:59', featured: false },
  { id: 'p32', address: 'Krohnstadhaugen 10',      area: 'Fyllingsdalen', price: 21, available: true,  latitude: 60.35350, longitude: 5.28400, tags: ['Tak over'],                       distanceKm: 4.7, distance: '4,7 km', walk: '56 min', until: 'Ledig til 22:00', featured: false },
  { id: 'p33', address: 'Fyllingsveien 70',        area: 'Fyllingsdalen', price: 18, available: true,  latitude: 60.37247, longitude: 5.30357, tags: ['Belyst'],                          distanceKm: 5.4, distance: '5,4 km', walk: '64 min', until: 'Ledig til 23:00', featured: false },
  { id: 'p34', address: 'Spelhaugen 8',            area: 'Fyllingsdalen', price: 22, available: true,  latitude: 60.35056, longitude: 5.27590, tags: ['Tak over', 'Elbil 22kW'],          distanceKm: 4.5, distance: '4,5 km', walk: '54 min', until: 'Ledig til 21:30', featured: false },

  // Årstad / Kronstad / Solheim / Fjøsanger
  { id: 'p35', address: 'Kronstadveien 22',        area: 'Kronstad',   price: 25, available: true,  latitude: 60.37705, longitude: 5.34456, tags: ['Belyst', 'Kamera'],                    distanceKm: 2.4, distance: '2,4 km', walk: '29 min', until: 'Ledig til 20:00', featured: false },
  { id: 'p36', address: 'Storetveitvegen 7',       area: 'Storetveit', price: 23, available: true,  latitude: 60.33801, longitude: 5.34522, tags: ['Belyst'],                              distanceKm: 3.8, distance: '3,8 km', walk: '46 min', until: 'Ledig til 21:00', featured: false },
  { id: 'p37', address: 'Inndalsveien 28',         area: 'Inndalen',   price: 22, available: true,  latitude: 60.36919, longitude: 5.35052, tags: ['Tak over'],                            distanceKm: 2.9, distance: '2,9 km', walk: '35 min', until: 'Ledig til 18:00', featured: false },
  { id: 'p38', address: 'Solheimsgaten 15',        area: 'Solheim',    price: 26, available: true,  latitude: 60.37705, longitude: 5.33596, tags: ['Belyst', 'Elbil 11kW'],                distanceKm: 1.9, distance: '1,9 km', walk: '23 min', until: 'Ledig til 22:00', featured: false },
  { id: 'p39', address: 'Fjøsangerveien 50',       area: 'Fjøsanger',  price: 27, available: true,  latitude: 60.38770, longitude: 5.33334, tags: ['Innendørs'],                           distanceKm: 2.7, distance: '2,7 km', walk: '32 min', until: 'Ledig til 23:00', featured: false },

  // Minde / Wergeland / Landås
  { id: 'p40', address: 'Mindemyren 12',           area: 'Mindemyren', price: 20, available: true,  latitude: 60.36446, longitude: 5.33900, tags: ['Belyst'],                              distanceKm: 3.0, distance: '3,0 km', walk: '36 min', until: 'Ledig til 22:30', featured: false },
  { id: 'p41', address: 'Wergelands allé 14',      area: 'Wergeland',  price: 21, available: true,  latitude: 60.35843, longitude: 5.35239, tags: ['Tak over'],                            distanceKm: 4.0, distance: '4,0 km', walk: '48 min', until: 'Ledig til 21:00', featured: false },
  { id: 'p42', address: 'Landåsveien 25',          area: 'Landås',     price: 22, available: true,  latitude: 60.36336, longitude: 5.36734, tags: ['Belyst', 'Kamera'],                    distanceKm: 4.0, distance: '4,0 km', walk: '48 min', until: 'Ledig til 22:00', featured: false },
  { id: 'p43', address: 'Natlandsveien 90',        area: 'Natland',    price: 20, available: true,  latitude: 60.35250, longitude: 5.36550, tags: ['Belyst'],                              distanceKm: 4.7, distance: '4,7 km', walk: '56 min', until: 'Ledig til 17:00', featured: false },

  // Åsane
  { id: 'p44', address: 'Åsamyrane 70',            area: 'Åsane',      price: 18, available: true,  latitude: 60.46095, longitude: 5.32248, tags: ['Innendørs', 'Belyst'],                 distanceKm: 8.7, distance: '8,7 km', walk: '105 min', until: 'Ledig til 23:00', featured: false },
  { id: 'p45', address: 'Tertnesveien 32',         area: 'Åsane',      price: 19, available: true,  latitude: 60.45762, longitude: 5.28855, tags: ['Tak over'],                            distanceKm: 8.6, distance: '8,6 km', walk: '103 min', until: 'Ledig til 22:00', featured: false },
  { id: 'p46', address: 'Eidsvågveien 8',          area: 'Eidsvåg',    price: 20, available: true,  latitude: 60.44170, longitude: 5.28322, tags: ['Belyst', 'Kamera'],                    distanceKm: 4.5, distance: '4,5 km', walk: '54 min', until: 'Ledig til 21:30', featured: false },

  // Fana / Paradis / Hop
  { id: 'p47', address: 'Paradisvegen 4',          area: 'Paradis',    price: 21, available: true,  latitude: 60.33664, longitude: 5.34530, tags: ['Belyst'],                              distanceKm: 5.6, distance: '5,6 km', walk: '67 min', until: 'Ledig til 22:00', featured: false },
  { id: 'p48', address: 'Hopsveien 12',            area: 'Hop',        price: 20, available: true,  latitude: 60.32678, longitude: 5.34215, tags: ['Tak over'],                            distanceKm: 7.3, distance: '7,3 km', walk: '88 min', until: 'Ledig til 23:00', featured: false },
  { id: 'p49', address: 'Fanavegen 18',            area: 'Fana',       price: 19, available: true,  latitude: 60.30026, longitude: 5.32914, tags: ['Belyst'],                              distanceKm: 9.7, distance: '9,7 km', walk: '116 min', until: 'Ledig til 16:30', featured: false },

  // Ytrebygda / Sandsli
  { id: 'p50', address: 'Sandsliåsen 30',          area: 'Sandsli',    price: 21, available: true,  latitude: 60.29185, longitude: 5.29020, tags: ['Innendørs', 'Elbil 22kW', 'Kamera'],  distanceKm: 11.4, distance: '11,4 km', walk: '137 min', until: 'Ledig til 23:59', featured: false },
];

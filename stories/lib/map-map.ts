import { MapMap } from '@/map-map';

let map1 = new MapMap<[ string ], any>();
map1.set('a', 'stuff');
console.log(map1.get('a'), map1.get('b'));

let map2 = new MapMap<[ string, number ], any>();
map2.set('a', 3, 'stuff');
console.log(map2.get('a', 3), map2.get('a', 4), map2.get('b', 3));

let map3 = new MapMap<[ string, number, boolean ], any>();
map3.set('a', 3, true, 'stuff');
console.log(map3.get('a', 3, true), map3.get('a', 3, false), map3.get('b', 3, true));

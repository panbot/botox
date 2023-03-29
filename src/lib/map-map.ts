import { MAYBE, REMOVE_TAIL } from "./types";

export class MapMap<KEYS extends any[], VALUE> {

    map = new Map<any, any>();

    get(...keys: KEYS) {
        let key = keys.pop();
        let map = this.get_map(keys as unknown as REMOVE_TAIL<KEYS>);
        return map?.get(key) as MAYBE<VALUE>;
    }

    set(...args: [ ...KEYS, VALUE ]) {
        let value = args.pop() as VALUE;
        let keys = args as unknown as KEYS;

        let map = this.map;
        while (keys.length > 1) {
            let key = keys.shift();
            let next = map.get(key);
            if (!next) {
                next = new Map<any, any>();
                map.set(key, next);
            }
            map = next;
        }
        map.set(keys[0], value);

        return this;
    }

    get_map(keys: REMOVE_TAIL<KEYS>) {
        let map = this.map;
        while (keys.length) {
            let key = keys.shift();
            let next = map.get(key);
            if (!next) return;
            map = next;
        }
        return map;
    }
}

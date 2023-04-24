import { MAYBE } from "./types";

export class MapMap<KEYS extends any[], VALUE> {

    map = new Map<any, any>();

    get(...keys: KEYS) {
        let key = keys.pop();
        let map = this.map;
        while (keys.length) {
            let key = keys.shift();
            let next = map.get(key);
            if (!next) return;
            map = next;
        }
        return map.get(key) as MAYBE<VALUE>;
    }

    set(...args: [ ...keys: KEYS, value: VALUE ]) {
        let value: any = args.pop();
        let keys: any[] = args;
        let key = keys.pop();
        let map = this.map;
        while (keys.length) {
            let key = keys.shift();
            let next = map.get(key);
            if (!next) {
                next = new Map<any, any>();
                map.set(key, next);
            }
            map = next;
        }
        map.set(key, value);

        return this;
    }

    has(...keys: PARTIAL_KEY<KEYS>) {

    }
}

type PARTIAL_KEY<KEY>
    = KEY extends []
    ? never
    : KEY extends [ infer U ]
    ? [ U ]
    : KEY extends [ ...infer V, infer W ]
    ? [ ...V, W ] | PARTIAL_KEY<V>
    : never
;

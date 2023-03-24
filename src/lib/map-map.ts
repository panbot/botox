import { RemoveTail } from "./types";

export class MapMap<Keys extends any[], Value> {

    map = new Map<any, any>();

    get(...keys: Keys): Value {
        let key = keys.pop();
        let map = this.getMap(keys as unknown as RemoveTail<Keys>);
        return map?.get(key);
    }

    set(...args: [ ...Keys, Value ]) {
        let value = args.pop() as Value;
        let keys = args as unknown as Keys;

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

    getMap(keys: RemoveTail<Keys>) {
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

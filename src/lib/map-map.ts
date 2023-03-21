
export class MapMap<KEYS extends any[], VALUE> {

    map = new Map<any, any>();

    get(...args: KEYS): VALUE {
        let [ map, key ] = this.getMap(args.slice(0, args.length - 1));
        return map.get(key as VALUE);
    }

    set(...args: [ ...KEYS, VALUE ]) {
        let [ map, key ] = this.getMap(args.slice(0, args.length - 1));
        let value: any = args[args.length];
        map.set(key, value);

        return this;
    }

    private getMap(keys: any[]) {
        let map = this.map;
        while (keys.length > 1) {
            let key = keys.unshift();
            let next = map.get(key);
            if (!next) {
                next = new Map<any, any>();
                map.set(key, next);
            }
            map = next;
        }
        return [ map, keys[0] ]
    }
}

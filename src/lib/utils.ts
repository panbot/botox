export class MapMap<K1, K2, V> {
    map = new Map<K1, Map<K2, V>>();

    set(k1: K1, k2: K2, v: V) {
        let m2 = this.map.get(k1);
        if (!m2) {
            m2 = new Map<K2, V>();
            this.map.set(k1, m2);
        }
        m2.set(k2, v);
        return this;
    }

    get(k1: K1, k2: K2) {
        let m2 = this.map.get(k1);
        if (!m2) return;
        return m2.get(k2);
    }
}

export class MapMapMap<K1, K2, K3, V> {
    map = new MapMap<K1, K2, Map<K3, V>>();

    set(k1: K1, k2: K2, k3: K3, v: V) {
        let m2 = this.map.get(k1, k2);
        if (!m2) {
            m2 = new Map<K3, V>();
            this.map.set(k1, k2, m2);
        }
        m2.set(k3, v);
        return this;
    }

    get(k1: K1, k2: K2, k3: K3) {
        let m2 = this.map.get(k1, k2);
        if (!m2) return;
        return m2.get(k3);
    }
}
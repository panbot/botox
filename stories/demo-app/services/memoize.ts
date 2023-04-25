import aop_factory from "@/aop/factory";
import metadata_registry from "@/metadata-registry";
import { CONSTRUCTOR } from "@/types";

function memoize(around: aop_factory.AOP["around"]) {
    const get_registry = metadata_registry.property_factory(false)(metadata_registry.create_key<Cache>());
    return (
        timeout: number,
        auto_update?: boolean,
    ) => {
        return around<Object, PropertyKey, () => any>(advice(auto_update ? AutoUpdateCache : TimeoutCache));

        function advice(cache: CONSTRUCTOR<Cache>): aop_factory.AROUND_ADVICE<any, any, any> {
            return p => get_registry(p.target, p.method).get_or_set(() => new cache).get_cached_value(timeout, p.invoke);
        }
    }
}

namespace memoize {

}

export default memoize

interface Cache {
    get_cached_value(timeout: number, get_value: () => any): any
}

class TimeoutCache implements Cache {

    value: any;

    last_updated_at: number = 0;

    get_cached_value(
        timeout: number,
        get_value: () => any,
    ) {
        return this.is_expired(timeout)
            ? this.update(get_value(), timeout)
            : this.value
    }

    is_expired(timeout: number) {
        return new Date().getTime() >= this.last_updated_at + timeout
    }

    update(value: any, timeout: number) {
        this.last_updated_at = Math.floor(new Date().getTime() / timeout) * timeout;
        this.value = value;
        return value;
    }
}

class AutoUpdateCache implements Cache {

    value: any;

    get_cached_value(
        timeout: number,
        get_value: () => any,
    ) {
        const update = () => {
            this.value = get_value();
            setTimeout(update, timeout).unref();
        }
        update();

        this.get_cached_value = () => this.value;

        return this.value;
    }

    start_timer() {

    }
}
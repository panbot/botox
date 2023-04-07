import decorator from "../lib/decorator";
import expandify from "../lib/expandify";
import mr from "../lib/metadata-registry";
import { CONSTRUCTOR, typram } from "../lib/types";
import types from "./types";

const helpers = decorator.helpers;
import OPTIONS = types.VALIDATABLE_OPTIONS;
import metadata_registry from "../lib/metadata-registry";

function factory_factory() {

    const get_registry = helpers.registry_factory(
        typram<CONSTRUCTOR>(),
        typram<OPTIONS>(),
        'class',
    );

    function factory<T>(
        arg : OPTIONS<T>
            | OPTIONS<T>["parser"]
    ) {

        let works: ((o: OPTIONS<T>) => void)[] = [];

        const decorator = Object.assign(
            function (target: CONSTRUCTOR) {
                let options: OPTIONS<T>;
                if (typeof arg == 'function') options = { parser: arg }
                else options = arg;

                works.forEach(work => work(options));

                get_registry(target).set(options);
            },
            {
                validator: (validator: OPTIONS<T>["validator"]) => {
                    works.push(o => o.validator = validator);
                    return decorator;
                },
            }
        );

        return decorator;
    }
    type R = ReturnType<typeof factory>

    let expandable = expandify(
        factory satisfies {
            <T>(options: OPTIONS<T>): R,
            <T>(parser : OPTIONS<T>["parser"]): R,
        }
    );

    return expandable[expandify.expand]({
        [metadata_registry.get_registry]: get_registry,
    })
}

function botox_validatable_factory() {

    return factory_factory()[expandify.expand]({

        get(type: CONSTRUCTOR) {
            return this[mr.get_registry](type).get()
        },

        "get!"(type: CONSTRUCTOR<any>) {
            let options = this.get(type);
            if (!options) options = {
                parser: () => { throw new TypeError('not validatable') }
            }
            return options;
        },
    })
}

namespace botox_validatable_factory {
    export type VALIDATABLE = ReturnType<typeof botox_validatable_factory>;
}

export default botox_validatable_factory
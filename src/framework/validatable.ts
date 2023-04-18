import decorator from "../lib/decorator";
import expandify from "../lib/expandify";
import mr from "../lib/metadata-registry";
import { CONSTRUCTOR } from "../lib/types";
import types from "./types";

import OPTIONS = types.VALIDATABLE_OPTIONS;

function botox_validatable_factory() {

    let base = decorator.create_class_decorator({
        init_by: (
            ctx,
            arg : OPTIONS
                | OPTIONS["parser"]
        ): OPTIONS => {
            if (typeof arg == 'function') return { parser: arg }
            else return arg
        }
    });

    let expanded = base[expandify.expand]({

        get(type: CONSTRUCTOR) {
            return this[mr.get_registry](type).get()
        },

        "get!"(type: CONSTRUCTOR) {
            let options = this.get(type);
            if (!options) options = {
                parser: () => { throw new TypeError('not validatable') }
            }
            return options;
        },
    });

    type EXPANDED = typeof expanded;

    type D<T> = decorator.DECORATOR<'class', OPTIONS<T>>
    type FACTORY = {
        <T>(options: OPTIONS<T>): D<T>,
        <T>(parser : OPTIONS<T>["parser"]): D<T>,
    };

    return expanded as FACTORY & Pick<EXPANDED, typeof mr.get_registry | 'get' | 'get!'>
}

namespace botox_validatable_factory {
    export type VALIDATABLE = ReturnType<typeof botox_validatable_factory>;
}

export default botox_validatable_factory
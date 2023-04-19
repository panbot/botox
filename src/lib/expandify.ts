
function expandify<O extends {}>(o: O) {

    return Object.assign(o, {
        [expandify.expand]: <EXPANSION>(
            expander: ( (base: O) => EXPANSION ) | EXPANSION & ThisType<O & EXPANSION>
        ) => expandify(
            Object.assign(
                o,
                typeof expander == 'function' ? expander(o)
                                              : expander
            )
        ),
    })
}

namespace expandify {
    export const expand = Symbol('expandify.expand');
}

export default expandify;
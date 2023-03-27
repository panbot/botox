function expandify<O extends {}>(o: O) {

    return Object.assign(o, {
        [expandify.expand]: <EXPANSION extends {}>(
            by: ( (base: O) => EXPANSION ) | EXPANSION & ThisType<O & EXPANSION>
        ) => expandify(
            Object.assign(
                o,
                typeof by == 'function'
                    ? (by as (base: O) => EXPANSION)(o)
                    : by as EXPANSION
            )
        ),
    })
}

namespace expandify {
    export const expand = Symbol('expand of expandify');
}

export default expandify;
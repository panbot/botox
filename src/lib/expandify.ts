function expandify<O extends {}>(o: O) {
    return Object.assign(o, {
        [expandify.expand]: <Expansion>(
            by: (base: O) => Expansion,
        ) => expandify(Object.assign(o, by(o))),
    })
}

namespace expandify {
    export const expand = Symbol('expand of expandify');
}

export default expandify;
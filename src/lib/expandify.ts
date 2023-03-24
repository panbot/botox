function expandify<O extends {}>(o: O) {

    const expander: {
        <Expansion>(by: (base: O) => Expansion): O & Expansion,
        <Expansion>(by: Expansion & ThisType<O & Expansion>): O & Expansion,
    } = (
        by: any
    ) => Object.assign(o, typeof by == 'function' ? by(o) : by);

    return Object.assign(o, {
        [expandify.expand]: expander,
    })
}

namespace expandify {
    export const expand = Symbol('expand of expandify');
}

export default expandify;
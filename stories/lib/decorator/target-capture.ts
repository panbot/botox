
function my_decorator<T, K extends PropertyKey>(
    cb: (target: T, property: K) => {},
) {
    return function (target: T, property: K) {
        cb(target, property);
    }
}

class A {


    method() {

    }
}

export default null;
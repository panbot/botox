import decorator from "@/lib/decorator";
import { CONSTRUCTOR, IS } from "@/lib/types";
import * as asserts from "stories/asserts";

class Options {
    name?: string;
}

const class_decorator = decorator.create_class_decorator({
    init_by: (target, ...args) => {
        asserts.assert_true<IS<typeof target, CONSTRUCTOR<{}>>>();
        asserts.assert_true<IS<typeof args  , []>>();
        return new Options();
    },
    target: decorator.target<{}>(),
});

{
    type T = typeof class_decorator["get_registry"];
    asserts.assert_true  <IS<Parameters<T>[0], CONSTRUCTOR<{}>>>();
    asserts.assert_false <IS<Parameters<T>[0], {}>>();
}

@class_decorator()
    .name('test target')
class Target {

}

class Target2 {

}

console.log(class_decorator.get_registry(Target).get()?.name);

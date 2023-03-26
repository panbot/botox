import decorator from "@/lib/decorator";
import { CONSTRUCTOR, IS } from "@/lib/types";
import * as asserts from "stories/asserts";

class Options {
    name?: string;
}

const class_decorator = decorator.create_class_decorator({
    init_by: t => {
        asserts.assert_true<IS<typeof t, CONSTRUCTOR<{}>>>();
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

console.log(class_decorator.get_registry(Target).get()?.name);

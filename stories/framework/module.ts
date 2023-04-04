import factory from '@/framework/module';
import { CONSTRUCTOR } from '@/lib/types';

interface Module {
    init?(): Promise<void>
}

namespace btx {
    export const module = factory(
        (ctor: CONSTRUCTOR<Module>) => {

        }
    );
}

import module = btx.module;

@module()
export class MyModule {

}
console.log(module.get_options(MyModule));

@module({
    dependencies: () => [ MyModule3 ],
})
export class MyModule2 {

}
console.log(module.get_options(MyModule2));

@module(
).dependencies(
    () => [ MyModule ]
).controllers([

])
export class MyModule3 {

}
console.log(module.get_options(MyModule3));


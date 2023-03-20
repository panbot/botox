import { ModuleManager } from '@/framework/module';

let manager = new ModuleManager();
const Module = manager.createDecorator();

@Module({
    name: 'my module',
})
export class MyModule {

}
console.log(manager.getOptions(MyModule));

@Module(o => {
    o.dependencies = () => [ MyModule3 ];
}).name('my module 2')
export class MyModule2 {

}
console.log(manager.getOptions(MyModule2));

@Module().dependencies(() => [ MyModule ])
export class MyModule3 {

}
console.log(manager.getOptions(MyModule3));

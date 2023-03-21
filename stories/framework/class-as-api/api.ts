import { Api } from "./prepare";

@Api().name('my api')
class MyApi {
}

console.log(Api.getRegistry(MyApi).get());

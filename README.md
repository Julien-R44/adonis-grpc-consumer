<div align="center">
  <img src="https://i.imgur.com/iiuiVlq.png" width="250px" />  
  <br/>
  <h3>Adonis gRPC Consumer</h3>
  <p>Communicate easily with gRPC services in Adonis</p>
  <a href="https://www.npmjs.com/package/adonis-grpc-consumer">
    <img src="https://img.shields.io/npm/v/adonis-grpc-consumer.svg?style=for-the-badge&logo=npm" />
  </a>
  <img src="https://img.shields.io/npm/l/adonis-grpc-consumer?color=blueviolet&style=for-the-badge" />
  <img src="https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript" />
</div>

## Installation

```
npm i adonis-grpc-consumer
node ace configure adonis-grpc-consumer
```

## Usage Example

First of all, you need to create a "proto" folder at the root of your Adonis project in which you will obviously store your protobuf definition files.

my-app/proto/myService.proto :
```protobuf
syntax = "proto3";
package my_service;

message Empty {}
service MyService {
  rpc SendMessage (SendMessageRequest) returns (Empty) {};
}

message SendMessageRequest {
  string message = 1;
}
```

Now you have to generate the type definitions for typescript. To do this, run :
```
npx build-proto --longs=String --enums=String --defaults --oneofs --grpcLib=@grpc/grpc-js --outDir=./proto/ ./proto/*.proto
```
`build-proto` is an executable from `@grpc/proto-loader` package ( `proto-loader-gen-types` ) that is embedded in `adonis-grpc-consumer`.

If everything went well, in my-app/proto/ you should find your TS definition files next to your .proto file.

Now we go back to Adonis, we will add our freshly created service as a consumable service, in config/grpc-consumer.ts : 
```typescript
let grpcConfig: GrpcConsumerConfig = {
  verbose: true,
  clients: [
    {
      name: 'MY_SERVICE',
      options: {
        package: 'my_service',
        serviceName: 'MyService',
        protoPath: path.join(__dirname + '/../proto/myService.proto'),
        url: '127.0.0.1:4545', // Don't forget to add your service url here
      },
    },
  ],
}

export default grpcConfig
```

Try to launch your application, in case everything went well, you should see the following message (only with `verbose: true`):
```
[GRPC] Client MY_SERVICE connected !
```

To use our service and call the `SendMessage` function defined in the protobuf file, we do the following: 

```typescript
import GrpcConsumer, { grpc } from '@ioc:Adonis/Addons/GrpcConsumer'
import { MyServiceClient } from 'proto/my_service/MyService'

const client = GrpcConsumer.getClient<MyServiceClient>('MY_SERVICE')
client.SendMessage({ message: 'hello !' }, (error?: grpc.ServiceError) => {
    if (error) {
      console.error(error.message)
    }
  }
)
```

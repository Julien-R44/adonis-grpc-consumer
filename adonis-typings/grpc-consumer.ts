declare module '@ioc:Adonis/Addons/GrpcConsumer' {
  import { Options } from '@grpc/proto-loader'
  import { Client } from '@grpc/grpc-js'

  export * as grpc from '@grpc/grpc-js'

  export interface GrpcConsumerBaseContract {
    getClient<T extends Client>(name: string): T | undefined
    closeAll(): Promise<void>
  }

  export interface GrpcClientConfig {
    name: string
    options: {
      package: string
      protoPath: string
      serviceName: string
      url: string
      packageDefinitionOptions?: Options
    }
  }

  export interface GrpcConsumerConfig {
    clients: GrpcClientConfig[]
    verbose: boolean
  }

  const GrpcConsumer: GrpcConsumerBaseContract
  export default GrpcConsumer
}

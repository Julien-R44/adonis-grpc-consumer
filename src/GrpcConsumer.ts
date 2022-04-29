import type * as grpc from '@grpc/grpc-js'
import { loadPackageDefinition, credentials } from '@grpc/grpc-js'
import { load } from '@grpc/proto-loader'
import {
  GrpcClientConfig,
  GrpcConsumerConfig,
  GrpcConsumerBaseContract,
} from '@ioc:Adonis/Addons/GrpcConsumer'

interface GrpcClient<T extends grpc.Client> {
  client: T
  config: GrpcClientConfig
}

export class GrpcConsumer implements GrpcConsumerBaseContract {
  private clients: GrpcClient<grpc.Client>[] = []
  private config: GrpcConsumerConfig

  constructor(config: GrpcConsumerConfig) {
    this.config = config

    /**
     * For each configured client, let's create a gRPC client.
     */
    this.config.clients.forEach((client) => {
      if (config.verbose) {
        console.log(`[GRPC] Creating gRPC client: ${client.name}`)
      }

      this.createGrpcClient(client)
    })
  }

  private async createGrpcClient(config: GrpcClientConfig) {
    const { url, protoPath } = config.options

    /**
     * We load the proto file and create the package definition
     */
    const packageDefinition = await load(protoPath, config.options.packageDefinitionOptions)
    const proto = loadPackageDefinition(packageDefinition)

    const client = this.createClient(
      proto,
      config.options.package,
      config.options.serviceName,
      url,
      credentials.createInsecure()
    )

    if (this.config.verbose) {
      console.log(`[GRPC] Trying to connect to gRPC server ${config.name} at ${url}...`)
    }

    /**
     * We now try to connect to the gRPC server with a deadline.
     */
    const deadline = new Date()
    deadline.setSeconds(deadline.getSeconds() + 5)
    client.waitForReady(deadline, (error?: Error) => {
      if (error) {
        console.log(`[GRPC] Client ${config.name} connect error: ${error.message}`)
        return
      }

      if (this.config.verbose) {
        console.log(`[GRPC] Client ${config.name} connected !`)
      }

      this.clients.push({ client, config })
    })
  }

  /**
   * Split the package name into an array if it's a nested package.
   */
  private getPackageName(packageName: string): string | string[] {
    if (packageName.split('.').length > 1) {
      return packageName.split('.')
    } else {
      return packageName
    }
  }

  /**
   *  Returns the services from the given package. Handle nested package
   */
  private getServices(proto: any, packageName: string | string[]): any {
    if (packageName.length === 1) {
      return proto[packageName[0]]
    } else {
      return this.getServices(proto[packageName[0]], packageName.slice(1))
    }
  }

  /**
   * Creates a gRPC client.
   */
  private createClient(
    proto: any,
    packageName: string,
    serviceName: string,
    url: string,
    channelCredentials: grpc.ChannelCredentials
  ): grpc.Client {
    const name = this.getPackageName(packageName)
    const services = this.getServices(proto, name)
    return new services[serviceName](url, channelCredentials)
  }

  /**
   * Returns the gRPC client for the given name with good typings.
   */
  public getClient<T extends grpc.Client>(name: string): T | undefined {
    const foundClient = this.clients.find((client) => client.config.name === name)

    if (!foundClient) return
    return foundClient.client as T
  }

  /**
   * Closes all the gRPC clients.
   */
  public async closeAll(): Promise<void> {
    const promises = this.clients.map((client) => {
      if (this.config.verbose) {
        console.log(`[GRPC] Closing gRPC client: ${client.config.name}`)
      }

      return client.client.close()
    })

    await Promise.allSettled(promises)
  }
}

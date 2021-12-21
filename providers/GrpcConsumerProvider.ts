import { ApplicationContract } from '@ioc:Adonis/Core/Application'

export default class GrpcConsumerProvider {
  public static needsApplication = true
  constructor(protected app: ApplicationContract) {}

  /**
   * Register the grpc consumer binding
   */
  public register() {
    const config = this.app.container.resolveBinding('Adonis/Core/Config').get('grpc-consumer', {})
    this.app.container.singleton('Adonis/Addons/GrpcConsumer', () => {
      const { GrpcConsumer } = require('../src/GrpcConsumer')
      return new GrpcConsumer(config)
    })
  }

  /**
   * Gracefully close all grpc active connections
   */
  public async shutdown() {
    const grpcConsumer = this.app.container.use('Adonis/Addons/GrpcConsumer')
    await grpcConsumer.closeAll()
  }
}

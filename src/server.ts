import { fastifyCors } from "@fastify/cors"
import { fastifySwagger } from "@fastify/swagger"
import { fastifySwaggerUi } from "@fastify/swagger-ui"
import { fastify } from "fastify"
import {
  type ZodTypeProvider,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod"
import { QrCodeController } from "./controllers/qr-code-controller"
import { S3StorageAdapter } from "./infra/s3-storage-adapter"
import { QrCodeGeneratorService } from "./services/qr-code-generator-service"

async function main() {
  const app = fastify().withTypeProvider<ZodTypeProvider>()

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  app.register(fastifyCors, { origin: "*" })

  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "QRCode Genarator API",
        description: "API to generate QRCode",
        version: "0.1.0",
      },
    },
    transform: jsonSchemaTransform,
  })

  app.register(fastifySwaggerUi, {
    routePrefix: "/docs",
  })

  const bucket = process.env.AWS_BUCKET_NAME as string
  const region = process.env.AWS_REGION as string
  const storage = new S3StorageAdapter(region, bucket)
  const qrCodeService = new QrCodeGeneratorService(storage)

  const qrCodeController = QrCodeController(qrCodeService)
  app.register(qrCodeController)

  app.listen({ port: 3333, host: "0.0.0.0" }).then((address) => {
    console.log(`Server running on ${address}`)
  })
}

main()

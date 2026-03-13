import { z } from 'zod'

export const ConfigSchema = z.object({
  database: z.object({
    mysql: z.object({
      host: z.string().nonempty(),
      port: z.number().min(1).max(65535),
      user: z.string().nonempty(),
      password: z.string().nonempty(),
      database: z.string().nonempty()
    }),
    redis: z.object({
      host: z.string().nonempty(),
      port: z.number().min(1).max(65535)
    })
  }),
  server: z.object({
    host: z.string().min(1),
    port: z.number().min(1).max(65535)
  }),
  exporter: z.object({
    host: z.string().min(1),
    port: z.number().min(1).max(65535)
  })
})

export type ConfigType = z.infer<typeof ConfigSchema>

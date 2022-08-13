import { Application } from "stimulus"
import { Router } from "./router"
import { defaultSchema } from "./schema"

export function install(application: Application, schema = defaultSchema) {
  const router = new Router(application, { ...application.schema, ...schema })

  router.start()
}

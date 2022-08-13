import { Application } from "stimulus";
import { DOMTestCase } from "./dom_test_case"
import { install } from "../../index"

class TestApplication extends Application {
  handleError(error: Error, message: string, detail: object) {
    throw error
  }
}

export { Application }

export class ApplicationTestCase extends DOMTestCase {
  application!: Application

  async runTest(testName: string) {
    try {
      this.application = TestApplication.start(this.fixtureElement)
      this.setupApplication()
      this.application.start()
      install(this.application)
      await super.runTest(testName)
    } finally {
      this.application.stop()
    }
  }

  setupApplication() {
    // Override in subclasses to register controllers
  }
}

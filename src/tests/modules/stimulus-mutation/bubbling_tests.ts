import { Controller } from "stimulus"
import { ControllerTestCase } from "../../cases/controller_test_case"

class AriaController extends Controller {
  mutationsLog: MutationRecord[] = []

  log(mutation: MutationRecord) {
    this.mutationsLog.push(mutation)
  }
}

export default class BubblingTests extends ControllerTestCase(AriaController) {
  identifier = ["aria"]
  fixtureHTML = `
    <div data-controller="aria" data-mutation="aria#log:attributes">
      <button id="catchall" aria-expanded="false">Expand (descendant of [data-mutation="aria#log:attributes"])</button>
      <button id="descendant-catchall" aria-expanded="false" data-mutation="aria#log:attributes">Expand (declares [data-mutation="aria#log:attributes"])</button>
      <button id="descendant-hidden" data-mutation="hidden->aria#log">Expand (declares [data-mutation="hidden->aria#log"])</button>
      <button id="descendant-aria-expanded" aria-expanded="false" data-mutation="aria-expanded->aria#log">Expand (declares [data-mutation="aria-expanded->aria#log"])</button>
    </div>

    <button id="ignored">Expand (ignored)</button>
  `

  async "test routes all descendant mutations with catch all descriptor"() {
    const element = this.findElement("#catchall")

    await this.setAttribute(element, "aria-expanded", "true")

    const [ancestor, ...rest] = this.controller.mutationsLog

    this.assert.equal(ancestor.type, "attributes")
    this.assert.equal(ancestor.attributeName, "aria-expanded")
    this.assert.equal(ancestor.target, element)
    this.assert.equal(ancestor.oldValue, "false")
    this.assert.deepEqual(rest, [])
  }

  async "test bubbles all direct mutations with catch all descriptor"() {
    const element = this.findElement("#descendant-catchall")

    await this.setAttribute(element, "aria-expanded", "true")

    const [descendant, ancestor, ...rest] = this.controller.mutationsLog

    this.assert.ok(descendant, "dispatches for the descendant")
    this.assert.equal(descendant.attributeName, "aria-expanded")
    this.assert.equal(descendant.type, "attributes")
    this.assert.equal(descendant.target, element)
    this.assert.equal(descendant.oldValue, "false")
    this.assert.ok(ancestor, "dispatches for the ancestor")
    this.assert.equal(ancestor.attributeName, "aria-expanded")
    this.assert.equal(ancestor.type, "attributes")
    this.assert.equal(ancestor.target, element)
    this.assert.equal(ancestor.oldValue, "false")
    this.assert.deepEqual(rest, [])
  }

  async "test bubbles mutations that modify the declared attribute"() {
    const element = this.findElement("#descendant-hidden")

    await this.setAttribute(element, "hidden", "")

    const [descendant, ancestor, ...rest] = this.controller.mutationsLog

    this.assert.ok(descendant, "dispatches for the descendant")
    this.assert.equal(descendant.type, "attributes")
    this.assert.equal(descendant.attributeName, "hidden")
    this.assert.equal(descendant.target, element)
    this.assert.equal(descendant.oldValue, null)
    this.assert.ok(ancestor, "dispatches for the ancestor")
    this.assert.equal(ancestor.type, "attributes")
    this.assert.equal(descendant.attributeName, "hidden")
    this.assert.equal(ancestor.target, element)
    this.assert.equal(ancestor.oldValue, null)
    this.assert.deepEqual(rest, [])
  }

  async "test supports declarations with dashed attribute names"() {
    const element = this.findElement("#descendant-aria-expanded")

    await this.setAttribute(element, "aria-expanded", "true")

    const [descendant, ancestor, ...rest] = this.controller.mutationsLog

    this.assert.ok(descendant, "dispatches for the descendant")
    this.assert.equal(descendant.attributeName, "aria-expanded")
    this.assert.equal(descendant.type, "attributes")
    this.assert.equal(descendant.target, element)
    this.assert.equal(descendant.oldValue, "false")
    this.assert.ok(ancestor, "dispatches for the ancestor")
    this.assert.equal(ancestor.type, "attributes")
    this.assert.equal(ancestor.attributeName, "aria-expanded")
    this.assert.equal(ancestor.target, element)
    this.assert.equal(ancestor.oldValue, "false")
    this.assert.deepEqual(rest, [])
  }

  async "test observes changes to descriptor declarations"() {
    const element = this.findElement("#descendant-aria-expanded")

    await this.setAttribute(element, "data-mutation", "aria#log:childList")
    await this.setAttribute(element, "aria-expanded", "false")

    const [ancestor, ...rest] = this.controller.mutationsLog

    this.assert.ok(ancestor, "dispatches for the ancestor")
    this.assert.equal(ancestor.attributeName, "aria-expanded")
    this.assert.equal(ancestor.type, "attributes")
    this.assert.equal(ancestor.target, element)
    this.assert.equal(ancestor.oldValue, "false")
    this.assert.deepEqual(rest, [])
  }

  async "test observes added nodes with mutation descriptors"() {
    this.controller.element.insertAdjacentHTML("beforeend", `
      <button id="added-node" aria-expanded="false" data-mutation="aria-expanded->aria#log">New</button>
    `)
    const element = this.findElement("#added-node")

    await this.setAttribute(element, "aria-expanded", "true")

    const [ancestor, ...rest] = this.controller.mutationsLog

    this.assert.ok(ancestor, "dispatches for the ancestor")
    this.assert.equal(ancestor.attributeName, "aria-expanded")
    this.assert.equal(ancestor.type, "attributes")
    this.assert.equal(ancestor.target, element)
    this.assert.equal(ancestor.oldValue, "false")
    this.assert.deepEqual(rest, [])
  }

  async "test ignores mutations that do not modify the declared attribute"() {
    const element = this.findElement("#descendant-hidden")

    await this.setAttribute(element, "aria-expanded", "true")

    const [ancestor, ...rest] = this.controller.mutationsLog

    this.assert.ok(ancestor, "dispatches for the ancestor")
    this.assert.equal(ancestor.attributeName, "aria-expanded")
    this.assert.equal(ancestor.type, "attributes")
    this.assert.equal(ancestor.target, element)
    this.assert.equal(ancestor.oldValue, null)
    this.assert.deepEqual(rest, [], "ignores mutations that do not match descriptor attribute name")
  }

  async "test ignores mutations outside of controllers"() {
    const element = this.findElement("#ignored")

    await this.setAttribute(element, "aria-expanded", "true")

    this.assert.deepEqual(this.controller.mutationsLog, [])
  }
}

import { Controller } from "stimulus"
import { ControllerTestCase } from "../../cases/controller_test_case"
import { AttributeMutationRecord } from "../../../stimulus-mutation/mutation_record"

type MethodName = "attributeChanged" | "observedTargetAttributeChanged" | "log"
type AttributeName = string
type NewValue = string | null
type OldValue = string | null
type MutationLog = [MethodName, Element, AttributeName, NewValue, OldValue]

class AriaController extends Controller {
  static targets = ["observed"]

  mutationsLog: MutationLog[] = []

  attributeChanged(attributeName: string, newValue: string | null, oldValue: string | null) {
    this.mutationsLog.push(["attributeChanged", this.element, attributeName, newValue, oldValue])
  }

  observedTargetAttributeChanged(target: Element, attributeName: string, newValue: string | null, oldValue: string | null) {
    this.mutationsLog.push(["observedTargetAttributeChanged", target, attributeName, newValue, oldValue])
  }

  log({ attributeName, oldValue, target }: AttributeMutationRecord) {
    this.mutationsLog.push(["log", target, attributeName, target.getAttribute(attributeName), oldValue])
  }
}

export default class CallbackTests extends ControllerTestCase(AriaController) {
  identifier = ["aria"]
  fixtureHTML = `
    <div id="controller" data-controller="aria" data-mutation="hidden->aria#log">
      <button id="observed" data-aria-target="observed" aria-expanded="false">#observed</button>
      <button id="ignored">#ignored</button>
    </div>
  `

  async "test triggers attributeChanged callback"() {
    const element = this.findElement("#controller")

    await this.removeAttribute(element, "data-controller")
    await this.setAttribute(element, "data-controller", "aria")
    await this.setAttribute(element, "aria-expanded", "true")

    const [
      [methodName, target, attributeName, newValue, oldValue],
      ...rest
    ] = this.controller.mutationsLog

    this.assert.equal(methodName, "attributeChanged")
    this.assert.equal(target, element)
    this.assert.equal(attributeName, "aria-expanded")
    this.assert.equal(newValue, "true")
    this.assert.equal(oldValue, null)
    this.assert.deepEqual(rest, [])
  }

  async "test does not trigger attributeChanged callback when an identifier is removed from [data-controller]"() {
    const element = this.findElement("#controller")

    await this.removeAttribute(element, "data-controller")
    await this.setAttribute(element, "aria-expanded", "true")

    this.assert.deepEqual(this.controllers, [])
  }

  async "test triggers attributeChanged callback when an identifier is added to [data-controller]"() {
    const element = this.findElement("#controller")

    await this.setAttribute(element, "aria-expanded", "true")

    const [
      [methodName, target, attributeName, newValue, oldValue],
      ...rest
    ] = this.controller.mutationsLog

    this.assert.equal(methodName, "attributeChanged")
    this.assert.equal(target, element)
    this.assert.equal(attributeName, "aria-expanded")
    this.assert.equal(newValue, "true")
    this.assert.equal(oldValue, null)
    this.assert.deepEqual(rest, [])
  }

  async "test triggers [name]TargetAttributeChanged callback"() {
    const element = this.findElement("#observed")

    await this.setAttribute(element, "aria-expanded", "true")

    const [
      [methodName, target, attributeName, newValue, oldValue],
      ...rest
    ] = this.controller.mutationsLog

    this.assert.equal(methodName, "observedTargetAttributeChanged")
    this.assert.equal(target, element)
    this.assert.equal(attributeName, "aria-expanded")
    this.assert.equal(newValue, "true")
    this.assert.equal(oldValue, "false")
    this.assert.deepEqual(rest, [])
  }

  async "test ignores mutations that match an ancestor descriptor"() {
    const element = this.findElement("#ignored")

    await this.setAttribute(element, "hidden", "")

    const [
      [methodName, target, attributeName, newValue, oldValue],
      ...rest
    ] = this.controller.mutationsLog

    this.assert.equal(methodName, "log")
    this.assert.equal(target, element)
    this.assert.equal(attributeName, "hidden")
    this.assert.equal(newValue, "")
    this.assert.equal(oldValue, null)
    this.assert.deepEqual(rest, [])
  }

  async "test ignores mutations to elements that are not this.element or a target"() {
    const element = this.findElement("#ignored")

    await this.setAttribute(element, "aria-expanded", "true")

    const [...rest] = this.controller.mutationsLog

    this.assert.deepEqual(rest, [])
  }
}

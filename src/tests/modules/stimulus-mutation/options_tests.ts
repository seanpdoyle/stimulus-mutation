import { Controller } from "stimulus"
import { ControllerTestCase } from "../../cases/controller_test_case"

class AriaController extends Controller {
  mutationsLog: MutationRecord[] = []

  log(mutation: MutationRecord) {
    this.mutationsLog.push(mutation)
  }
}

export default class OptionsTests extends ControllerTestCase(AriaController) {
  identifier = ["aria"]
  fixtureHTML = `
    <div id="controller" data-controller="aria" data-mutation="aria-hidden->aria#log:!subtree aria#log:childList aria-expanded->aria#log:!attributes">
      <button id="button">#button</button>
    </div>
  `

  async "test :!subtree observes mutations on the element it's declared on"() {
    const element = this.findElement("#controller")

    await this.setAttribute(element, "aria-hidden", "true")

    const [mutation, ...rest] = this.controller.mutationsLog
    this.assert.equal(mutation.type, "attributes")
    this.assert.equal(mutation.target, element)
    this.assert.equal(mutation.oldValue, null)
    this.assert.deepEqual(rest, [])
  }

  async "test :!subtree ignores mutations on descendants"() {
    const element = this.findElement("#button")

    await this.setAttribute(element, "aria-hidden", "true")

    this.assert.deepEqual(this.controller.mutationsLog, [])
  }

  async "test :childList observes adding nodes"() {
    const element = this.findElement("#controller")
    const html = "<p>Appended</p>"

    element.insertAdjacentHTML("beforeend", html)
    await this.nextFrame

    const [mutation, ...rest] = this.controller.mutationsLog
    const [addedNode] = mutation.addedNodes
    this.assert.equal(mutation.type, "childList")
    this.assert.equal(mutation.target, element)
    this.assert.equal(addedNode instanceof Element ? addedNode.outerHTML : "", html)
    this.assert.deepEqual(rest, [])
  }

  async "test :childList observes removing nodes"() {
    const element = this.findElement("#controller")
    const button = this.findElement("#button")

    button.remove()
    await this.nextFrame

    const [mutation, ...rest] = this.controller.mutationsLog
    const [removedNode] = mutation.removedNodes
    this.assert.equal(mutation.type, "childList")
    this.assert.equal(mutation.target, element)
    this.assert.equal(removedNode instanceof Element ? removedNode.outerHTML : "", button.outerHTML)
    this.assert.deepEqual(rest, [])
  }
}

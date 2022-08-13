import { Application, Controller, Schema as StimulusSchema } from "stimulus"
import { Schema as StimulusMutationSchema } from "./schema"
import { AttributeMutationRecord, ChildListMutationRecord } from "./mutation_record"
import { MutationDescriptor, toCacheKey } from "./mutation_descriptor"
import { MutationCallbackObserver, MutationCallbackObserverDelegate } from "./mutation_callback_observer"
import { MutationDescriptorObserver, MutationDescriptorObserverDelegate } from "./mutation_descriptor_observer"
import { AttributeMutationObserver, AttributeMutationObserverDelegate} from "./attribute_mutation_observer"

export type Schema = StimulusSchema & StimulusMutationSchema

export class Router implements AttributeMutationObserverDelegate, MutationCallbackObserverDelegate, MutationDescriptorObserverDelegate {
  readonly application: Application
  readonly controllerAttribute: string
  readonly mutationAttribute: string
  readonly mutationCallbackObserver: MutationCallbackObserver
  readonly mutationDescriptorObserver: MutationDescriptorObserver
  readonly observers: Map<Element, Map<string, AttributeMutationObserver>>

    constructor(application: Application, schema: Schema) {
      this.application = application
      this.controllerAttribute = schema.controllerAttribute
      this.mutationAttribute = schema.mutationAttribute
      this.mutationDescriptorObserver = new MutationDescriptorObserver(this, this.application.element, this.mutationAttribute)
      this.mutationCallbackObserver = new MutationCallbackObserver(this, this.application.element, this.application)
      this.observers = new Map
    }

  start() {
    this.mutationCallbackObserver.start()
    this.mutationDescriptorObserver.start()

    for (const observerMap of this.observers.values()) {
      for (const observer of observerMap.values()) observer.start()
    }
  }

  stop() {
    for (const observerMap of this.observers.values()) {
      for (const observer of observerMap.values()) observer.stop()
    }
    this.mutationDescriptorObserver.stop()
    this.mutationCallbackObserver.stop()
  }

  mutationDescriptorsChanged(element: Element, newValues: Partial<MutationDescriptor>[], oldValues: Partial<MutationDescriptor>[]) {
    this.undefineRoute(element, oldValues)
    this.defineRoute(element, newValues)
  }

  mutationDescriptorsAdded(element: Element, descriptors: Partial<MutationDescriptor>[]) {
    this.defineRoute(element, descriptors)
  }

  mutationDescriptorsRemoved(element: Element, descriptors: Partial<MutationDescriptor>[]) {
    this.undefineRoute(element, descriptors)
  }

  defineRoute(element: Element, descriptors: Partial<MutationDescriptor>[]) {
    for (const descriptor of descriptors) {
      if (descriptor.target instanceof Element) {
        const key = toCacheKey(descriptor)
        const observerMap = this.observers.get(descriptor.target)

        if (observerMap) {
          const startedObserver = observerMap.get(key)

          if (startedObserver) startedObserver.stop()

          const observer = new AttributeMutationObserver(this, element, descriptor)
          observer.start()
          observerMap.set(key, observer)
        } else {
          const observer = new AttributeMutationObserver(this, element, descriptor)
          observer.start()
          this.observers.set(descriptor.target, new Map([[key, observer]]))
        }
      }
    }
  }

  undefineRoute(element: Element, descriptors: Partial<MutationDescriptor>[]) {
    for (const descriptor of descriptors) {
      if (descriptor.target instanceof Element) {
        const observerMap = this.observers.get(descriptor.target)

        if (observerMap) {
          const key = toCacheKey(descriptor)
          const startedObserver = observerMap.get(key)

          if (startedObserver) startedObserver.stop()

          observerMap.delete(key)

          if (observerMap.size == 0) this.observers.delete(descriptor.target)
        }
      }
    }
  }

  attributeMutatedOnController(controller: Controller, { attributeName, oldValue, target }: AttributeMutationRecord) {
    const callback = "attributeChanged"

    if (callback in controller) {
      (controller as any)[callback](attributeName, target.getAttribute(attributeName), oldValue)
    }
  }

  attributeMutatedOnTarget(controller: Controller, target: Element, targetName: string, { attributeName, oldValue }: AttributeMutationRecord) {
    const callback = `${targetName}TargetAttributeChanged`

    if (callback in controller) {
      (controller as any)[callback](target, attributeName, target.getAttribute(attributeName), oldValue)
    }
  }

  attributeMutationBubbled(element: Element, record: AttributeMutationRecord, descriptor: Partial<MutationDescriptor>) {
    if (record.attributeName != this.mutationAttribute) {
      this.dispatchMutationToController(element, record, descriptor)
    }
  }

  childListMutationBubbled(element: Element, record: ChildListMutationRecord, descriptor: Partial<MutationDescriptor>) {
    this.dispatchMutationToController(element, record, descriptor)
  }

  private dispatchMutationToController(element: Element, record: MutationRecord, { identifier, methodName }: Partial<MutationDescriptor>) {
    if (identifier && methodName) {
      const controllerElement = element.closest(`[${this.controllerAttribute}~="${identifier}"]`)

      if (controllerElement) {
        const controller = this.application.getControllerForElementAndIdentifier(controllerElement, identifier)

        if (controller && methodName in controller) {
          (controller as any)[methodName](record)
        }
      }
    }
  }
}

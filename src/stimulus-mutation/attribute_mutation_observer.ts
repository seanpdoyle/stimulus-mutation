import { AttributeMutationRecord, ChildListMutationRecord, isAttributeMutationRecord, isChildListMutationRecord } from "./mutation_record"
import { MutationDescriptor } from "./mutation_descriptor"

export interface AttributeMutationObserverDelegate {
  attributeMutationBubbled(element: Element, record: AttributeMutationRecord, descriptor: Partial<MutationDescriptor>): void
  childListMutationBubbled(element: Element, record: ChildListMutationRecord, descriptor: Partial<MutationDescriptor>): void
}

export class AttributeMutationObserver {
  readonly delegate: AttributeMutationObserverDelegate
  readonly element: Element
  readonly descriptor: Partial<MutationDescriptor>
  readonly observer: MutationObserver

  constructor(delegate: AttributeMutationObserverDelegate, element: Element, descriptor: Partial<MutationDescriptor>) {
    this.delegate = delegate
    this.element = element
    this.descriptor = descriptor
    this.observer = new MutationObserver(this.mutationObserved)
  }

  start() {
    try {
      this.observer.observe(this.element, this.mutationObserverInit)
    } catch (error) {
      if (error instanceof TypeError) return
      else throw error
    }
  }

  stop() {
    this.observer.disconnect()
  }

  mutationObserved = (mutationRecords: MutationRecord[]) => {
    const { target } = this.descriptor

    if (target instanceof Element) {
      for (const record of mutationRecords) {
        if (isAttributeMutationRecord(record)) {
          this.bubbleAttributeMutation(target, record)
        } else if (isChildListMutationRecord(record)) {
          this.bubbleChildListMutation(target, record)
        }
      }
    }
  }

  bubbleAttributeMutation(element: Element, record: AttributeMutationRecord) {
    this.delegate.attributeMutationBubbled(element, record, this.descriptor)
  }

  bubbleChildListMutation(element: Element, record: ChildListMutationRecord) {
    this.delegate.childListMutationBubbled(element, record, this.descriptor)
  }

  private get mutationObserverInit(): MutationObserverInit {
    const defaults = { subtree: true }
    const overrides = this.descriptor.mutationObserverInit || {}
    const attributeDefaults = overrides.attributes == false ?
      { attributes: false } :
      this.descriptor.attributeName ?
        { attributeFilter: [this.descriptor.attributeName], attributeOldValue: true } :
        overrides.attributes ?
          { attributeOldValue: true } :
          {}

    return { ...defaults, ...attributeDefaults, ...overrides }
  }
}

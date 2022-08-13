import { Application, Controller } from "stimulus"
import { AttributeMutationRecord, isAttributeMutationRecord } from "./mutation_record"
import { parseTokenString } from "./utilities"

export type ControllerWithAttributeChangedCallback = Controller & {
  attributeChanged: (attributeName: string, newValue: string | null, oldValue: string | null) => void
}

export interface MutationCallbackObserverDelegate {
  attributeMutatedOnController(controller: Controller, record: AttributeMutationRecord): void
  attributeMutatedOnTarget(controller: Controller, target: Element, targetName: string, record: AttributeMutationRecord): void
}

export class MutationCallbackObserver {
  readonly delegate: MutationCallbackObserverDelegate
  readonly element: Element
  readonly application: Application
  readonly observer: MutationObserver

  constructor(delegate: MutationCallbackObserverDelegate, element: Element, application: Application) {
    this.delegate = delegate
    this.element = element
    this.application = application
    this.observer = new MutationObserver(this.mutationObserved)
  }

  start(): void {
    this.observer.observe(this.element, { subtree: true, childList: true, attributeOldValue: true })
  }

  stop(): void {
    this.observer.disconnect()
  }

  mutationObserved = (records: MutationRecord[]) => {
    for (const record of records) {
      if (isAttributeMutationRecord(record) && record.attributeName != this.controllerAttribute) {
        if (record.target.hasAttribute(this.controllerAttribute)) {
          const identifierTokens = record.target.getAttribute(this.controllerAttribute) || ""
          for (const identifier of parseTokenString(identifierTokens)) {
            for (const controller of this.controllersForMutationRecord(record, identifier)) {
              if (isControllerWithAttributeChangeCallback(controller)) {
                this.delegate.attributeMutatedOnController(controller, record)
              }
            }
          }
        } else {
          for (const [controller, target, targetName] of this.targetsFromMutationRecord(record)) {
            this.delegate.attributeMutatedOnTarget(controller, target, targetName, record)
          }
        }
      }
    }
  }

  controllersForMutationRecord({ target }: AttributeMutationRecord, identifier?: string): Controller[] {
    const controllers: Controller[] = []

    if (identifier) {
      const controller = this.application.getControllerForElementAndIdentifier(target, identifier)

      if (controller) {
        controllers.push(controller)
      }
    } else {
      const controllerElement = target.closest(`[${this.controllerAttribute}]`)
      if (controllerElement) {
        const identifierTokens = controllerElement.getAttribute(this.controllerAttribute) || ""
        for (const identifier of parseTokenString(identifierTokens)) {
          const controller = this.application.getControllerForElementAndIdentifier(controllerElement, identifier)

          if (controller) {
            controllers.push(controller)
          }
        }
      }
    }

    return controllers
  }

  targetsFromMutationRecord(record: AttributeMutationRecord): Target[] | [] {
    const targets: Target[] = []

    for (const controller of this.controllersForMutationRecord(record)) {
      const targetAttribute = `data-${controller.identifier}-target`

      const targetTokens = record.target.getAttribute(targetAttribute) || ""
      for (const token of parseTokenString(targetTokens)) {
        targets.push([controller, record.target, token])
      }
    }

    return targets
  }

  get controllerAttribute(): string {
    return this.application.schema.controllerAttribute
  }
}

type TargetElement = Element
type TargetName = string
type Target = [Controller, TargetElement, TargetName]

function isControllerWithAttributeChangeCallback(controller: Controller | null): controller is ControllerWithAttributeChangedCallback {
  return !!controller && "attributeChanged" in controller
}

// Define qtiCustomInteractionContext in the iFrame's global window variable.
const qtiCustomInteractionContext = {

  // An associative array holding the registered PCI's.
  // HOWEVER, because this communication bridge is iFramed, there is never
  // going to be more than one PCI registered.
  customInteractions: {},

  /**
   * - Communication Bridge API: register
   *
   * This REQUIRED bridge method is called during the loading of a PCI factory
   * to register the PCI Factory of the specified type with the
   * Delivery Engine.
   *
   * @param {Object} factory - A PCI factory object.
   * NOTE:  This is NOT AN INSTANCE.
   */
  register (factory) {
    console.log(
      '[PCI Context] Interaction Registered: ' +
      factory.typeIdentifier)
    // It is essential for the PCI factory
    // object's 'typeIdentifier' property to match the
    this.customInteractions[pci_factory.typeIdentifier] = factory
  },

  /**
   * - Communication Bridge API: getInstance
   *
   * This REQUIRED bridge method is called by to create a new instance of
   * a PCI of the specified type.  In effect, this launches a PCI instance with
   * the provided parameters, including a configuration.
   *
   * @param {string} typeIdentifier - The PCI type to create. Must be
   * the same value as the custom-interaction-type-identifier attribute of
   * the qti-portable-custom-interaction element.
   * @param {HTMLElement} dom - The DOM element where the contents of
   * qti-interaction-markup element from the qti-portable-interaction element
   * has been rendered.
   * @param {Object.<string, Object>} configuration - A PCI
   * configuration object.
   * @param {*} state - A representation of the state of the PCI
   * which the PCI will later accept in a getInstance call to recreate
   * an equivalent interaction state.
   */
  getInstance (typeIdentifier, dom, configuration, state) {
    console.log(
      '[PCI Context] Interaction GetInstance: ' +
      typeIdentifier)

    // Get the registered PCI factory from the customInteractions associative
    // array by using the typeIdentifier as the key.
    const factory = this.customInteractions[typeIdentifier]

    // It is considered BEST PRACTICE to obtain the PCI instance
    // in the notifyReadyCallback method as many PCI implementations do not
    // return an instance from their getInstance method implementations.
    // See the notifyReadyCallback method to get the PCI instance.
    factory.getInstance(dom, configuration, state)

    // DEPRECATED getInstance usage.
    // DO NOT RELY on a PCI's getInstance method to return an instance.
    // See the notifyReadyCallback method to get a handle on the PCI instance.
    // const instance = factory.getInstance(dom, configuration, state)
  },

  /**
   * - Communication Bridge API: notifyReadyCallback
   *
   * This callback function is passed to a PCI factory in a getInstance call
   * using the configuration parameter's required "onready" property.
   * This function MUST be called by a PCI instance to inform the delivery
   * engine that the PCI is ready to be used.
   *
   * @callback notifyReadyCallback
   * @param {Object} instance - The PCI instance.
   * @param {*} state - A representation of the state of the PCI
   * which the PCI factory will later accept in a subsequent
   * getInstance call to recreate an equivalent interaction state.
   */
  notifyReadyCallback (instance, state) {
    console.log(
      '[PCI Context] Interaction Ready: ' +
      instance.typeIdentifier)

    // IMPORTANT: Pass the instance back to the DELIVERY_PCI_API.
    // "DELIVERY_PCI_API" is a custom object the delivery platform uses
    // to send messages (typically via window.postMessage) between this
    // iFrame and the delivery platform's parent item container which is
    // managing all PCI's in an item.
    // DELIVERY_PCI_API.NotifyPciReady(instance, state)
  },

  /**
   * - Communication Bridge API: notifyDoneCallback
   *
   * This callback function is passed to a PCI factory in a getInstance call
   * using the configuration parameter's OPTIONAL "ondone" property. If
   * provided, the notifyDoneCallback method is called by a PCI instance to
   * notify its end. The function exists in the event a PCI has a determinate
   * end; e.g., to simulate what happens in a QtiEndAttemptInteraction.
   *
   * @callback notifyDoneCallback
   * @param {Object} instance - The PCI instance.
   * @param {Object} response - The final response value of the PCI.
   * @param {*} state - A representation of the final state of the PCI
   *                    which the customInteraction will later accept in a
   *                    getInstance call to recreate an equivalent interaction
   *                    state.
   * @param {String} status - The status of the PCI.
   */
  notifyDoneCallback (instance, response, state, status) {
    console.log(
      '[PCI Context] Interaction Done: ' +
      instance.typeIdentifier)

    // "DELIVERY_PCI_API" is a custom object the delivery platform uses
    // to send messages (typically via window.postMessage) between this
    // iFrame and the delivery platform's parent item container.
    // DELIVERY_PCI_API.NotifyPciDone(instance, response, state, status)
  },

  /**
   * Method used by the delivery engine to notify the PCI instance that it
   * is being destroyed via the Communication Bridge.
   * If the PCI is interested in being notified it will provide a function
   * to implement oncompleted.
   * @param {Object} instance - The PCI instance.
   */
  oncompleted (instance) {
    // Fire the instance's oncompleted method if available.
    if ((typeof instance.oncompleted !== 'undefined') &&
      (typeof instance.oncompleted === 'function')) {
      console.log(
        '[PCI Context] Firing Interaction oncompleted: ' +
        instance.typeIdentifier)
      instance.oncompleted()
    }
  },

  /**
   * Allow the delivery engine to notify the PCI instance that there has been
   * a change to the rendering properties AFTER the PCI instance has been
   * created via getInstance.
   * If the PCI is interested in being notified it will provide a function
   * to implement setRenderingProperties.
   *
   * @param {Object} instance - The PCI instance.
   * @param {Object} properties Properties is an Object consisting of two
   * properties: 'pnp' and 'status'
   * {
   *   pnp: { "access-for-all-pnp": { <afapnp> } },
   *   status: "<item lifecycle status>" // 'initial' | 'interacting' | 'closed' | 'review' | 'solution'
   * }
   */
  setRenderingProperties (instance, properties) {
    // Fire the instance's optional setRenderingProperties method if available.
    if ((typeof instance.setRenderingProperties !== 'undefined') &&
      (typeof instance.setRenderingProperties === 'function')) {
      console.log(
        '[PCI Context] Interaction SetRenderingProperties:',
        properties)
      instance.setRenderingProperties(properties)
    }
  },

  /**
   * Allow the delivery engine to check the validity of the PCI instance.
   * If the PCI provides a checkValidity function then use that function.
   * Otherwise, return boolean true (is valid).
   *
   * @param {Object} instance - The PCI instance.
   * @return {Boolean} isValid - true if valid, false if not valid.
   */
  checkValidity (instance) {
    // default to true
    let isValid = true
    // Fire the instance's optional checkValidity method if available.
    if ((typeof instance.checkValidity !== 'undefined') &&
      (typeof instance.checkValidity === 'function')) {
      isValid = instance.checkValidity()
    }
    return isValid
  },

  /**
   * Allow the delivery engine to get the custom validity message of the PCI
   * instance. If the PCI provides a getCustomValidity function then use that
   * function.  Otherwise, return the empty string.
   *
   * @param {Object} instance - The PCI instance.
   * @return {String} message - A custom validity message or an empty string.
   */
  getCustomValidityMessage (instance) {
    let message = ''
    // Fire the instance's optional getCustomValidity method if available.
    if ((typeof instance.getCustomValidity !== 'undefined') &&
      (typeof instance.getCustomValidity === 'function')) {
      message = instance.getCustomValidity()
    }
    return message
  }

} // end qtiCustomInteractionContext definition

// IMPORTANT: Make the qtiCustomInteractionContext object available to AMD.
define('qtiCustomInteractionContext', [], function() {
  // Return the qtiCustomInteractionContext defined in the
  // iFrame's window object.
  return qtiCustomInteractionContext
})

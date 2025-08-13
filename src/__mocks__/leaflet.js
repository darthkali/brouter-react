class MockControl {
  constructor(options) {
    this.options = options;
  }
  
  onAdd() {
    return document.createElement('div');
  }
  
  onRemove() {}
  
  addTo() {
    return this;
  }
  
  remove() {
    return this;
  }
}

const L = {
  Icon: {
    Default: {
      prototype: {},
      mergeOptions: jest.fn(),
    }
  },
  Control: MockControl,
  DomUtil: {
    create: jest.fn(() => document.createElement('div'))
  },
  DomEvent: {
    disableClickPropagation: jest.fn(),
    disableScrollPropagation: jest.fn()
  },
  polyline: jest.fn(() => ({
    addTo: jest.fn(),
    getElement: jest.fn(() => document.createElement('path')),
    remove: jest.fn()
  }))
};

module.exports = L;
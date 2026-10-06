
class State {
  constructor() {
    this.data = {
      selectedComponent: null,
      currentForecast: null,
      networkData: null,
      simulationResults: null
    };
    this.listeners = [];
  }
  
  set(key, value) {
    this.data[key] = value;
    this.notify(key, value);
  }
  
  get(key) {
    return this.data[key];
  }
  
  subscribe(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }
  
  notify(key, value) {
    this.listeners.forEach(fn => fn(key, value));
  }
}
export const state = new State();

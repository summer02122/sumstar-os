const zustand = require("zustand/vanilla");
const store = zustand.createStore(() => ({
  initialized: true,
  isInitializing: false,
  tasks: [],
  initialize: async (force) => {
    const state = store.getState();
    if (state.isInitializing || (!force && state.initialized)) {
      console.log("Initialize ignored");
      return;
    }
    store.setState({ isInitializing: true });
    console.log("Fetching data...");
    
    // Simulating a DB read taking time. We capture the DB state at the moment the query hits the DB.
    // Let's say the query hits the DB immediately.
    const snapshot = [...global.mockDB]; 
    
    await new Promise(r => setTimeout(r, 100)); // Simulate network latency sending data back
    
    // Fetch data from some mock DB
    store.setState({ tasks: snapshot, isInitializing: false });
    console.log("Fetch complete, tasks:", snapshot);
  }
}));

global.mockDB = ["Task 1"];

async function run() {
  console.log("Initial state:", store.getState().tasks);
  
  // Event 1
  console.log("DB updated to Event 1");
  global.mockDB = ["Task 1", "Task 2"];
  store.getState().initialize(true);
  
  await new Promise(r => setTimeout(r, 50)); // Delay between events. Network request is still in flight.
  
  // Event 2 (while fetching)
  console.log("DB updated to Event 2");
  global.mockDB = ["Task 1", "Task 2", "Task 3"];
  store.getState().initialize(true); // Should be ignored
  
  await new Promise(r => setTimeout(r, 100)); // Wait for all
  
  console.log("Final store state:", store.getState().tasks);
  console.log("Expected DB state:", global.mockDB);
}
run();

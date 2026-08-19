const zustand = require("zustand/vanilla");
let subscriptionCount = 0;

const store = zustand.createStore(() => ({
  initialized: true,
  isInitializing: false,
  tasks: [],
  initialize: async (force) => {
    const state = store.getState();
    if (state.isInitializing || (!force && state.initialized)) {
      return;
    }
    store.setState({ isInitializing: true });
    await new Promise(r => setTimeout(r, 10)); // simulate fetch
    
    // Simulating Realtime Sync inside initialize
    subscriptionCount++;
    const currentSubCount = subscriptionCount;
    // mock subscription handler
    global.mockSupabaseEvent = () => {
      store.getState().initialize(true);
    };
    
    store.setState({ isInitializing: false });
    console.log("Initialize finished. Total subscriptions:", currentSubCount);
  }
}));

async function run() {
  await store.getState().initialize(true);
  
  console.log("Firing event 1");
  // Firing event (all subscriptions receive it)
  for (let i = 0; i < subscriptionCount; i++) global.mockSupabaseEvent();
  await new Promise(r => setTimeout(r, 50));
  
  console.log("Firing event 2");
  const countAtEvent2 = subscriptionCount;
  for (let i = 0; i < countAtEvent2; i++) global.mockSupabaseEvent();
  await new Promise(r => setTimeout(r, 50));
}
run();

export const useRegisterSW = () => ({
  needRefresh: [false, () => {}],
  offlineReady: [false, () => {}],
  updateServiceWorker: () => Promise.resolve()
})

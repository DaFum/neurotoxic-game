/* eslint-disable @eslint-react/no-unnecessary-use-prefix */
export const useRegisterSW = () => ({
  needRefresh: [false, () => {}],
  offlineReady: [false, () => {}],
  updateServiceWorker: () => Promise.resolve()
})

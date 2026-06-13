(async () => {
  const { handleBloodBankDonate } = await import('./src/context/reducers/clinicReducer.ts');
  const getInitialState = () => ({
    player: {
      money: 100
    },
    band: {
      harmony: 80,
      members: [
        { id: 'm1', stamina: 80, staminaMax: 100 },
        { id: 'm2', stamina: 50, staminaMax: 100 }
      ]
    },
    social: {
      controversyLevel: 10
    },
    toasts: []
  })
    const initialState = getInitialState()
    initialState.band.harmony = 10

    const payload = {
      moneyGain: 100,
      harmonyCost: 50, // 10 > 50 is false — guard rejects
      staminaCost: 0,
      controversyGain: 0
    }

    const result = handleBloodBankDonate(initialState, payload)

    console.log(result === initialState)

})();

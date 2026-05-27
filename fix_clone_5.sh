sed -i 's/Object.assign({},/Object.assign(Object.create(null),/g' src/context/reducers/systemReducer.ts

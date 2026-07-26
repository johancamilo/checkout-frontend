export default {
  isTransactionFinal: (state) =>
    ['APPROVED', 'DECLINED', 'ERROR'].includes(state.transaction?.status),
};
const Transaction = require('../wallet/transaction');
const {MINING_REWARD } = require('../config');

class TransactionMiner {
  constructor({ blockchain, transactionPool, wallet, pubsub }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;
    this.pubsub = pubsub;
  }

  static getInputAddressArray({ chain }){
    var input_address_array = [];
    for (let i=chain.length-1; i>0; i--){
      const block = chain[i];
      for (let transaction of block.data) {
        var index = input_address_array.findIndex(item => item === transaction.input.address)
        if(index === -1){
          input_address_array.push(transaction.input.address)
        }
      }
    }
    return input_address_array;
  }

  mineTransactions() {
    let chain =  this.blockchain.chain;

    var input_address_array = [];
    for (let i=chain.length-1; i>0; i--){
      const block = chain[i];
      for (let transaction of block.data) {
        var index = input_address_array.findIndex(item => item === transaction.input.address)
        if(index === -1){
          input_address_array.push(transaction.input.address)
        }
      }
    }

    var begin_reward = MINING_REWARD;
    let myReward
    if (input_address_array.length == 0) myReward = begin_reward;
    else if (input_address_array.length >0 && input_address_array.length<= 10) myReward = parseInt(begin_reward/2);
    else if (input_address_array.length >10 && input_address_array.length<= 100) myReward = parseInt(begin_reward/2**2);
    else if (input_address_array.length >100 && input_address_array.length<= 500) myReward = parseInt(begin_reward/2**3);
    else if (input_address_array.length >500 && input_address_array.length<= 1000) myReward = parseInt(begin_reward/2**4);
    const validTransactions = this.transactionPool.validTransactions();

    validTransactions.push(
      Transaction.rewardTransaction({ minerWallet: this.wallet, miningReward: myReward})
    );

    this.blockchain.addBlock({ data: validTransactions });

    this.pubsub.broadcastChain();

    this.transactionPool.clear();
  }
}

module.exports = TransactionMiner;

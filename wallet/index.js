const Transaction = require('./transaction');

const { STARTING_BALANCE } = require('../config');
const { ec, cryptoHash } = require('../util');

class Wallet {
  constructor() {
    
    this.balance = STARTING_BALANCE;

    this.keyPair = ec.genKeyPair();

    this.publicKey = this.keyPair.getPublic().encode('hex');
  }

  sign(data) {
    return this.keyPair.sign(cryptoHash(data))
  }

  createTransaction({ recipient, amount, chain }) {
    if (chain) {
      this.balance = Wallet.calculateBalance({
        chain,
        address: this.publicKey
      });
    }

    if (amount > this.balance) {
      throw new Error('Amount exceeds balance');
    }

    return new Transaction({ senderWallet: this, recipient, amount });
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

  static calculateBalance({ chain, address }) {
    let hasConductedTransaction = false;
    let outputsTotal = 0;
    let input_address_array = this.getInputAddressArray({ chain });
    var begin_value = STARTING_BALANCE;
    let initialBalance
    if (input_address_array.length == 0) initialBalance = begin_value;
    else if (input_address_array.length >0 && input_address_array.length<= 10) initialBalance = parseInt(begin_value/2);
    else if (input_address_array.length >10 && input_address_array.length<= 100) initialBalance = parseInt(begin_value/2**2);
    else if (input_address_array.length >100 && input_address_array.length<= 500) initialBalance = parseInt(begin_value/2**3);
    else if (input_address_array.length >500 && input_address_array.length<= 1000) initialBalance = parseInt(begin_value/2**4);

    for (let i=chain.length-1; i>0; i--) {
      const block = chain[i];

      for (let transaction of block.data) {
        if (transaction.input.address === address) {
          hasConductedTransaction = true;
        }

        const addressOutput = transaction.outputMap[address];

        if (addressOutput) {
          outputsTotal = outputsTotal + addressOutput;
        }
      }

      if (hasConductedTransaction) {
        break;
      }
    }

    return hasConductedTransaction ? outputsTotal : initialBalance + outputsTotal;
  }
};

module.exports = Wallet;
use cardano/transaction.{OutputReference, Transaction}

validator minimal {
  spend(_d: Option<Data>, _r: Data, _o: OutputReference, _c: Transaction) {
    True
  }
}


export const Exchanges = {
  AUTH_EVENTS: "auth.events",
  TRANSACTION_EVENTS: "transaction.events",
} as const;

export const RoutingKeys = {
  USER_SIGNUP: "user.signup",

  TRANSACTION_CREATED: "transaction.created",
  TRANSACTION_COMPLETED: "transaction.completed",
  TRANSACTION_FAILED: "transaction.failed",

  WALLET_TRANSACTION_FINALIZED: "wallet.transactionFinalized",
} as const;

export const Queues = {
  EMAIL_SIGNUP: "email.signup.q",

  TRANSACTION_CREATED: "transaction.created.q",

  WALLET_UPDATE: "wallet.update.q",
  WALLET_REVERT: "wallet.revert.q",
  WALLET_USER_CREATED: "wallet.user.q",

  EMAIL_TX_COMPLETED: "email.transactionCompleted.q",
  EMAIL_TX_FAILED: "email.transactionFailed.q",

  TRANSACTION_FINALIZED: "transaction.finalized.q",
} as const;

export const Bindings = [
  { queue: Queues.EMAIL_SIGNUP, exchange: Exchanges.AUTH_EVENTS, key: RoutingKeys.USER_SIGNUP },
  { queue: Queues.WALLET_USER_CREATED, exchange: Exchanges.AUTH_EVENTS, key: RoutingKeys.USER_SIGNUP },

  { queue: Queues.TRANSACTION_CREATED, exchange: Exchanges.TRANSACTION_EVENTS, key: RoutingKeys.TRANSACTION_CREATED },

  { queue: Queues.WALLET_UPDATE, exchange: Exchanges.TRANSACTION_EVENTS, key: RoutingKeys.TRANSACTION_COMPLETED },
  { queue: Queues.WALLET_REVERT, exchange: Exchanges.TRANSACTION_EVENTS, key: RoutingKeys.TRANSACTION_FAILED },

  { queue: Queues.EMAIL_TX_COMPLETED, exchange: Exchanges.TRANSACTION_EVENTS, key: RoutingKeys.TRANSACTION_COMPLETED },
  { queue: Queues.EMAIL_TX_FAILED, exchange: Exchanges.TRANSACTION_EVENTS, key: RoutingKeys.TRANSACTION_FAILED },
  {
    queue: Queues.TRANSACTION_FINALIZED,
    exchange: Exchanges.TRANSACTION_EVENTS,
    key: RoutingKeys.WALLET_TRANSACTION_FINALIZED,
  },
];

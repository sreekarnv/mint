import { Queues } from "~/rabbitmq/topology";
import { UserResType } from "~/schemas/http/user.res.schema";
import { consume } from "~/rabbitmq/consumer";
import { ensureWalletExists } from "~/services/wallet.service";

export async function userSignupConsumer() {
  consume<UserResType>(Queues.WALLET_USER_CREATED, async (data) => {
    await ensureWalletExists(data.id);
  });
}

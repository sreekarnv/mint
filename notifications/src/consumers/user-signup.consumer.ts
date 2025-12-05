import { consume } from "~/rabbitmq/consumer";
import { Queues } from "~/rabbitmq/topology";
import { UserResType } from "~/schemas/http/user.schema";

export async function userSignupConsumer() {
  consume<UserResType>(Queues.EMAIL_SIGNUP, async (data) => {
    console.log({ data });
    // await sendSignupEmail(data);
  });
}

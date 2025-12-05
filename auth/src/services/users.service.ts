import { UserModel } from "~/models/user.model";
import { NotFoundError } from "~/utils/errors";

export async function getUserById(userId: string) {
  const user = await UserModel.findById(userId).select("-password");

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return user;
}

export async function updateUserProfile(userId: string, updates: { firstName?: string; middleName?: string; lastName?: string }) {
  const user = await UserModel.findByIdAndUpdate(
    userId,
    {
      $set: updates,
    },
    { new: true, runValidators: true },
  ).select("-password");

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return user;
}

export async function searchUsersByEmail(email: string) {
  const users = await UserModel.find({
    email: { $regex: email, $options: "i" },
    isActive: true,
  })
    .select("id firstName lastName email")
    .limit(10);

  return users;
}

export async function getPublicProfile(userId: string) {
  const user = await UserModel.findById(userId).select("id firstName lastName email");

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return user;
}

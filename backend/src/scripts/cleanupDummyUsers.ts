import mongoose from "mongoose";
import dotenv from "dotenv";
import DB_Name from "../constant.js";
import { User } from "../user/user.model.js";
import { Application } from "../application/application model.js";
import { SavedOpportunity } from "../saved Opportunity/saved opportunity model.js";
import { VerificationEmail } from "../auth/verificationToken.model.js";

dotenv.config({ path: "./.env" });

const cleanupDummyUsers = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`);
    console.log("Connected successfully!");

    // 1. Fetch all users to display
    const allUsers = await User.find({}).select(
      "FullName email role isEmailVerified createdAt"
    );
    console.log(`\nFound ${allUsers.length} total users in database:`);
    allUsers.forEach((u: any, i: number) => {
      console.log(
        `  [${i + 1}] ID: ${u._id} | Email: ${u.email} | Name: ${u.FullName} | Role: ${u.role} | Verified: ${u.isEmailVerified}`
      );
    });

    // Specify criteria for dummy users:
    // By default, keep all admins and only delete non-admin test/dummy users, or unverified users
    const dummyFilter: any = {
      role: { $ne: "admin" }, // Keep all admins safe
      $or: [
        { isEmailVerified: false }, // Unverified test accounts
        { email: { $regex: /(test|dummy|example|fake|temp)/i } }, // Test email patterns
      ],
    };

    const dummyUsers = await User.find(dummyFilter);
    console.log(
      `\nFound ${dummyUsers.length} dummy/test user(s) matching criteria:`
    );
    dummyUsers.forEach((u: any) =>
      console.log(`  - ${u.email} (${u.FullName})`)
    );

    if (dummyUsers.length === 0) {
      console.log("\nNo dummy users found matching the filter.");
      await mongoose.disconnect();
      return;
    }

    const dummyUserIds = dummyUsers.map((u: any) => u._id);

    // 2. Cascade delete related records
    const [deletedApps, deletedSaved, deletedTokens, deletedUsers] =
      await Promise.all([
        Application.deleteMany({ user: { $in: dummyUserIds } } as any),
        SavedOpportunity.deleteMany({ user: { $in: dummyUserIds } } as any),
        VerificationEmail.deleteMany({ userId: { $in: dummyUserIds } } as any),
        User.deleteMany({ _id: { $in: dummyUserIds } } as any),
      ]);

    console.log("\n✅ Cleanup Results:");
    console.log(`  - Deleted Users: ${deletedUsers.deletedCount}`);
    console.log(`  - Deleted Applications: ${deletedApps.deletedCount}`);
    console.log(
      `  - Deleted Saved Opportunities: ${deletedSaved.deletedCount}`
    );
    console.log(
      `  - Deleted Verification Tokens: ${deletedTokens.deletedCount}`
    );

    console.log("\n🎉 Dummy user data removed successfully!");
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

cleanupDummyUsers();

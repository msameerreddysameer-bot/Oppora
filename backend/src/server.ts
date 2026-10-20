import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(
        `Server is running on port ${PORT} -> http://localhost:${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error(
      "[Server Boot Error]: MongoDB connection failed:",
      (error as any)?.message || error
    );
    process.exit(1);
  });

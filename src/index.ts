import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import contentRoutes from "./routes/contents.route";

const app = express();
app.use(cors());
app.use(cookieParser());

app.use(express.json());

app.get("/", async (req, res) => {
  res.send("Hello World!");
});

app.use("/api/auth", authRoutes);
app.use("/api/contents", contentRoutes);

app.listen(3000, () => {
  console.log("App listening on port 3000!");
});

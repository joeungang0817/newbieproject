import express from "express";
import cors, { CorsOptions } from "cors";
import mysql from "mysql2/promise";
import path from "path";

import statusRouter from "./routes/status";
import authRouter from "./routes/auth";
import statuslog from "./middlewares/statuslog";
import authMiddleware from "./middlewares/auth"

const app = express();
const port = 8080;

app.use(express.json());

const whitelist = ["http://localhost:3000"];

const db = mysql.createPool({
  host: "localhost",
  user: "root", // MySQL 사용자 이름
  password: process.env.REACT_APP_DB_PASSWORD, // MySQL 비밀번호
  database: "healcome_KAIST_DB", // 데이터베이스 이름
});

async function testDbConnection() {
  try {
    await db.getConnection();  // DB에 연결
    console.log("MySQL 연결 성공");
  } catch (err) {
    console.error("MySQL 연결 실패:", err);
  }
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
} satisfies CorsOptions;

testDbConnection();

app.use(cors(corsOptions));
app.use(statuslog);
app.use("/status", statusRouter);
app.use("/auth", authRouter(db));

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

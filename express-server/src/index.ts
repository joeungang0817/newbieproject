import express from "express";
import cors, { CorsOptions } from "cors";
import mysql from "mysql2/promise";

import statusRouter from "./routes/status";
import authRouter from "./routes/auth";
import statuslog from "./middlewares/statuslog";
import authMiddleware from "./middlewares/auth"
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = 8080;

app.use(express.json());

const whitelist = ["http://localhost:3000"];

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER, // MySQL 사용자 이름
  password: process.env.DB_PASSWORD, // MySQL 비밀번호
  database: "healcome_kaist", // 데이터베이스 이름
});

async function testDbConnection() {
  try {
    await db.getConnection();  // DB에 연결
    console.log("MySQL 연결 성공");
  } catch (err) {
    console.error("MySQL 연결 실패:", err);
  }
}

const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // 도메인 허용 로직
    if (origin && whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("허용되지 않은 출처입니다."), false);
    }
  },
  credentials: true,
};

testDbConnection();

app.use(cors(corsOptions));
app.use(statuslog);
app.use("/status", statusRouter);
app.use("/auth", authRouter(db));

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

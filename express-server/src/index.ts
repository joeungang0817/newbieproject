import express from "express";
import cors, { CorsOptions } from "cors";
import mysql from "mysql2/promise";
import cookieParser from  "cookie-parser";

import statusRouter from "./routes/status";
import userRouter from "./routes/user"
import authRouter from "./routes/auth";
import gymsRouter from "./routes/gyms"
import logsRouter from "./routes/logs";
import routinesRouter from "./routes/routine";
import statuslog from "./middlewares/statuslog";
import authMiddleware from "./middlewares/auth"

import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = 20062;

app.use(express.json());
app.use(cookieParser());

const whitelist = ["http://newbies.sparcs.org:20082"];

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port :3306,
  user: process.env.DB_USER, // MySQL 사용자 이름
  password: process.env.DB_PASSWORD, // MySQL 비밀번호
  database: process.env.DB_NAME, // 데이터베이스 이름
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
    console.log('Request Origin:', origin); // 요청 Origin 로그
    if (!origin) {
      // 서버 간 통신이나 Origin이 없는 요청 허용
      callback(null, true);
      return;
    }
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("허용되지 않은 출처입니다."), false);
    }
  },
  credentials: true, // 쿠키 포함 허용
};

testDbConnection();

app.use(cors(corsOptions));
app.use(statuslog);
app.use("/status", statusRouter);
app.use("/auth", authRouter(db));
app.use("/user", authMiddleware(db),userRouter(db));
app.use("/gyms", authMiddleware(db), gymsRouter(db));
app.use("/routines",authMiddleware(db),routinesRouter(db));
app.use('/logs', authMiddleware(db),logsRouter(db));

app.listen(port, () => {
  console.log(`Server is running on http://newbies.sparcs.org:${port}`);
});

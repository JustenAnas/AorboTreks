
import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();

app.use(cors({ origin: "http://localhost:8080" }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AORBO Treks API is running",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

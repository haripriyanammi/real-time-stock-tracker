// backend/src/services/voiceServices.ts
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { s3 } from "../utils/aws"; // your existing s3 config

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function generateVoiceAlert(
  rawMessage: string,
  symbol: string
): Promise<{ text: string; audioUrl: string }> {
  const speechFile = path.resolve(`./temp_${Date.now()}.mp3`);
  try {
    // 1) Expand text
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a financial assistant..." },
        { role: "user", content: `Create an expanded stock alert for: ${rawMessage}, symbol: ${symbol}` },
      ],
    });
    const expandedText = completion.choices?.[0]?.message?.content || rawMessage;

    // 2) TTS -> file
    const ttsResponse = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: expandedText,
    });
    const buffer = Buffer.from(await ttsResponse.arrayBuffer());
    fs.writeFileSync(speechFile, buffer);

    // 3) Upload to S3 (no ACL)
    const fileKey = `alerts/${Date.now()}_${symbol}.mp3`;
    console.log("[voiceServices] uploading to S3:", { Bucket: process.env.AWS_BUCKET_NAME, Key: fileKey });

    const result = await s3.upload({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: fileKey,
      Body: fs.createReadStream(speechFile),
      ContentType: "audio/mpeg",
      // DO NOT set ACL here; bucket ownership settings may forbid ACLs
    }).promise();

    // 4) Clean up local temp file
    try { fs.unlinkSync(speechFile); } catch (e) { /* ignore */ }

    // 5) Build clean public URL (works if you have a bucket policy that allows public read)
    const audioUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    console.log("[voiceServices] uploaded, result:", result);
    return { text: expandedText, audioUrl };
  } catch (error) {
    // ensure temp file removed on error
    try { if (fs.existsSync(speechFile)) fs.unlinkSync(speechFile); } catch {}
    console.error("Error in generateVoiceAlert:", error);
    throw error;
  }
}

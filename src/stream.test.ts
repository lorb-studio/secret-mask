import { describe, it, expect } from "vitest";
import { Readable, Writable } from "node:stream";
import { createMaskStream } from "./stream.js";

function collectStream(transform: NodeJS.ReadWriteStream, input: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let output = "";
    const writable = new Writable({
      write(chunk, _encoding, callback) {
        output += chunk.toString();
        callback();
      },
    });
    writable.on("finish", () => resolve(output));
    writable.on("error", reject);

    const readable = Readable.from([input]);
    readable.pipe(transform).pipe(writable);
  });
}

describe("createMaskStream", () => {
  const salt = Buffer.from("test-stream-salt!!!!");

  it("masks secrets in streamed text", async () => {
    const stream = createMaskStream({ salt });
    const input = "API key: sk-abc123def456ghi789jkl012";
    const output = await collectStream(stream, input);

    expect(output).not.toContain("sk-abc123def456ghi789jkl012");
    expect(output).toContain("API key: ");
  });

  it("passes through text without secrets unchanged", async () => {
    const stream = createMaskStream({ salt });
    const input = "Hello world, no secrets here.";
    const output = await collectStream(stream, input);

    expect(output).toBe("Hello world, no secrets here.");
  });

  it("same secret gets same phrase in a single stream", async () => {
    const stream = createMaskStream({ salt });
    const secret = "sk-abc123def456ghi789jkl012";
    const input = `first: ${secret}\nsecond: ${secret}\n`;
    const output = await collectStream(stream, input);

    const lines = output.trim().split("\n");
    const phrase1 = lines[0].replace("first: ", "");
    const phrase2 = lines[1].replace("second: ", "");
    expect(phrase1).toBe(phrase2);
  });

  it("different secrets get different phrases", async () => {
    const stream = createMaskStream({ salt });
    const input = "a: sk-abc123def456ghi789jkl012\nb: AKIAIOSFODNN7EXAMPLE\n";
    const output = await collectStream(stream, input);

    const lines = output.trim().split("\n");
    const phrase1 = lines[0].replace("a: ", "");
    const phrase2 = lines[1].replace("b: ", "");
    expect(phrase1).not.toBe(phrase2);
  });

  it("handles multi-line input", async () => {
    const stream = createMaskStream({ salt });
    const input = [
      "Server running on http://localhost:3000",
      "DB: postgresql://admin:secret123@db.example.com:5432/mydb",
      "Ready.",
    ].join("\n");
    const output = await collectStream(stream, input);

    expect(output).toContain("Server running on http://localhost:3000");
    expect(output).not.toContain("admin:secret123@");
    expect(output).toContain("Ready.");
  });

  it("supports custom patterns", async () => {
    const stream = createMaskStream({
      salt,
      customPatterns: [/CUSTOM_SECRET_\w+/],
    });
    const input = "value: CUSTOM_SECRET_XYZ123";
    const output = await collectStream(stream, input);

    expect(output).not.toContain("CUSTOM_SECRET_XYZ123");
  });

  it("handles empty input", async () => {
    const stream = createMaskStream({ salt });
    const output = await collectStream(stream, "");
    expect(output).toBe("");
  });

  it("handles chunked input across boundaries", async () => {
    const stream = createMaskStream({ salt });
    const secret = "sk-abc123def456ghi789jkl012";

    return new Promise<void>((resolve, reject) => {
      let output = "";
      const writable = new Writable({
        write(chunk, _encoding, callback) {
          output += chunk.toString();
          callback();
        },
      });
      writable.on("finish", () => {
        try {
          expect(output).not.toContain(secret);
          resolve();
        } catch (e) {
          reject(e);
        }
      });

      stream.pipe(writable);

      // Write the secret in two chunks split mid-key
      const mid = Math.floor(secret.length / 2);
      stream.write(`key: ${secret.slice(0, mid)}`);
      stream.write(`${secret.slice(mid)}\n`);
      stream.end();
    });
  });
});

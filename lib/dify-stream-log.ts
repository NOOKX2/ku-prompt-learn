/**
 * ห่อสตรีมข้อความหลังแปลง SSE — ใน `next dev` จะ console.log ที่เทอร์มินัลเซิร์ฟเวอร์
 */

function devLog(): boolean {
  return process.env.NODE_ENV === "development";
}

export function wrapDifyTextOutForLogging(
  stream: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  if (!devLog()) return stream;

  const decoder = new TextDecoder();
  let acc = "";

  return stream.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        acc += decoder.decode(chunk, { stream: true });
        controller.enqueue(chunk);
      },
      flush() {
        acc += decoder.decode();
        const n = acc.length;
        console.log("[Dify API] ความยาวข้อความ (หลังแปลง SSE):", n);
        if (n > 12_000) {
          console.log(
            "[Dify API] เนื้อหา (ตัดกลาง — ยาวเกิน 12000 ตัว):",
            `${acc.slice(0, 4000)}\n…\n${acc.slice(-4000)}`,
          );
        } else {
          console.log("[Dify API] เนื้อหา:", acc);
        }
      },
    }),
  );
}
